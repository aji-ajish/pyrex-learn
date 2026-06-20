from fastapi import FastAPI
from pydantic import BaseModel
import re
from collections import defaultdict
import time

app = FastAPI()

# Rate limiting — memory store
request_counts = defaultdict(list)


# -------------------------------------------------------------
# check ratelimit,sql injection,xss,path traversal,command injection
# -------------------------------------------------------------
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

    # 1. IP check — முதல்ல பண்ணு (fastest)
    ip_check = check_ip(data.ip, data.path)
    if not ip_check["allowed"]:
        return {"allowed": False, "reason": ip_check["reason"]}

    # 2. Rate limit check
    if check_rate_limit(data.ip):
        return {"allowed": False, "reason": "Rate limit exceeded!"}

    # 3. Brute force check
    if check_brute_force(data.ip, data.path):
        return {"allowed": False, "reason": "Too many failed attempts!"}

    # 4. Path traversal check
    if check_path_traversal(data.path):
        return {"allowed": False, "reason": "Path traversal attack detected!"}

    body_str = str(data.body)

    # 5. SQL injection check
    if check_sql_injection(body_str):
        return {"allowed": False, "reason": "SQL Injection detected!"}

    # 6. XSS check
    if check_xss(body_str):
        return {"allowed": False, "reason": "XSS attack detected!"}

    # 7. Command injection check
    if check_command_injection(body_str):
        return {"allowed": False, "reason": "Command injection detected!"}

    return {"allowed": True, "reason": "Request is safe!"}


# -------------------------------------------------------------
# brute force routes config
# -------------------------------------------------------------
class RouteConfig(BaseModel):
    routes: list[str]


# Config — user change பண்ணலாம்
BRUTE_FORCE_CONFIG = {
    "routes": ["/login", "/auth", "/admin/login"],  # default routes
    "max_attempts": 5,
    "window": 300,  # 5 minutes
}


# Dynamic route config
brute_force_routes = set(["/login", "/auth", "/api/v1/login"])

# Brute force tracking
failed_attempts = defaultdict(list)


def check_brute_force(ip: str, path: str) -> bool:
    # Dynamic routes check
    if path not in brute_force_routes:
        return False

    now = time.time()
    key = f"{ip}:{path}"  # IP + route combination!

    failed_attempts[key] = [
        t for t in failed_attempts[key] if now - t < BRUTE_FORCE_CONFIG["window"]
    ]

    if len(failed_attempts[key]) >= BRUTE_FORCE_CONFIG["max_attempts"]:
        return True

    failed_attempts[key].append(now)
    return False


@app.post("/config/brute-force-routes")
def add_brute_force_routes(config: RouteConfig):
    for route in config.routes:
        brute_force_routes.add(route)
    return {"status": "ok", "routes": list(brute_force_routes)}


@app.get("/config/brute-force-routes")
def get_brute_force_routes():
    return {"routes": list(brute_force_routes)}


# -------------------------------------------------------------
# IP whitelist and blacklist
# -------------------------------------------------------------
# IP Lists
ip_blacklist = set()
ip_whitelist = set()
whitelist_routes = {}  # route → allowed IPs


# IP Management Models
class IPConfig(BaseModel):
    ip: str


class RouteWhitelist(BaseModel):
    route: str
    ips: list[str]


# IP Management Endpoints
@app.post("/config/blacklist/add")
def add_to_blacklist(config: IPConfig):
    ip_blacklist.add(config.ip)
    return {"status": "ok", "blacklisted": config.ip}


@app.post("/config/blacklist/remove")
def remove_from_blacklist(config: IPConfig):
    ip_blacklist.discard(config.ip)
    return {"status": "ok", "removed": config.ip}


@app.post("/config/whitelist/add")
def add_to_whitelist(config: IPConfig):
    ip_whitelist.add(config.ip)
    return {"status": "ok", "whitelisted": config.ip}


@app.post("/config/route-whitelist")
def set_route_whitelist(config: RouteWhitelist):
    whitelist_routes[config.route] = set(config.ips)
    return {"status": "ok", "route": config.route, "ips": config.ips}


@app.get("/config/ip-lists")
def get_ip_lists():
    return {
        "blacklist": list(ip_blacklist),
        "whitelist": list(ip_whitelist),
        "route_whitelist": {k: list(v) for k, v in whitelist_routes.items()},
    }

@app.post("/config/reset")
def reset_config():
    ip_blacklist.clear()
    ip_whitelist.clear()
    whitelist_routes.clear()
    brute_force_routes.clear()
    failed_attempts.clear()
    request_counts.clear()
    return {"status": "ok", "message": "Config reset!"}

def check_ip(ip: str, path: str) -> dict:
    # 1. Blacklist check
    if ip in ip_blacklist:
        return {"allowed": False, "reason": f"IP {ip} is blacklisted!"}

    # 2. Route whitelist — இந்த route-ku specific IPs மட்டும்
    if path in whitelist_routes:
        if ip not in whitelist_routes[path]:
            return {
                "allowed": False,
                "reason": f"IP {ip} not allowed for {path}"
            }
        # ✅ Route whitelist match ஆச்சு — allow!
        return {"allowed": True}

    # 3. Global whitelist — route whitelist இல்லாத routes-ku மட்டும்
    if ip_whitelist and ip not in ip_whitelist:
        return {"allowed": False, "reason": f"IP {ip} not in whitelist!"}

    return {"allowed": True}
