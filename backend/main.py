from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import db
from routers import reports, sensors, work_orders
from storage import MEDIA_DIR

load_dotenv(dotenv_path="../.env")

app = FastAPI(
    title="NiWapi API",
    description="Climate Risk & Proactive Drainage Resilience Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MEDIA_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")

app.include_router(reports.router)
app.include_router(sensors.router)
app.include_router(work_orders.router)


@app.get("/")
def read_root():
    return {"message": "Welcome to NiWapi API"}


@app.get("/health")
def health_check():
    return {"status": "ok", "database_connected": db.ping()}
