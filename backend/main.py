"""
POD Multi-Agent System - FastAPI Application Entry Point

Usage:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    
Or run directly:
    python main.py
"""

import sys
import os
import logging
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api.schemas import HealthResponse, ErrorResponse
from api.routers import workflows_router, designs_router, listings_router
from config import load_config_from_env

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
    ]
)
logger = logging.getLogger(__name__)

# Check LangGraph availability
try:
    from langgraph.graph import StateGraph
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False
    logger.warning("LangGraph not installed. Workflow will use mock implementation.")

# Application version
VERSION = "1.0.0"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info(f"Starting POD Multi-Agent System API v{VERSION}")
    logger.info(f"LangGraph available: {LANGGRAPH_AVAILABLE}")
    
    # Load and validate config
    try:
        config = load_config_from_env()
        logger.info("Configuration loaded successfully")
    except Exception as e:
        logger.warning(f"Configuration warning: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down POD Multi-Agent System API")


# Create FastAPI app
app = FastAPI(
    title="POD Multi-Agent System API",
    description="""
## AI-Powered Print-on-Demand Automation

This API provides endpoints to manage the POD (Print-on-Demand) workflow powered by multiple AI agents.

### Features
- **Trend Analysis**: Analyze market trends using Claude 3.5 Sonnet
- **Design Generation**: Generate designs using DALL-E 3
- **Quality Check**: Automated quality validation with retry mechanism
- **Mockup Creation**: Create product mockups via Printful API
- **SEO Optimization**: Optimize listings for search
- **Platform Upload**: Publish to Etsy, Amazon, and more

### Workflow
1. Create a workflow with your niche and style preferences
2. Monitor progress via the streaming endpoint
3. Optionally approve designs before publishing (human-in-the-loop)
4. View generated designs and published listings
    """,
    version=VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Next.js dev server
        "http://127.0.0.1:3000",
        "http://localhost:5173",      # Vite dev server
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions"""
    logger.exception(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal Server Error",
            detail=str(exc) if app.debug else "An unexpected error occurred",
            code="INTERNAL_ERROR"
        ).model_dump()
    )


# Health check endpoint
@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["System"],
    summary="Health check",
    description="Check if the API is running and get system status."
)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version=VERSION,
        timestamp=datetime.now().isoformat(),
        langgraph_available=LANGGRAPH_AVAILABLE,
    )


# Root endpoint
@app.get(
    "/",
    tags=["System"],
    summary="API Information",
    description="Get basic API information and available endpoints."
)
async def root():
    """Root endpoint with API info"""
    return {
        "name": "POD Multi-Agent System API",
        "version": VERSION,
        "status": "running",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "workflows": "/api/v1/workflows",
            "designs": "/api/v1/designs",
            "listings": "/api/v1/listings",
        }
    }


# Include routers with /api/v1 prefix
app.include_router(workflows_router, prefix="/api/v1")
app.include_router(designs_router, prefix="/api/v1")
app.include_router(listings_router, prefix="/api/v1")


# Run with uvicorn when executed directly
if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment or default to 8000
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"Starting server on {host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info",
    )
