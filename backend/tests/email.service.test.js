const nodemailer = require('nodemailer');
const { sendVerificationEmail } = require('../src/services/email.service');

jest.mock('nodemailer');

describe('sendVerificationEmail', () => {
  const sendMailMock = jest.fn().mockResolvedValue({ messageId: 'test-id' });

  beforeEach(() => {
    jest.clearAllMocks();
    nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });
    process.env.EMAIL_HOST = 'smtp.test.com';
    process.env.EMAIL_PORT = '587';
    process.env.EMAIL_USER = 'test@test.com';
    process.env.EMAIL_PASS = 'testpass';
    process.env.EMAIL_FROM = 'noreply@italor.com';
    process.env.FRONTEND_URL = 'http://localhost:5173';
  });

  it('calls nodemailer.createTransport with env config', async () => {
    await sendVerificationEmail({ toEmail: 'user@test.com', firstName: 'Jane', verificationToken: 'abc123' });
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'smtp.test.com', port: 587 })
    );
  });

  it('sends email to the correct recipient', async () => {
    await sendVerificationEmail({ toEmail: 'user@test.com', firstName: 'Jane', verificationToken: 'abc123' });
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user@test.com' })
    );
  });

  it('includes verification link with token in email body', async () => {
    await sendVerificationEmail({ toEmail: 'user@test.com', firstName: 'Jane', verificationToken: 'abc123' });
    const callArg = sendMailMock.mock.calls[0][0];
    expect(callArg.html).toContain('abc123');
    expect(callArg.text).toContain('abc123');
  });

  it('uses EMAIL_SECURE=true when set', async () => {
    process.env.EMAIL_SECURE = 'true';
    await sendVerificationEmail({ toEmail: 'user@test.com', firstName: 'Jane', verificationToken: 'abc123' });
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ secure: true })
    );
    delete process.env.EMAIL_SECURE;
  });
});
