from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .api import meta as meta_api
from .api import prompts as prompts_api
from .api import io as io_api
from .api import profile as profile_api
from .database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="PromptSmith", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prompts_api.router)
app.include_router(meta_api.router)
app.include_router(io_api.router)
app.include_router(profile_api.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend"
if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")