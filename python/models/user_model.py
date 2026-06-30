from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database.connection import Base

class User(Base):
    __tablename__ = "User"  

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(191))
    email = Column(String(191), unique=True)
    password = Column(String(191))
    role = Column(String(191), default="user")
    createdAt = Column(DateTime, server_default=func.now())
    updatedAt = Column(DateTime, server_default=func.now(), onupdate=func.now())