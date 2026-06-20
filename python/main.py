from fastapi import FastAPI
from routers import security, config, audit, csrf

app = FastAPI(
    title="Pyrex Security Layer",
    version="1.0.0"
)

@app.get("/health")
def health():
    return {"status": "ok", "service": "Pyrex Security Layer"}

app.include_router(security.router)
app.include_router(config.router)
app.include_router(audit.router)
app.include_router(csrf.router)