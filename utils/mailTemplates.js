exports.signUpTemplate = (otp, firstName) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h1>Welcome, ${firstName}!</h1>
      <p>Thanks for joining BookStore. Your account is ready to use.</p>
      <p>If you have any questions, reply to this email.</p>
    </div>
  `;
};
