import secrets
import time

# Token store: { token: { ip, expires } }
csrf_tokens = {}
TOKEN_EXPIRY = 3600  # 1 hour

def generate_token(ip: str) -> str:
    token = secrets.token_hex(32)
    csrf_tokens[token] = {
        "ip": ip,
        "expires": time.time() + TOKEN_EXPIRY
    }
    return token

def verify_token(token: str, ip: str) -> bool:
    if not token or token not in csrf_tokens:
        return False
    
    data = csrf_tokens[token]
    
    # Expired check
    if time.time() > data["expires"]:
        del csrf_tokens[token]
        return False
    
    # IP match check
    if data["ip"] != ip:
        return False
    
    # One-time use — delete after verify
    del csrf_tokens[token]
    return True

def cleanup_expired():
    now = time.time()
    expired = [t for t, d in csrf_tokens.items() if now > d["expires"]]
    for t in expired:
        del csrf_tokens[t]