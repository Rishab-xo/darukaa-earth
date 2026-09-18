import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
import auth
import projects

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Darukaa.Earth API")

# Setup CORS (Supports comma-separated origins from env or default to "*")
cors_origins_env = os.getenv("CORS_ORIGINS", "*")
origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)

@app.get("/")
def read_root():
    return {"status": "Backend is running!"}