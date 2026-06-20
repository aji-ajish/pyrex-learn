from datetime import datetime
from collections import Counter

audit_logs = []
MAX_LOGS = 1000

def add_audit_log(ip: str, method: str, path: str, allowed: bool, reason: str):
    log = {
        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "ip": ip,
        "method": method,
        "path": path,
        "allowed": allowed,
        "reason": reason
    }
    audit_logs.append(log)
    if len(audit_logs) > MAX_LOGS:
        audit_logs.pop(0)

def get_logs(limit: int = 50, allowed: bool = None, ip: str = None):
    logs = audit_logs.copy()
    if allowed is not None:
        logs = [l for l in logs if l["allowed"] == allowed]
    if ip:
        logs = [l for l in logs if l["ip"] == ip]
    return list(reversed(logs))[:limit]

def get_stats():
    total = len(audit_logs)
    blocked = len([l for l in audit_logs if not l["allowed"]])
    allowed = total - blocked
    blocked_logs = [l for l in audit_logs if not l["allowed"]]
    top_ips = Counter(l["ip"] for l in blocked_logs).most_common(5)
    top_attacks = Counter(l["reason"] for l in blocked_logs).most_common(5)
    return {
        "total_requests": total,
        "allowed": allowed,
        "blocked": blocked,
        "block_rate": f"{round(blocked/total*100, 1)}%" if total > 0 else "0%",
        "top_blocked_ips": [{"ip": ip, "count": c} for ip, c in top_ips],
        "top_attacks": [{"reason": r, "count": c} for r, c in top_attacks]
    }

def clear_logs():
    audit_logs.clear()