# IP Lists — shared state
ip_blacklist = set()
ip_whitelist = set()
whitelist_routes = {}

def check_ip(ip: str, path: str) -> dict:
    # 1. Blacklist check
    if ip in ip_blacklist:
        return {"allowed": False, "reason": f"IP {ip} is blacklisted!"}

    # 2. Route whitelist check
    if path in whitelist_routes:
        if ip not in whitelist_routes[path]:
            return {
                "allowed": False,
                "reason": f"IP {ip} not allowed for {path}"
            }
        return {"allowed": True}

    # 3. Global whitelist check
    if ip_whitelist and ip not in ip_whitelist:
        return {"allowed": False, "reason": f"IP {ip} not in whitelist!"}

    return {"allowed": True}