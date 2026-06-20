from pydantic import BaseModel

class RequestData(BaseModel):
    path: str
    method: str
    body: dict = {}
    headers: dict = {}
    ip: str = "unknown"

class IPConfig(BaseModel):
    ip: str

class RouteWhitelist(BaseModel):
    route: str
    ips: list[str]

class RouteConfig(BaseModel):
    routes: list[str]

class CSRFValidate(BaseModel):
    token: str
    ip: str