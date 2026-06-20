from fastapi import APIRouter
from models.schemas import RequestData
from services import csrf_service
from services import ip_service, security_service, audit_service

router = APIRouter()

@router.post("/security/validate")
def validate(data: RequestData):

    # 1. IP check
    ip_check = ip_service.check_ip(data.ip, data.path)
    if not ip_check["allowed"]:
        audit_service.add_audit_log(data.ip, data.method, data.path, False, ip_check["reason"])
        return {"allowed": False, "reason": ip_check["reason"]}

    # 2. Rate limit
    if security_service.check_rate_limit(data.ip):
        reason = "Rate limit exceeded!"
        audit_service.add_audit_log(data.ip, data.method, data.path, False, reason)
        return {"allowed": False, "reason": reason}

    # 3. Brute force
    if security_service.check_brute_force(data.ip, data.path):
        reason = "Too many failed attempts!"
        audit_service.add_audit_log(data.ip, data.method, data.path, False, reason)
        return {"allowed": False, "reason": reason}

    # 4. CSRF check — POST, PUT, DELETE, PATCH மட்டும்
    if data.method in ["POST", "PUT", "DELETE", "PATCH"]:
        csrf_token = data.headers.get("x-csrf-token", "")
        if not csrf_token:
            reason = "CSRF token missing!"
            audit_service.add_audit_log(data.ip, data.method, data.path, False, reason)
            return {"allowed": False, "reason": reason}
        if not csrf_service.verify_token(csrf_token, data.ip):
            reason = "CSRF token invalid or expired!"
            audit_service.add_audit_log(data.ip, data.method, data.path, False, reason)
            return {"allowed": False, "reason": reason}

    # 5. Path traversal
    if security_service.check_path_traversal(data.path):
        reason = "Path traversal detected!"
        audit_service.add_audit_log(data.ip, data.method, data.path, False, reason)
        return {"allowed": False, "reason": reason}

    body_str = str(data.body)

    # 6. SQL injection
    if security_service.check_sql_injection(body_str):
        reason = "SQL Injection detected!"
        audit_service.add_audit_log(data.ip, data.method, data.path, False, reason)
        return {"allowed": False, "reason": reason}

    # 7. XSS
    if security_service.check_xss(body_str):
        reason = "XSS attack detected!"
        audit_service.add_audit_log(data.ip, data.method, data.path, False, reason)
        return {"allowed": False, "reason": reason}

    # 8. Command injection
    if security_service.check_command_injection(body_str):
        reason = "Command injection detected!"
        audit_service.add_audit_log(data.ip, data.method, data.path, False, reason)
        return {"allowed": False, "reason": reason}

    audit_service.add_audit_log(data.ip, data.method, data.path, True, "Request is safe!")
    return {"allowed": True, "reason": "Request is safe!"}