from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import requests
import os
from dotenv import load_dotenv
from datetime import datetime
import logging

from database import get_db, verify_token
from models import LocationData, LineResponse, QueueAddRequest
from train_detector import TrainDetector

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Team SNS Backend 2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

train_detector = TrainDetector()

@app.post("/api/set-location", response_model=LineResponse)
async def set_location(location_data: LocationData):
    db = next(get_db())

    user = verify_token(db, location_data.token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        
        line, train_id = train_detector.detect_train(
            location_data.latitude,
            location_data.longitude,
            location_data.speed,
            location_data.direction
        )
        
        if line and train_id:
            server1_url = os.getenv("SERVER1_URL", "http://localhost:3000")
            queue_data = QueueAddRequest(
                user_id=user.id,
                line=line,
                train_id=train_id
            )
            
            try:
                response = requests.post(
                    f"{server1_url}/api/queue/add",
                    json=queue_data.dict()
                )
                response.raise_for_status()
                logger.info(f"User {user.id} added to queue for line {line}, train {train_id}")
            except requests.exceptions.RequestException as e:
                logger.error(f"Failed to notify server1: {e}")
        
        return LineResponse(line=line)
        
    except Exception as e:
        logger.error(f"Error in set_location: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)