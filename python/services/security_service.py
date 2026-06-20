from collections import defaultdict
import time

# Rate limiting + Brute force state
request_counts = defaultdict(list)
failed_attempts = defaultdict(list)
brute_force_routes = set(["/login", "/auth", "/api/v1/login"])

BRUTE_FORCE_CONFIG = {
    "max_attempts": 5,
    "window": 300
}

def check_sql_injection(data: str) -> bool:
    dangerous = ["DROP", "DELETE", "INSERT", "UNION", "SELECT", "--", ";", "OR 1=1"]
    data_upper = data.upper()
    for word in dangerous:
        if word in data_upper:
            return True
    return False

def check_xss(data: str) -> bool:
    xss_patterns = [
        "<script", "</script>", "javascript:",
        "onerror=", "onload=", "alert(",
        "document.cookie", "eval("
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
    request_counts[ip] = [t for t in request_counts[ip] if now - t < window]
    if len(request_counts[ip]) >= limit:
        return True
    request_counts[ip].append(now)
    return False

def check_brute_force(ip: str, path: str) -> bool:
    if path not in brute_force_routes:
        return False
    now = time.time()
    key = f"{ip}:{path}"
    failed_attempts[key] = [
        t for t in failed_attempts[key]
        if now - t < BRUTE_FORCE_CONFIG["window"]
    ]
    if len(failed_attempts[key]) >= BRUTE_FORCE_CONFIG["max_attempts"]:
        return True
    failed_attempts[key].append(now)
    return False