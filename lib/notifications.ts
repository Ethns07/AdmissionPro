export async function sendNotificationEmail(to: string, subject: string, html: string) {
  // Mock sending email to avoid external API dependencies
  console.log('--- Mock Email Notification ---');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('Content (HTML):', html);
  console.log('--- End Mock Email ---');
  
  return { success: true, data: { id: 'mock-id' } };
}

export const EMAIL_TEMPLATES = {
  APPLICATION_RECEIVED: (studentName: string, programName: string) => ({
    subject: `Application Received: ${programName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
        <h2 style="color: #4f46e5;">Application Received!</h2>
        <p>Dear ${studentName},</p>
        <p>We have successfully received your application for the <strong>${programName}</strong> program.</p>
        <p>Our admissions team will review your application shortly. You can track your application status in your dashboard.</p>
        <p style="margin-top: 20px;">Best regards,<br>Admissions Team</p>
      </div>
    `
  }),
  STATUS_UPDATE: (studentName: string, programName: string, newStatus: string) => ({
    subject: `Application Status Updated: ${programName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
        <h2 style="color: #4f46e5;">Status Update</h2>
        <p>Dear ${studentName},</p>
        <p>Your application for <strong>${programName}</strong> has been updated to: <strong style="text-transform: uppercase;">${newStatus.replace('_', ' ')}</strong></p>
        <p>Please log in to your dashboard to view more details or complete any required next steps.</p>
        <p style="margin-top: 20px;">Best regards,<br>Admissions Team</p>
      </div>
    `
  }),
  PAYMENT_CONFIRMED: (studentName: string, programName: string, amount: number) => ({
    subject: `Payment Confirmation: ${programName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
        <h2 style="color: #059669;">Payment Confirmed</h2>
        <p>Dear ${studentName},</p>
        <p>Your payment of $${amount} for <strong>${programName}</strong> has been successfully processed.</p>
        <p>Thank you for your payment. Your enrollment details will be shared soon if applicable.</p>
        <p style="margin-top: 20px;">Best regards,<br>Accounts Department</p>
      </div>
    `
  })
};
