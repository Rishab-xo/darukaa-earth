from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, Dict, Any

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class ProjectResponse(ProjectCreate):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class SiteCreate(BaseModel):
    name: str
    # This will accept the raw GeoJSON geometry object from Mapbox GL Draw
    boundary: Dict[str, Any] 

class SiteUpdate(BaseModel):
    name: Optional[str] = None 

class SiteResponse(BaseModel):
    id: int
    project_id: int
    name: str
    created_at: datetime
    boundary: Optional[Dict[str, Any]] = None
    class Config:
        from_attributes = True

class SiteAnalyticsResponse(BaseModel):
    id: int
    site_id: int
    recorded_date: datetime
    carbon_sequestration: float
    biodiversity_index: int
    created_at: datetime
    class Config:
        from_attributes = True