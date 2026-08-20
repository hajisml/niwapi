import os
import psycopg2
from dotenv import load_dotenv

def init_db():
    load_dotenv(dotenv_path="../.env")
    
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL not found in .env. Please add your Supabase Postgres connection string.")
        return
        
    print("Connecting to the database...")
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Enable PostGIS extension
        print("Enabling PostGIS extension...")
        cursor.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
        
        # Create reports table
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
        
        # Create sensors table
        print("Creating sensors table...")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS sensors (
            id SERIAL PRIMARY KEY,
            location GEOMETRY(Point, 4326),
            clearance_distance FLOAT,
            last_reading TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
        # Create work_orders table
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
