from fastapi import APIRouter, Request
from services import csrf_service

router = APIRouter()

@router.get("/csrf/token")
def get_token(request: Request):
    ip = request.client.host
    token = csrf_service.generate_token(ip)
    return {"csrf_token": token}