from sqlalchemy import create_engine, Column, BigInteger, String, DateTime, Integer, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = f"mysql+mysqlconnector://{os.getenv('DATABASE_USER')}:{os.getenv('DATABASE_PASSWORD')}@{os.getenv('DATABASE_HOST')}:{os.getenv('DATABASE_PORT')}/{os.getenv('DATABASE_NAME')}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class UserDB(Base):
    __tablename__ = "USERS"
    
    id = Column("ID", BigInteger, primary_key=True, autoincrement=True)
    email = Column("EMAIL", String(255), nullable=False, unique=True)
    password = Column("PASSWORD", String(64), nullable=False)
    token = Column("TOKEN", String(255), unique=True)
    token_expired_at = Column("TOKEN_EXPIRED_AT", DateTime)
    train_id = Column("TRAIN_ID", String(255), nullable=False)
    train_id_expired_at = Column("TRAIN_ID_EXPIRED_AT", DateTime)

class RoomDB(Base):
    __tablename__ = "ROOMS"
    
    id = Column("ID", Integer, primary_key=True, autoincrement=True)
    user_id_1 = Column("USER_ID_1", BigInteger, ForeignKey("USERS.ID"), nullable=False)
    user_id_2 = Column("USER_ID_2", BigInteger, ForeignKey("USERS.ID"), nullable=False)
    expired_at = Column("EXPIRED_AT", DateTime, nullable=False)

class ChatDB(Base):
    __tablename__ = "CHATS"
    
    id = Column("ID", Integer, primary_key=True, autoincrement=True)
    room_id = Column("ROOM_ID", Integer, ForeignKey("ROOMS.ID"), nullable=False)
    user_id = Column("USER_ID", BigInteger, ForeignKey("USERS.ID"), nullable=False)
    created_at = Column("CREATED_AT", DateTime, nullable=False)
    context = Column("CONTEXT", Text, nullable=False)
    link = Column("LINK", String(255))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_token(db: Session, token: str):
    user = db.query(UserDB).filter(
        UserDB.token == token,
        (UserDB.token_expired_at == None) | (UserDB.token_expired_at > datetime.now())
    ).first()
    return user