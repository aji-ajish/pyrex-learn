from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from models.user_model import User
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True

# GET all users
@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return {
        "users": [
            {"id": u.id, "name": u.name, "email": u.email, "role": u.role}
            for u in users
        ]
    }

# GET one user
@router.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found!")
    return {
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}
    }

# POST create user
@router.post("/users")
def create_user(data: UserCreate, db: Session = Depends(get_db)):
    user = User(name=data.name, email=data.email, password=data.password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {
        "message": "User created!",
        "user": {"id": user.id, "name": user.name, "email": user.email}
    }

# PUT update user
@router.put("/users/{user_id}")
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found!")

    if data.name:
        user.name = data.name
    if data.email:
        user.email = data.email

    db.commit()
    db.refresh(user)
    return {
        "message": "User updated!",
        "user": {"id": user.id, "name": user.name, "email": user.email}
    }

# DELETE user
@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found!")

    db.delete(user)
    db.commit()
    return {"message": "User deleted!"}