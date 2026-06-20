from fastapi import APIRouter
from models.schemas import IPConfig, RouteWhitelist, RouteConfig
from services import ip_service, security_service

router = APIRouter()

@router.post("/config/reset")
def reset_config():
    ip_service.ip_blacklist.clear()
    ip_service.ip_whitelist.clear()
    ip_service.whitelist_routes.clear()
    security_service.brute_force_routes.clear()
    security_service.failed_attempts.clear()
    security_service.request_counts.clear()
    return {"status": "ok", "message": "Config reset!"}

@router.post("/config/brute-force-routes")
def add_brute_force_routes(config: RouteConfig):
    for route in config.routes:
        security_service.brute_force_routes.add(route)
    return {"status": "ok", "routes": list(security_service.brute_force_routes)}

@router.post("/config/blacklist/add")
def add_blacklist(config: IPConfig):
    ip_service.ip_blacklist.add(config.ip)
    return {"status": "ok", "blacklisted": config.ip}

@router.post("/config/blacklist/remove")
def remove_blacklist(config: IPConfig):
    ip_service.ip_blacklist.discard(config.ip)
    return {"status": "ok", "removed": config.ip}

@router.post("/config/whitelist/add")
def add_whitelist(config: IPConfig):
    ip_service.ip_whitelist.add(config.ip)
    return {"status": "ok", "whitelisted": config.ip}

@router.post("/config/route-whitelist")
def set_route_whitelist(config: RouteWhitelist):
    ip_service.whitelist_routes[config.route] = set(config.ips)
    return {"status": "ok", "route": config.route, "ips": config.ips}

@router.get("/config/ip-lists")
def get_ip_lists():
    return {
        "blacklist": list(ip_service.ip_blacklist),
        "whitelist": list(ip_service.ip_whitelist),
        "route_whitelist": {k: list(v) for k, v in ip_service.whitelist_routes.items()}
    }