import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

const TwoFactorService = {
  // Secret generate பண்ணு
  generateSecret: () => {
    const secret = new OTPAuth.Secret({ size: 20 });
    return secret.base32;
  },

  // QR code generate பண்ணு — Google Authenticator scan பண்ண
  generateQRCode: async (email, secret) => {
    const totp = new OTPAuth.TOTP({
      issuer: "Pyrex",
      label: `Pyrex-${email}`, // ✅ unique label
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });

    const otpAuthUrl = totp.toString();
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);
    return qrCodeDataUrl;
  },

  // Code verify பண்ணு
  verifyCode: (secret, code) => {
    const totp = new OTPAuth.TOTP({
      issuer: "Pyrex",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });

    const delta = totp.validate({ token: code, window: 1 });
    return delta !== null;
  },
};

export default TwoFactorService;
