import nodemailer from 'nodemailer';

const DEV_MODE = !process.env.GMAIL_PASS ||
                 process.env.GMAIL_PASS === 'your_gmail_app_password_here';

// ─── Transporter ──────────────────────────────────────────────────────────────
let transporter;

if (!DEV_MODE) {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
        },
    });
}

// ─── Send OTP ─────────────────────────────────────────────────────────────────
export async function sendOtpEmail(toEmail, otp) {
    // DEV MODE — print OTP to console instead of sending real email
    if (DEV_MODE) {
        console.log('\n');
        console.log('═══════════════════════════════════════');
        console.log('  📧  DEV MODE — OTP NOT SENT BY EMAIL ');
        console.log('═══════════════════════════════════════');
        console.log(`  To    : ${toEmail}`);
        console.log(`  OTP   : ${otp}`);
        console.log(`  Valid : 5 minutes`);
        console.log('═══════════════════════════════════════');
        console.log('  ⚠  Set GMAIL_PASS in server/.env to');
        console.log('  enable real email sending.');
        console.log('═══════════════════════════════════════\n');
        return; // skip actual sending
    }

    // PRODUCTION — send real email
    const mailOptions = {
        from:    `"YTLearn" <${process.env.GMAIL_USER}>`,
        to:      toEmail,
        subject: 'YTLearn — Your Login Code',
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
               style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:16px;
                      overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
          <tr>
            <td style="background:linear-gradient(135deg,#5440e0,#a78bfa);padding:30px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:1px;">▶ YTLearn</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Your AI-Powered Study Cockpit</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 36px;">
              <p style="margin:0 0 12px;color:#a0aec0;font-size:14px;">Hello,</p>
              <p style="margin:0 0 28px;color:#e2e8f0;font-size:15px;line-height:1.6;">
                Here is your one-time login code for YTLearn:
              </p>
              <div style="background:#0d0d1e;border:2px solid #5440e0;border-radius:12px;
                          padding:24px;text-align:center;margin:0 0 28px;">
                <div style="font-size:42px;font-weight:700;letter-spacing:12px;
                            color:#a78bfa;font-family:monospace;">
                  ${otp}
                </div>
              </div>
              <p style="margin:0 0 24px;color:#718096;font-size:13px;text-align:center;">
                ⏰ This code expires in <strong style="color:#e2e8f0;">5 minutes</strong>
              </p>
              <p style="margin:0;color:#4a5568;font-size:12px;line-height:1.6;">
                If you did not request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
              <p style="margin:0;color:#2d3748;font-size:11px;">© 2026 YTLearn. Made with ❤ for learners.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[email] OTP sent → ${toEmail}`);
}
