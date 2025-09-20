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
from models import LocationData, LineResponse, SectionQueueRequest
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
        
        line, section_id = train_detector.detect_train(
            location_data.latitude,
            location_data.longitude,
            location_data.speed,
            location_data.direction
        )

        if line and section_id:
            server1_url = os.getenv("SERVER1_URL", "http://localhost:3000")
            queue_data = SectionQueueRequest(
                user_id=user.id,
                line=line,
                section_id=section_id
            )
            
            try:
                response = requests.post(
                    f"{server1_url}/api/queue/add",
                    json=queue_data.dict()
                )
                response.raise_for_status()
                logger.info(f"User {user.id} added to queue for line {line}, section {section_id}")
            except requests.exceptions.RequestException as e:
                logger.error(f"Failed to notify server1: {e}")
        
        # descriptionを生成
        description = None
        if line and section_id:
            # section_idから駅名を抽出 (例: "御堂筋線_中津_梅田" -> ["中津", "梅田"])
            parts = section_id.split("_")
            if len(parts) >= 3:
                station1 = parts[1]
                station2 = parts[2]
                description = f"あなたは{line}の{station1}駅と{station2}駅の間にいます"

        return LineResponse(line=line, description=description)

    except Exception as e:
        logger.error(f"Error in set_location: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)