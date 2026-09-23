from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import Base, engine
import app.models  # Ensures all SQLAlchemy models are registered
from app.api import (
    auth_router,
    categories_router,
    transactions_router,
    budgets_router,
    ai_router,
    analytics_router,
    admin_router
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables automatically on startup
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown logic if needed

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Full-stack AI/ML-Powered Financial Intelligence Platform with NLP Categorization, Forecasting & Anomaly Detection (MP Online Ltd Major Project).",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for React/Vite development & production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(categories_router, prefix=settings.API_V1_STR)
app.include_router(transactions_router, prefix=settings.API_V1_STR)
app.include_router(budgets_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)

# Also mount under root for direct fallback
app.include_router(auth_router)
app.include_router(categories_router)
app.include_router(transactions_router)
app.include_router(budgets_router)
app.include_router(ai_router)
app.include_router(analytics_router)
app.include_router(admin_router)



@app.get("/", tags=["System"])
def root():
    """Root endpoint welcoming developers and redirecting to interactive documentation."""
    return {
        "message": "Welcome to Expense Tracker with Smart Insighter API",
        "interactive_docs": "/docs",
        "redoc_docs": "/redoc",
        "frontend_ui": "http://localhost:5173",
        "status": "online"
    }

@app.get("/health", tags=["System"])
def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "ai_engine": "online"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
