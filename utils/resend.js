const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendWelcomeEmail(email, name, otp) {
  if (!email || typeof email !== 'string') {
    throw new Error('Recipient email must be a string');
  }

  const result = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: email,
    subject: 'Welcome to BookStore',
    html: `
      <h1>Welcome, ${name}</h1>
      <p>Thanks for joining BookStore. Your account is ready to use.</p>`
  });

  return result;
}