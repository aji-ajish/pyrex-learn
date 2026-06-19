from fastapi import FastAPI
from pydantic import BaseModel
import re
from collections import defaultdict
import time

app = FastAPI()

# Rate limiting — memory store
request_counts = defaultdict(list)

# Config — user change பண்ணலாம்
BRUTE_FORCE_CONFIG = {
    "routes": ["/login", "/auth", "/admin/login"],  # default routes
    "max_attempts": 5,
    "window": 300  # 5 minutes
}

class RequestData(BaseModel):
    path: str
    method: str
    body: dict = {}
    headers: dict = {}
    ip: str = "unknown"


# Dynamic route config
brute_force_routes = set(["/login", "/auth", "/api/v1/login"])


class RouteConfig(BaseModel):
    routes: list[str]


@app.post("/config/brute-force-routes")
def add_brute_force_routes(config: RouteConfig):
    for route in config.routes:
        brute_force_routes.add(route)
    return {"status": "ok", "routes": list(brute_force_routes)}


@app.get("/config/brute-force-routes")
def get_brute_force_routes():
    return {"routes": list(brute_force_routes)}


def check_sql_injection(data: str) -> bool:
    dangerous = ["DROP", "DELETE", "INSERT", "UNION", "SELECT", "--", ";", "OR 1=1"]
    data_upper = data.upper()
    for word in dangerous:
        if word in data_upper:
            return True
    return False


def check_xss(data: str) -> bool:
    xss_patterns = [
        "<script",
        "</script>",
        "javascript:",
        "onerror=",
        "onload=",
        "alert(",
        "document.cookie",
        "eval(",
    ]
    data_lower = data.lower()
    for pattern in xss_patterns:
        if pattern in data_lower:
            return True
    return False


def check_path_traversal(path: str) -> bool:
    dangerous = ["../", "..\\", "%2e%2e", "etc/passwd", "windows/system32"]
    path_lower = path.lower()
    for pattern in dangerous:
        if pattern in path_lower:
            return True
    return False


def check_command_injection(data: str) -> bool:
    dangerous = ["rm -rf", "del /f", "|", "&&", "$(", "`"]
    for pattern in dangerous:
        if pattern in data:
            return True
    return False


def check_rate_limit(ip: str, limit: int = 100, window: int = 60) -> bool:
    now = time.time()
    # Old requests clean பண்ணு
    request_counts[ip] = [t for t in request_counts[ip] if now - t < window]

    if len(request_counts[ip]) >= limit:
        return True  # Rate limit exceeded

    request_counts[ip].append(now)
    return False


# Brute force tracking
failed_attempts = defaultdict(list)


def check_brute_force(ip: str, path: str) -> bool:
    # Dynamic routes check
    if path not in brute_force_routes:
        return False
    
    now = time.time()
    key = f"{ip}:{path}"  # IP + route combination!
    
    failed_attempts[key] = [
        t for t in failed_attempts[key] 
        if now - t < BRUTE_FORCE_CONFIG["window"]
    ]
    
    if len(failed_attempts[key]) >= BRUTE_FORCE_CONFIG["max_attempts"]:
        return True
    
    failed_attempts[key].append(now)
    return False

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/security/validate")
def validate(data: RequestData):

    # 1. Rate limit check
    if check_rate_limit(data.ip):
        return {"allowed": False, "reason": "Rate limit exceeded!"}

    # 2. Brute force check ← புது
    if check_brute_force(data.ip, data.path):
        return {
            "allowed": False,
            "reason": "Too many failed attempts! Try after 5 minutes.",
        }

    # 3. Path traversal check
    if check_path_traversal(data.path):
        return {"allowed": False, "reason": "Path traversal attack detected!"}

    body_str = str(data.body)

    # 4. SQL injection check
    if check_sql_injection(body_str):
        return {"allowed": False, "reason": "SQL Injection detected!"}

    # 5. XSS check
    if check_xss(body_str):
        return {"allowed": False, "reason": "XSS attack detected!"}

    # 6. Command injection check
    if check_command_injection(body_str):
        return {"allowed": False, "reason": "Command injection detected!"}

    return {"allowed": True, "reason": "Request is safe!"}
