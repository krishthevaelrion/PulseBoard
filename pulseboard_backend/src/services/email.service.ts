import sgMail from "@sendgrid/mail";

let isInitialized = false;

const initSendGrid = () => {
  if (!isInitialized) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
    isInitialized = true;
  }
};

/**
 * Sends a 6-digit OTP verification email using SendGrid.
 * Uses a clean, branded HTML template matching PulseBoard's design.
 */
export const sendOtpEmail = async (
  toEmail: string,
  otp: string,
  userName: string
): Promise<void> => {
  initSendGrid();

  const msg = {
    to: toEmail,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || "noreply@pulseboard.app",
      name: "PulseBoard",
    },
    subject: `${otp} — Your PulseBoard Verification Code`,
    text: `Hi ${userName},\n\nYour PulseBoard verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\n— PulseBoard Team`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #050505; border-radius: 16px; overflow: hidden; border: 1px solid #222;">
        
        <!-- Header -->
        <div style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #1a1a1a;">
          <h1 style="margin: 0; color: #CCF900; font-size: 28px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">
            PULSE<span style="color: #ffffff;">BOARD</span>
          </h1>
        </div>

        <!-- Body -->
        <div style="padding: 40px 32px; text-align: center;">
          <p style="color: #999; font-size: 13px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 8px;">
            Verification Code
          </p>
          
          <div style="background: #111; border: 2px solid #CCF900; border-radius: 12px; padding: 24px; margin: 20px 0;">
            <span style="color: #CCF900; font-size: 40px; font-weight: 900; letter-spacing: 12px; font-family: 'Courier New', monospace;">
              ${otp}
            </span>
          </div>

          <p style="color: #ccc; font-size: 15px; line-height: 1.6; margin: 24px 0 8px;">
            Hey <strong style="color: #fff;">${userName}</strong>,
          </p>
          <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 0;">
            Enter this code to verify your email and complete your PulseBoard registration.
          </p>

          <div style="margin-top: 24px; padding: 12px 20px; background: #1a1a00; border-radius: 8px; border: 1px solid #333300;">
            <p style="color: #CCF900; font-size: 12px; margin: 0;">
              ⏱ This code expires in <strong>10 minutes</strong>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 20px 32px; border-top: 1px solid #1a1a1a; text-align: center;">
          <p style="color: #555; font-size: 11px; margin: 0;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ OTP email sent to ${toEmail}`);
  } catch (error: any) {
    console.error("❌ SendGrid Error:", error?.response?.body || error.message);
    throw new Error("Failed to send verification email");
  }
};

/**
 * Generates a random 6-digit OTP string.
 */
export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Sends a 6-digit OTP for password reset using SendGrid.
 */
export const sendPasswordResetEmail = async (
  toEmail: string,
  otp: string,
  userName: string
): Promise<void> => {
  initSendGrid();

  const msg = {
    to: toEmail,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || "noreply@pulseboard.app",
      name: "PulseBoard",
    },
    subject: `Password Reset Request - PulseBoard`,
    text: `Hi ${userName},\n\nWe received a request to reset your PulseBoard password. Your reset code is: ${otp}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this, please ignore this email.\n\n— PulseBoard Team`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #050505; border-radius: 16px; overflow: hidden; border: 1px solid #222;">
        
        <!-- Header -->
        <div style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #1a1a1a;">
          <h1 style="margin: 0; color: #CCF900; font-size: 28px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">
            PULSE<span style="color: #ffffff;">BOARD</span>
          </h1>
        </div>

        <!-- Body -->
        <div style="padding: 40px 32px; text-align: center;">
          <p style="color: #999; font-size: 13px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 8px;">
            Password Reset Code
          </p>
          
          <div style="background: #111; border: 2px solid #CCF900; border-radius: 12px; padding: 24px; margin: 20px 0;">
            <span style="color: #CCF900; font-size: 40px; font-weight: 900; letter-spacing: 12px; font-family: 'Courier New', monospace;">
              ${otp}
            </span>
          </div>

          <p style="color: #ccc; font-size: 15px; line-height: 1.6; margin: 24px 0 8px;">
            Hey <strong style="color: #fff;">${userName}</strong>,
          </p>
          <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 0;">
            Enter this code to reset your password.
          </p>

          <div style="margin-top: 24px; padding: 12px 20px; background: #1a1a00; border-radius: 8px; border: 1px solid #333300;">
            <p style="color: #CCF900; font-size: 12px; margin: 0;">
              ⏱ This code expires in <strong>15 minutes</strong>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 20px 32px; border-top: 1px solid #1a1a1a; text-align: center;">
          <p style="color: #555; font-size: 11px; margin: 0;">
            If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Password reset email sent to ${toEmail}`);
  } catch (error: any) {
    console.error("❌ SendGrid Error:", error?.response?.body || error.message);
    throw new Error("Failed to send password reset email");
  }
};
