from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
import os
import logging

router = APIRouter(prefix="/utils", tags=["Utils"])
logger = logging.getLogger(__name__)

# Docker environment path
DOCKER_STATIC_DIR = "/app/static"

@router.get("/download")
async def download_file(path: str = Query(..., description="Path to file to download")):
    """
    Download a file with forced Content-Disposition attachment.
    Path logic handles /static/ URLs mapping to local filesystem.
    """
    try:
        # Extract relative path from the input path/url
        # Example inputs: 
        # - /static/designs/xxx.png
        # - designs/xxx.png
        # - http://localhost:8000/static/designs/xxx.png
        
        target_path = path
        
        # Strip URL prefix if present
        if "://" in target_path:
            target_path = target_path.split("/static/", 1)[-1]
        elif target_path.startswith("/static/"):
            target_path = target_path.replace("/static/", "", 1)
        elif target_path.startswith("static/"):
            target_path = target_path.replace("static/", "", 1)
            
        # Try to find the file in known locations
        possible_paths = [
            os.path.join(DOCKER_STATIC_DIR, target_path),  # Docker path
            os.path.abspath(os.path.join(os.getcwd(), "static", target_path)), # Local dev path
        ]
        
        final_path = None
        for p in possible_paths:
            if os.path.exists(p) and os.path.isfile(p):
                final_path = p
                break
        
        if not final_path:
            logger.error(f"File not found. Tried: {possible_paths}")
            raise HTTPException(status_code=404, detail="File not found")
            
        filename = os.path.basename(final_path)
        
        return FileResponse(
            path=final_path,
            filename=filename,
            media_type='application/octet-stream',
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Download error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
