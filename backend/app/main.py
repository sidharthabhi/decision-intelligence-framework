from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import auth, business, employees, upload, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    # runs once on startup — creates all DB tables
    init_db()
    yield
    # nothing to clean up on shutdown


app = FastAPI(
    title="Decision Intelligence Framework API",
    description="Employee Performance Evaluation System for SMEs — v2.0",
    version="2.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",   # fallback
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(business.router)
app.include_router(employees.router)
app.include_router(upload.router)
app.include_router(analytics.router)


# ── health ────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Decision Intelligence Framework API v2.0",
        "docs":    "/docs",
        "health":  "/health",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}