from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LocationData(BaseModel):
    token: str
    latitude: float
    longitude: float
    speed: Optional[float] = None
    direction: Optional[float] = None

class LineResponse(BaseModel):
    line: Optional[str] = None

class QueueAddRequest(BaseModel):
    user_id: int
    line: str
    train_id: str

class User(BaseModel):
    id: int
    email: str
    token: Optional[str] = None
    token_expired_at: Optional[datetime] = None
    train_id: Optional[str] = None
    train_id_expired_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True