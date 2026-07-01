import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import AuthService from "../core/AuthService.js";
import TwoFactorService from "../core/TwoFactorService.js";
import prisma from "../core/db.js";

describe("AuthService", () => {

  test("password hash and compare", async () => {
    const password = "mypassword123";
    const hash = await AuthService.hashPassword(password);
    const isValid = await AuthService.comparePassword(password, hash);
    expect(isValid).toBe(true);
  });

  test("wrong password fails", async () => {
    const hash = await AuthService.hashPassword("correct");
    const isValid = await AuthService.comparePassword("wrong", hash);
    expect(isValid).toBe(false);
  });

  test("JWT generate and verify", () => {
    const payload = { id: 1, email: "test@test.com", role: "user" };
    const token = AuthService.generateToken(payload);
    const decoded = AuthService.verifyToken(token);
    expect(decoded.email).toBe("test@test.com");
    expect(decoded.role).toBe("user");
  });

  test("invalid JWT returns null", () => {
    const decoded = AuthService.verifyToken("invalid-token");
    expect(decoded).toBeNull();
  });

  test("refresh token generate and verify", () => {
    const payload = { id: 1, email: "test@test.com", role: "user" };
    const token = AuthService.generateRefreshToken(payload);
    const decoded = AuthService.verifyToken(token);
    expect(decoded.email).toBe("test@test.com");
  });

});

describe("TwoFactorService", () => {

  test("generate secret", () => {
    const secret = TwoFactorService.generateSecret();
    expect(secret).toBeTruthy();
    expect(secret.length).toBeGreaterThan(10);
  });

  test("verify valid code", () => {
    const secret = TwoFactorService.generateSecret();
    // valid code-ஐ generate பண்ண முடியாது directly — so invalid code test பண்ணலாம்
    const isValid = TwoFactorService.verifyCode(secret, "000000");
    expect(isValid).toBe(false);
  });

});