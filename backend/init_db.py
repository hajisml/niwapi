import os

import psycopg2
from dotenv import load_dotenv


def init_db():
    load_dotenv(dotenv_path="../.env")

    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL not found in .env. Add a local or Supabase Postgres connection string.")
        return

    print("Connecting to the database...")
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cursor = conn.cursor()

        print("Enabling PostGIS extension...")
        cursor.execute("CREATE EXTENSION IF NOT EXISTS postgis;")

        print("Creating reports table...")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id SERIAL PRIMARY KEY,
            image_url TEXT,
            location GEOMETRY(Point, 4326),
            severity INT,
            blockage_type VARCHAR(255),
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """)
        cursor.execute("ALTER TABLE reports ADD COLUMN IF NOT EXISTS details TEXT;")
        cursor.execute("ALTER TABLE reports ADD COLUMN IF NOT EXISTS culvert_importance INT DEFAULT 2;")
        cursor.execute("ALTER TABLE reports ADD COLUMN IF NOT EXISTS forecasted_rainfall_mm FLOAT;")
        cursor.execute("ALTER TABLE reports ADD COLUMN IF NOT EXISTS risk_score FLOAT;")
        cursor.execute("ALTER TABLE reports ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20);")
        cursor.execute("CREATE INDEX IF NOT EXISTS reports_location_idx ON reports USING GIST (location);")

        print("Creating sensors table...")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS sensors (
            id SERIAL PRIMARY KEY,
            location GEOMETRY(Point, 4326),
            clearance_distance FLOAT,
            last_reading TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """)
        cursor.execute("ALTER TABLE sensors ADD COLUMN IF NOT EXISTS label VARCHAR(255);")
        cursor.execute(
            "DO $$ BEGIN "
            "IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sensors_label_key') THEN "
            "ALTER TABLE sensors ADD CONSTRAINT sensors_label_key UNIQUE (label); "
            "END IF; END $$;"
        )
        cursor.execute("CREATE INDEX IF NOT EXISTS sensors_location_idx ON sensors USING GIST (location);")

        print("Creating work_orders table...")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS work_orders (
            id SERIAL PRIMARY KEY,
            report_id INT REFERENCES reports(id),
            assigned_team VARCHAR(255),
            status VARCHAR(50) DEFAULT 'dispatched',
            resolution_image_url TEXT,
            resolved_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """)

        print("Database schema initialized successfully!")

        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Failed to initialize database: {e}")


if __name__ == "__main__":
    init_db()
