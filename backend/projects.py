from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import json
import random
from datetime import timedelta, date
import models, schemas, auth
from database import get_db

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("/", response_model=list[schemas.ProjectResponse])
def get_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.Project).filter(models.Project.user_id == current_user.id).all()

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
    
    return {
        "id": db_site.id,
        "project_id": db_site.project_id,
        "name": db_site.name,
        "created_at": db_site.created_at,
        "boundary": site.boundary,
    }

@router.get("/{project_id}/sites", response_model=list[schemas.SiteResponse])
def get_sites(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    sites = db.query(
        models.Site.id,
        models.Site.project_id,
        models.Site.name,
        models.Site.created_at,
        func.ST_AsGeoJSON(models.Site.boundary).label("boundary_geojson")
    ).filter(models.Site.project_id == project_id).all()

    res = []
    for s in sites:
        geom = json.loads(s.boundary_geojson) if s.boundary_geojson else None
        res.append({
            "id": s.id,
            "project_id": s.project_id,
            "name": s.name,
            "created_at": s.created_at,
            "boundary": geom
        })
    return res

@router.get("/sites/{site_id}/analytics", response_model=list[schemas.SiteAnalyticsResponse])
def get_site_analytics(
    site_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.SiteAnalytics).filter(models.SiteAnalytics.site_id == site_id).order_by(models.SiteAnalytics.recorded_date.asc()).all()

@router.patch("/{project_id}", response_model=schemas.ProjectResponse)
def update_project(
    project_id: int,
    project_update: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    project = db.query(models.Project).filter(
        models.Project.id == project_id, 
        models.Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project_update.title is not None and project_update.title.strip():
        project.title = project_update.title.strip()
    if project_update.description is not None:
        project.description = project_update.description.strip()
    
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    project = db.query(models.Project).filter(
        models.Project.id == project_id, 
        models.Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
    return None

@router.patch("/sites/{site_id}", response_model=schemas.SiteResponse)
def update_site(
    site_id: int,
    site_update: schemas.SiteUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    site = db.query(models.Site).join(models.Project).filter(
        models.Site.id == site_id,
        models.Project.user_id == current_user.id
    ).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    
    if site_update.name is not None and site_update.name.strip():
        site.name = site_update.name.strip()
    
    db.commit()
    db.refresh(site)

    boundary_geojson = db.query(func.ST_AsGeoJSON(site.boundary)).scalar()
    geom = json.loads(boundary_geojson) if boundary_geojson else None

    return {
        "id": site.id,
        "project_id": site.project_id,
        "name": site.name,
        "created_at": site.created_at,
        "boundary": geom
    }

@router.delete("/sites/{site_id}", status_code=204)
def delete_site(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    site = db.query(models.Site).join(models.Project).filter(
        models.Site.id == site_id,
        models.Project.user_id == current_user.id
    ).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    
    db.delete(site)
    db.commit()
    return None