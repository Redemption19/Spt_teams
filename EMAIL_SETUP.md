# Email Service Setup Guide

This project uses EmailJS to send invitation emails. Follow these steps to set up email functionality:

## 1. Create an EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

## 2. Configure Email Service

1. **Add Email Service:**
   - Go to Email Services in your EmailJS dashboard
   - Click "Add New Service"
   - Choose your email provider (Gmail, Outlook, etc.)
   - Follow the authentication steps

2. **Create Email Template:**
   - Go to Email Templates
   - Click "Create New Template"
   - Use the following template variables:
     - `{{to_email}}` - Recipient email
     - `{{to_name}}` - Recipient name
     - `{{from_name}}` - Sender name
     - `{{workspace_name}}` - Workspace name
     - `{{role}}` - User role
     - `{{team_name}}` - Team name (optional)
     - `{{invitation_link}}` - Link to accept invitation
     - `{{expires_at}}` - Expiration date

3. **Sample Email Template:**
   ```html
   Subject: You're invited to join {{workspace_name}}

   Hi {{to_name}},

   {{from_name}} has invited you to join {{workspace_name}} as a {{role}}.
   
   {{#team_name}}
   You'll be part of the {{team_name}} team.
   {{/team_name}}

   Click the link below to accept your invitation:
   {{invitation_link}}

   This invitation expires on {{expires_at}}.

   Best regards,
   The {{workspace_name}} Team
   ```

## 3. Environment Variables

1. Copy `.env.example` to `.env.local`
2. Fill in your EmailJS credentials:
   ```env
   NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
   NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
   ```

## 4. Testing

1. Go to your team management page
2. Click "Invite Users"
3. Enter an email address
4. Send the invitation
5. Check the email inbox and EmailJS dashboard for delivery status

## 5. Email Limits

- Free plan: 200 emails/month
- Paid plans: Higher limits available
- Consider implementing a queue system for bulk invitations

## 6. Security Notes

- Email templates are public, don't include sensitive data
- Use HTTPS for invitation links
- Consider implementing rate limiting for invitations
- Monitor EmailJS usage to prevent abuse

## 7. Alternative Email Services

If you prefer other email services, you can replace EmailJS with:
- SendGrid
- Mailgun
- AWS SES
- Postmark
- Resend

Just update the `EmailService` class in `lib/email-service.ts` to use your preferred provider.
