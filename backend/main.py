from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
import auth
import projects

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Darukaa.Earth API")

# Setup CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Change to Vercel URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)

@app.get("/")
def read_root():
    return {"status": "Backend is running!"}