import { ServerClient } from "postmark";
import type { ContactFormData } from "./validation";

// Lazy initialization to avoid build-time errors
let postmarkClient: ServerClient | null = null;

function getPostmarkClient(): ServerClient {
  if (!postmarkClient) {
    const token = process.env.POSTMARK_API_TOKEN;

    if (!token) {
      throw new Error("POSTMARK_API_TOKEN must be set");
    }

    postmarkClient = new ServerClient(token);
  }

  return postmarkClient;
}

/**
 * Email configuration
 */
function getEmailConfig() {
  return {
    fromEmail: process.env.POSTMARK_FROM_EMAIL || "noreply@extreamsys.com",
    replyToEmail: process.env.POSTMARK_REPLY_TO_EMAIL || "contact@extreamsys.com",
    internalNotificationEmail: process.env.POSTMARK_REPLY_TO_EMAIL || "contact@extreamsys.com",
  };
}

/**
 * Send contact form submission to internal team
 */
export async function sendContactFormNotification(
  data: ContactFormData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const result = await getPostmarkClient().sendEmail({
      From: getEmailConfig().fromEmail,
      To: getEmailConfig().internalNotificationEmail,
      ReplyTo: data.email, // Allow direct reply to the customer
      Subject: `New Contact Form Submission - ${data.name}`,
      HtmlBody: generateContactFormEmailHTML(data),
      TextBody: generateContactFormEmailText(data),
      Tag: "contact-form",
      TrackOpens: true,
      MessageStream: "outbound",
    });

    // Log successful send
    if (process.env.NODE_ENV === "development") {
      console.log("[Email Sent]", {
        messageId: result.MessageID,
        to: result.To,
      });
    }

    return {
      success: true,
      messageId: result.MessageID,
    };
  } catch (error) {
    console.error("[Email Send Error]", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Email send failed",
    };
  }
}

/**
 * Send confirmation email to customer
 */
export async function sendContactFormConfirmation(
  email: string,
  name: string
): Promise<{ success: boolean; messageId?: string }> {
  try {
    const result = await getPostmarkClient().sendEmail({
      From: getEmailConfig().fromEmail,
      To: email,
      ReplyTo: getEmailConfig().replyToEmail,
      Subject: "Thank You for Contacting ExtreamSys",
      HtmlBody: generateConfirmationEmailHTML(name),
      TextBody: generateConfirmationEmailText(name),
      Tag: "contact-confirmation",
      TrackOpens: true,
      MessageStream: "outbound",
    });

    return {
      success: true,
      messageId: result.MessageID,
    };
  } catch (error) {
    console.error("[Confirmation Email Error]", error);

    // Don't fail the entire request if confirmation email fails
    return {
      success: false,
    };
  }
}

/**
 * Generate HTML email for internal notification
 */
function generateContactFormEmailHTML(data: ContactFormData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1E293B; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1E3A5F 0%, #2D5F8D 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #FFFFFF; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
  </div>

  <div style="background: #FFFFFF; padding: 30px; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 12px 12px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #E2E8F0;"><strong>Name:</strong></td>
        <td style="padding: 12px 0; border-bottom: 1px solid #E2E8F0;">${data.name}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #E2E8F0;"><strong>Email:</strong></td>
        <td style="padding: 12px 0; border-bottom: 1px solid #E2E8F0;">
          <a href="mailto:${data.email}" style="color: #3B82F6; text-decoration: none;">${data.email}</a>
        </td>
      </tr>
      ${data.company ? `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #E2E8F0;"><strong>Company:</strong></td>
        <td style="padding: 12px 0; border-bottom: 1px solid #E2E8F0;">${data.company}</td>
      </tr>
      ` : ''}
      ${data.phone ? `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #E2E8F0;"><strong>Phone:</strong></td>
        <td style="padding: 12px 0; border-bottom: 1px solid #E2E8F0;">
          <a href="tel:${data.phone}" style="color: #3B82F6; text-decoration: none;">${data.phone}</a>
        </td>
      </tr>
      ` : ''}
    </table>

    <div style="margin-top: 24px; padding-top: 24px; border-top: 2px solid #E2E8F0;">
      <h3 style="color: #1E3A5F; margin: 0 0 12px 0;">Message:</h3>
      <div style="background: #F8F9FA; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${data.message}</div>
    </div>

    <div style="margin-top: 24px; padding: 16px; background: #EFF6FF; border-left: 4px solid #3B82F6; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #1E40AF;">
        <strong>Quick Actions:</strong> Reply directly to this email to respond to ${data.name}.
      </p>
    </div>
  </div>

  <div style="margin-top: 20px; text-align: center; color: #64748B; font-size: 12px;">
    <p>Submitted at: ${new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })} PST</p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate plain text email for internal notification
 */
function generateContactFormEmailText(data: ContactFormData): string {
  return `
NEW CONTACT FORM SUBMISSION
========================================

Name: ${data.name}
Email: ${data.email}
${data.company ? `Company: ${data.company}` : ''}
${data.phone ? `Phone: ${data.phone}` : ''}

MESSAGE:
----------------------------------------
${data.message}
----------------------------------------

Submitted at: ${new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })} PST

Reply directly to this email to respond to the customer.
  `.trim();
}

/**
 * Generate HTML confirmation email for customer
 */
function generateConfirmationEmailHTML(name: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You - ExtreamSys</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1E293B; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1E3A5F 0%, #2D5F8D 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: #FFFFFF; margin: 0; font-size: 28px;">ExtreamSys</h1>
  </div>

  <div style="background: #FFFFFF; padding: 40px; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 12px 12px;">
    <h2 style="color: #1E3A5F; margin: 0 0 16px 0;">Thank You, ${name}!</h2>

    <p style="font-size: 16px; line-height: 1.8;">
      We've received your message and appreciate you taking the time to reach out.
      Our team will review your inquiry and get back to you within <strong>1-2 business days</strong>.
    </p>

    <div style="margin: 30px 0; padding: 20px; background: #EFF6FF; border-left: 4px solid #3B82F6; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #1E40AF;">
        <strong>Need immediate assistance?</strong><br>
        Call us at: <a href="tel:+18585551234" style="color: #3B82F6; text-decoration: none;">+1 (858) 555-1234</a>
      </p>
    </div>

    <p style="color: #64748B; font-size: 14px; margin-top: 30px;">
      Best regards,<br>
      <strong style="color: #1E3A5F;">The ExtreamSys Team</strong><br>
      San Diego, CA
    </p>
  </div>

  <div style="margin-top: 20px; text-align: center; color: #94A3B8; font-size: 12px;">
    <p>
      ExtreamSys, LLC | San Diego, CA<br>
      <a href="https://extreamsys.com" style="color: #3B82F6; text-decoration: none;">extreamsys.com</a>
    </p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate plain text confirmation email
 */
function generateConfirmationEmailText(name: string): string {
  return `
Thank You, ${name}!

We've received your message and appreciate you taking the time to reach out.
Our team will review your inquiry and get back to you within 1-2 business days.

NEED IMMEDIATE ASSISTANCE?
Call us at: +1 (858) 555-1234

Best regards,
The ExtreamSys Team
San Diego, CA

---
ExtreamSys, LLC | San Diego, CA
https://extreamsys.com
  `.trim();
}
