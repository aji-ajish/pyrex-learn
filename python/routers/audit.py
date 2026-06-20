from fastapi import APIRouter
from services import audit_service

router = APIRouter()

@router.get("/audit/logs")
def get_logs(limit: int = 50, allowed: bool = None, ip: str = None):
    logs = audit_service.get_logs(limit, allowed, ip)
    return {"total": len(logs), "logs": logs}

@router.get("/audit/stats")
def get_stats():
    return audit_service.get_stats()

@router.delete("/audit/clear")
def clear_logs():
    audit_service.clear_logs()
    return {"status": "ok", "message": "Audit logs cleared!"}