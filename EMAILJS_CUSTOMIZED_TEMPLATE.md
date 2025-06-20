# Customized EmailJS Password Reset Template

## Your Updated Template

Replace your current EmailJS template with this customized version that maintains your styling but implements the hybrid approach:

```html
<div
  style="
    font-family: system-ui, sans-serif, Arial;
    font-size: 14px;
    color: #333;
    padding: 20px 14px;
    background-color: #f5f5f5;
  "
>
  <div style="max-width: 600px; margin: auto; background-color: #fff">
    <div style="text-align: center; background-color: #333; padding: 14px">
      <a style="text-decoration: none; outline: none" href="https://www.standardpensions.com" target="_blank">
        <img
          style="height: 32px; vertical-align: middle"
          height="32px"
          src="cid:logo.png"
          alt="Standard Pensions Trust Logo"
        />
      </a>
    </div>
    <div style="padding: 14px">
      <h1 style="font-size: 22px; margin-bottom: 26px; color: #fc0038;">Password Reset Request</h1>
      
      <p>Hello {{to_name}},</p>
      
      <p>{{requested_by}} has requested a password reset for your {{company_name}} account.</p>
      
      <div style="background-color: #fff8f1; padding: 16px; border-left: 4px solid #fc0038; margin: 20px 0;">
        <p style="margin: 0; font-weight: bold; color: #fc0038;">🔒 Important Security Notice</p>
        <p style="margin: 8px 0 0 0;">
          You will receive a <strong>separate email from Firebase</strong> with the secure password reset link. 
          This email is a branded notification to confirm your request.
        </p>
      </div>
      
      <p><strong>What happens next:</strong></p>
      <ol style="margin: 16px 0; padding-left: 20px; line-height: 1.6;">
        <li>Check your email for a message from <code>noreply@[project].firebaseapp.com</code></li>
        <li>Click the "Reset Password" button in that Firebase email</li>
        <li>Follow the secure process to set your new password</li>
        <li>Sign in with your new password</li>
      </ol>
      
      <div style="background-color: #f5f5f5; padding: 12px; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0; font-size: 13px; color: #666;">
          <strong>Security Information:</strong><br>
          • The reset link expires on <strong>{{expires_at}}</strong><br>
          • If you didn't request this reset, please ignore both emails<br>
          • Your password will not change unless you complete the Firebase reset process<br>
          • Check your spam folder if you don't see the Firebase email
        </p>
      </div>
      
      <p>
        If you have any questions or concerns, please contact our support team at 
        <a style="color: #fc0038; text-decoration: none;" href="mailto:{{support_email}}">{{support_email}}</a>.
      </p>
      
      <p>Best regards,<br />The {{company_name}} Security Team</p>
    </div>
  </div>
  <div style="max-width: 600px; margin: auto">
    <p style="color: #999; font-size: 12px;">
      This is a branded notification from {{company_name}}. The actual password reset link will come from Firebase for security.<br>
      The email was sent to {{to_email}}<br />
      You received this email because you are registered with {{company_name}}
    </p>
  </div>
</div>
```

## Template Variables to Set Up

Make sure these variables are configured in your EmailJS template:

```
{{to_email}} - Recipient's email address
{{to_name}} - Recipient's name  
{{expires_at}} - When the reset link expires
{{company_name}} - Standard Pensions Trust
{{support_email}} - support@standardpensionstrust.com
{{requested_by}} - Who requested the reset (user or admin name)
```

## Subject Line

Update your email subject to:
```
Password Reset Notification - {{company_name}}
```

## Key Changes Made

1. **Updated heading** to "Password Reset Request" with your brand color
2. **Added security notice** explaining the dual-email process
3. **Clear instructions** on what to expect and do next
4. **Branded styling** with Standard Pensions Trust colors (#fc0038)
5. **Professional layout** maintaining your existing structure
6. **Security information** in a highlighted box
7. **Updated footer** to explain this is a notification email

## Test Values

Use these test values when testing your template:

```
to_email: test@example.com
to_name: John Doe
expires_at: January 25, 2024 at 3:00 PM
company_name: Standard Pensions Trust
support_email: support@standardpensionstrust.com
requested_by: You
```

For admin-initiated resets, use:
```
requested_by: Sarah Wilson (Admin)
```

## Environment Variable

Make sure you have this in your `.env.local`:
```bash
NEXT_PUBLIC_EMAILJS_PASSWORD_RESET_TEMPLATE_ID=your_template_id
```

This template maintains your existing design aesthetic while clearly explaining the hybrid password reset process to users! 🎨 