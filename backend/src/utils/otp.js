// Dev OTP helper. In production, phone OTP -> Firebase, email OTP -> Resend.
export const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));
export const otpExpiry = (mins = 10) => new Date(Date.now() + mins * 60 * 1000);
