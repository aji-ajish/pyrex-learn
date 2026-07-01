import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.security_service import (
    check_sql_injection,
    check_xss,
    check_path_traversal,
    check_command_injection,
    check_rate_limit,
    check_brute_force,
    brute_force_routes,
)
from services.ip_service import check_ip, ip_blacklist, ip_whitelist, whitelist_routes
from services.csrf_service import generate_token, verify_token


class TestSQLInjection:
    def test_detects_drop(self):
        assert check_sql_injection("DROP TABLE users") == True

    def test_detects_union(self):
        assert check_sql_injection("UNION SELECT * FROM users") == True

    def test_allows_normal(self):
        assert check_sql_injection("Hello Ajish") == False

    def test_case_insensitive(self):
        assert check_sql_injection("drop table users") == True


class TestXSS:
    def test_detects_script(self):
        assert check_xss("<script>alert('xss')</script>") == True

    def test_detects_javascript(self):
        assert check_xss("javascript:void(0)") == True

    def test_allows_normal(self):
        assert check_xss("Hello World") == False

    def test_detects_onerror(self):
        assert check_xss("<img onerror=alert(1)>") == True


class TestPathTraversal:
    def test_detects_dotdot(self):
        assert check_path_traversal("../../etc/passwd") == True

    def test_detects_etc_passwd(self):
        assert check_path_traversal("/etc/passwd") == True

    def test_allows_normal(self):
        assert check_path_traversal("/api/v1/user") == False


class TestCommandInjection:
    def test_detects_rm_rf(self):
        assert check_command_injection("rm -rf /") == True

    def test_detects_pipe(self):
        assert check_command_injection("ls | grep secret") == True

    def test_allows_normal(self):
        assert check_command_injection("Hello World") == False


class TestIPService:
    def test_blacklist_blocks(self):
        ip_blacklist.add("1.2.3.4")
        result = check_ip("1.2.3.4", "/api/v1/user")
        ip_blacklist.discard("1.2.3.4")
        assert result["allowed"] == False

    def test_normal_ip_allowed(self):
        result = check_ip("8.8.8.8", "/api/v1/user")
        assert result["allowed"] == True

    def test_route_whitelist(self):
        whitelist_routes["/admin"] = {"127.0.0.1"}
        result = check_ip("8.8.8.8", "/admin")
        del whitelist_routes["/admin"]
        assert result["allowed"] == False


class TestRateLimit:
    def test_first_request_allowed(self):
        result = check_rate_limit("10.0.0.1")
        assert result == False  # Not rate limited

    def test_rate_limit_exceeded(self):
        # 100 requests அனுப்பு
        for _ in range(100):
            check_rate_limit("10.0.0.2")
        result = check_rate_limit("10.0.0.2")
        assert result == True  # Rate limited!


class TestBruteForce:
    def test_non_login_route_allowed(self):
        result = check_brute_force("1.1.1.1", "/api/v1/user")
        assert result == False

    def test_brute_force_detected(self):
        brute_force_routes.add("/api/v1/login")
        for _ in range(5):
            check_brute_force("9.9.9.9", "/api/v1/login")
        result = check_brute_force("9.9.9.9", "/api/v1/login")
        assert result == True  # Blocked!


class TestCSRF:
    def test_valid_token(self):
        token = generate_token("127.0.0.1")
        assert verify_token(token, "127.0.0.1") == True

    def test_invalid_token(self):
        assert verify_token("fake-token", "127.0.0.1") == False

    def test_wrong_ip(self):
        token = generate_token("127.0.0.1")
        assert verify_token(token, "8.8.8.8") == False

    def test_one_time_use(self):
        token = generate_token("127.0.0.1")
        verify_token(token, "127.0.0.1")  # First use
        assert verify_token(token, "127.0.0.1") == False


class TestPasswordReset:
    def test_reset_token_format(self):
        import secrets
        token = secrets.token_hex(32)
        assert len(token) == 64
        assert isinstance(token, str)

    def test_token_uniqueness(self):
        import secrets
        token1 = secrets.token_hex(32)
        token2 = secrets.token_hex(32)
        assert token1 != token2


class TestJWTLogic:
    def test_jwt_secret_exists(self):
        import os
        from dotenv import load_dotenv
        load_dotenv("../.env")
        secret = os.getenv("JWT_SECRET")
        assert secret is not None
        assert len(secret) > 0

    def test_jwt_secret_not_default(self):
        import os
        from dotenv import load_dotenv
        load_dotenv("../.env")
        secret = os.getenv("JWT_SECRET")
        # Production-ல default secret use பண்ணக்கூடாது!
        assert secret != "secret"
        assert secret != "password"


class TestSecurityCombined:
    def test_sql_and_xss_together(self):
        # Both attacks ஒரே string-ல
        payload = "<script>SELECT * FROM users</script>"
        assert check_sql_injection(payload) == True
        assert check_xss(payload) == True

    def test_clean_input(self):
        payload = "Hello, my name is Ajish!"
        assert check_sql_injection(payload) == False
        assert check_xss(payload) == False

    def test_ip_and_security_combined(self):
        # Blacklisted IP — security check-கே போகக்கூடாது
        ip_blacklist.add("5.5.5.5")
        result = check_ip("5.5.5.5", "/api/v1/user")
        ip_blacklist.discard("5.5.5.5")
        assert result["allowed"] == False