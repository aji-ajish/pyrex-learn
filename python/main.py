from fastapi import FastAPI
from pydantic import BaseModel
import re
from collections import defaultdict
import time

app = FastAPI()

# Rate limiting — memory store
request_counts = defaultdict(list)


class RequestData(BaseModel):
    path: str
    method: str
    body: dict = {}
    headers: dict = {}
    ip: str = "unknown"


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


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/security/validate")
def validate(data: RequestData):

    # 1. Rate limit check
    if check_rate_limit(data.ip):
        return {"allowed": False, "reason": "Rate limit exceeded — too many requests!"}

    # 2. Path traversal check
    if check_path_traversal(data.path):
        return {"allowed": False, "reason": "Path traversal attack detected!"}

    body_str = str(data.body)

    # 3. SQL injection check
    if check_sql_injection(body_str):
        return {"allowed": False, "reason": "SQL Injection detected!"}

    # 4. XSS check
    if check_xss(body_str):
        return {"allowed": False, "reason": "XSS attack detected!"}

    # 5. Command injection check
    if check_command_injection(body_str):
        return {"allowed": False, "reason": "Command injection detected!"}

    return {"allowed": True, "reason": "Request is safe!"}
