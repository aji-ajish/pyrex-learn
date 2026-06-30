import prisma from "../core/db.js";
import AuthService from "../core/AuthService.js";
import TwoFactorService from "../core/TwoFactorService.js";

const AuthController = {
  // POST /api/v1/register
  register: async (params, request, res) => {
    const body = request.body;

    // check Email already exist
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already registered!" });
    }

    // Password hash
    const hashedPassword = await AuthService.hashPassword(body.password);

    // User create
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
      },
    });

    const payload = { id: user.id, email: user.email, role: user.role };
    const token = AuthService.generateToken(payload);
    const refreshToken = AuthService.generateRefreshToken(payload);

    await AuthService.createSession(user.id, token, refreshToken);

    return res.status(201).json({
      message: "User registered!",
      token,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email },
    });
  },

  // POST /api/v1/login
  login: async (params, request, res) => {
    const body = request.body;

    // User find
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password!" });
    }

    // Password compare
    const isValid = await AuthService.comparePassword(
      body.password,
      user.password,
    );

    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password!" });
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const token = AuthService.generateToken(payload);
    const refreshToken = AuthService.generateRefreshToken(payload);

    await AuthService.createSession(user.id, token, refreshToken);

    return res.status(200).json({
      message: "Login successful!",
      token,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email },
    });
  },

  // ✅ Refresh access token
  refresh: async (params, request, res) => {
    const body = request.body;
    const { refreshToken } = body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required!" });
    }

    const newToken = await AuthService.refreshAccessToken(refreshToken);

    if (!newToken) {
      return res
        .status(401)
        .json({ error: "Invalid or expired refresh token!" });
    }

    return res.status(200).json({
      message: "Token refreshed!",
      token: newToken,
    });
  },

  logout: async (params, request, res) => {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (token) {
      await AuthService.destroySession(token);
    }

    return res.status(200).json({ message: "Logged out successfully!" });
  },
  // ✅ 2FA setup — QR code generate
  enable2FA: async (params, request, res) => {
    const userId = request.user.id;

    const secret = TwoFactorService.generateSecret();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const qrCode = await TwoFactorService.generateQRCode(user.email, secret);

    // Secret DB-ல save பண்ணு (இன்னும் enable ஆகலை)
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    return res.status(200).json({
      message: "Scan this QR code with Google Authenticator",
      qrCode,
      secret,
    });
  },

  // ✅ 2FA verify + enable
  verify2FA: async (params, request, res) => {
    const body = request.body;
    const userId = request.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user.twoFactorSecret) {
      return res.status(400).json({ error: "2FA setup not started!" });
    }

    const isValid = TwoFactorService.verifyCode(
      user.twoFactorSecret,
      body.code,
    );

    if (!isValid) {
      return res.status(400).json({ error: "Invalid 2FA code!" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return res.status(200).json({ message: "2FA enabled successfully!" });
  },

  // ✅ Login with 2FA
  loginWith2FA: async (params, request, res) => {
    const body = request.body;

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password!" });
    }

    const isValid = await AuthService.comparePassword(
      body.password,
      user.password,
    );

    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password!" });
    }

    // 2FA enabled-ஆ check பண்ணு
    if (user.twoFactorEnabled) {
      if (!body.code) {
        return res.status(200).json({
          requires2FA: true,
          message: "Enter your 2FA code!",
        });
      }

      const isCodeValid = TwoFactorService.verifyCode(
        user.twoFactorSecret,
        body.code,
      );

      if (!isCodeValid) {
        return res.status(401).json({ error: "Invalid 2FA code!" });
      }
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const token = AuthService.generateToken(payload);
    const refreshToken = AuthService.generateRefreshToken(payload);

    await AuthService.createSession(user.id, token, refreshToken);

    return res.status(200).json({
      message: "Login successful!",
      token,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email },
    });
  },
  // ✅ Step 1 — Forgot password
  forgotPassword: async (params, request, res) => {
    const body = request.body;

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    // Security: user இல்லாட்டியும் same message — email exist-ஆ இல்லையான்னு hacker கண்டுபிடிக்க கூடாது!
    if (!user) {
      return res.status(200).json({
        message: "If this email exists, a reset link has been sent!",
      });
    }

    const token = await AuthService.generateResetToken(user.id);

    // Real app-ல email அனுப்பணும் — இப்போதைக்கு console-ல print பண்ணலாம்
    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    console.log("📧 Password Reset Link:", resetLink);

    return res.status(200).json({
      message: "If this email exists, a reset link has been sent!",
      // Development மட்டும் — production-ல இதை remove பண்ணணும்!
      devToken: token,
    });
  },

  // ✅ Step 2 — Reset password
  resetPassword: async (params, request, res) => {
    const body = request.body;

    const reset = await AuthService.verifyResetToken(body.token);

    if (!reset) {
      return res.status(400).json({ error: "Invalid or expired reset token!" });
    }

    const hashedPassword = await AuthService.hashPassword(body.newPassword);

    await prisma.user.update({
      where: { id: reset.userId },
      data: { password: hashedPassword },
    });

    await AuthService.markTokenUsed(reset.id);

    return res.status(200).json({ message: "Password reset successful!" });
  },
};

export default AuthController;
