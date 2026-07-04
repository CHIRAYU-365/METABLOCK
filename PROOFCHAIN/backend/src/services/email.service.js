const nodemailer = require('nodemailer');

const createTransporter = async () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  } else {
    // Generate ethereal test account dynamically on-the-fly
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }
};

const sendVerificationEmail = async (toEmail, documentName, docHash) => {
  try {
    const transporter = await createTransporter();
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify?hash=${docHash}`;

    const mailOptions = {
      from: `"ProofChain Cryptographic Registry" <no-reply@proofchain.io>`,
      to: toEmail,
      subject: `📜 New Verified Document Issued: ${documentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #121216; color: #ffffff;">
          <h2 style="color: #a855f7; border-bottom: 2px solid #a855f7; padding-bottom: 10px;">Document Authenticated on Solana</h2>
          <p>Hello,</p>
          <p>A new secure credential/document has been issued to your email address on the ProofChain Platform.</p>
          <div style="background-color: rgba(255,255,255,0.05); padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Document:</strong> ${documentName}</p>
            <p style="margin: 5px 0; word-break: break-all;"><strong>SHA-256 Hash:</strong> ${docHash}</p>
          </div>
          <p>You can verify its authenticity and view the cryptographic ledger record by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background-color: #a855f7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Authenticity</a>
          </div>
          <p style="font-size: 0.8rem; color: #a0aec0;">If the button above does not work, copy and paste this URL into your browser:<br/>${verifyUrl}</p>
          <hr style="border: 0; border-top: 1px solid #4a5568; margin: 20px 0;"/>
          <p style="font-size: 0.8rem; color: #a0aec0; text-align: center;">ProofChain Protocol — Decentralized Verification Service</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email verification sent: ${info.messageId}`);
    
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`Ethereal Mail Preview Link: ${previewUrl}`);
    }
    
    return info;
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }
};

module.exports = {
  sendVerificationEmail
};
