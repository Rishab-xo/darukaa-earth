from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import json
import random
from datetime import timedelta, date
import models, schemas, auth
from database import get_db

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("/", response_model=schemas.ProjectResponse)
def create_project(
    project: schemas.ProjectCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    db_project = models.Project(**project.model_dump(), user_id=current_user.id)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.post("/{project_id}/sites", response_model=schemas.SiteResponse)
def create_site(
    project_id: int, 
    site: schemas.SiteCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    # 1. Verify project belongs to user
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 2. Convert Mapbox GeoJSON directly to PostGIS Polygon
    geojson_str = json.dumps(site.boundary)
    db_site = models.Site(
        project_id=project_id,
        name=site.name,
        boundary=func.ST_SetSRID(func.ST_GeomFromGeoJSON(geojson_str), 4326)
    )
    db.add(db_site)
    db.commit()
    db.refresh(db_site)
    
    # 3. Auto-seed 12 months of synthetic analytics data for frontend charts
    for i in range(12):
        analytics = models.SiteAnalytics(
            site_id=db_site.id,
            recorded_date=date.today() - timedelta(days=30*i),
            carbon_sequestration=random.uniform(10.0, 50.0),
            biodiversity_index=random.randint(50, 100)
        )
        db.add(analytics)
    db.commit()
    
    return db_site

@router.get("/{project_id}/sites")
def get_sites(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.Site).filter(models.Site.project_id == project_id).all()

@router.get("/sites/{site_id}/analytics")
def get_site_analytics(
    site_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.SiteAnalytics).filter(models.SiteAnalytics.site_id == site_id).order_by(models.SiteAnalytics.recorded_date.asc()).all()