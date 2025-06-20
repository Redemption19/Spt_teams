# EmailJS Password Reset Notification Template

## Overview

This template sends a **branded notification** about password reset requests using EmailJS, while Firebase Auth handles the actual password reset process. This gives you better branding and deliverability for notifications while keeping Firebase's security for password changes.

## How It Works

1. **User requests password reset** → Your app calls `PasswordResetService.sendPasswordResetEmail()`
2. **Firebase Auth sends secure reset link** → Standard Firebase password reset email
3. **EmailJS sends branded notification** → Professional notification with your branding
4. **User receives both emails** → Better user experience with branded communication

## Template Variables

### Required Variables for Password Reset Template:
```
{{to_email}} - Recipient's email address
{{to_name}} - Recipient's name
{{reset_link}} - Instruction text (not actual link - Firebase handles that)
{{expires_at}} - When the reset link expires
{{company_name}} - Company name (Standard Pensions Trust)
{{support_email}} - Support contact email
{{requested_by}} - Who requested the reset (user or admin name)
```

## EmailJS Template HTML

Create a new template in EmailJS with this HTML content:

```html
<div style="font-family: system-ui, sans-serif, Arial; font-size: 16px; background-color: #fff8f1;">
<div style="max-width: 600px; margin: auto; padding: 16px;">
  <a style="text-decoration: none; outline: none;" href="https://www.standardpensions.com" target="_blank" rel="noopener">
    <img style="height: 32px; vertical-align: middle;" src="cid:logo.png" alt="Standard Pensions Trust Logo" height="32px">
  </a>
  
  <h2 style="color: #fc0038; margin-top: 24px;">Password Reset Request</h2>
  
  <p>Hello {{to_name}},</p>
  
  <p>{{requested_by}} has requested a password reset for your {{company_name}} account.</p>
  
  <p><strong>Important:</strong> You will receive a separate email from Firebase with the secure password reset link. This email is just to notify you about the request with our branding.</p>
  
  <div style="background-color: #f5f5f5; padding: 16px; border-left: 4px solid #fc0038; margin: 20px 0;">
    <p style="margin: 0; font-weight: bold;">What to do next:</p>
    <ol style="margin: 8px 0; padding-left: 20px;">
      <li>Check your email for a message from Firebase (noreply@[project].firebaseapp.com)</li>
      <li>Click the "Reset Password" button in that email</li>
      <li>Follow the secure process to set your new password</li>
    </ol>
  </div>
  
  <p><strong>Security Information:</strong></p>
  <ul style="margin: 16px 0; padding-left: 20px; color: #666;">
    <li>The reset link expires on <strong>{{expires_at}}</strong></li>
    <li>If you didn't request this reset, please ignore both emails</li>
    <li>Your password will not change unless you complete the Firebase reset process</li>
    <li>Check your spam folder if you don't see the Firebase email</li>
  </ul>
  
  <p>If you have any questions or concerns, please contact our support team at 
    <a style="text-decoration: none; color: #fc0038;" href="mailto:{{support_email}}">
      {{support_email}}
    </a>.
  </p>
  
  <p>Best regards,<br>The {{company_name}} Security Team</p>
  
  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
  
  <p style="font-size: 12px; color: #999; margin: 0;">
    This is a branded notification from {{company_name}}. The actual password reset link will come from Firebase for security.
  </p>
</div>
</div>
```

## Email Subject Template

For the subject line in EmailJS, use:
```
Password Reset Notification - {{company_name}}
```

## Environment Variables

Add this to your `.env.local` file:

```bash
# EmailJS Password Reset Template (create a separate template or reuse existing)
NEXT_PUBLIC_EMAILJS_PASSWORD_RESET_TEMPLATE_ID=template_password_reset

# Or use the same template as invitations if you prefer
# NEXT_PUBLIC_EMAILJS_PASSWORD_RESET_TEMPLATE_ID=template_2h95qor
```

## Setup Steps

1. **Create New Template in EmailJS Dashboard**:
   - Go to https://dashboard.emailjs.com/admin/templates
   - Click "Create New Template"
   - Name it "Password Reset Notification"
   - Use template ID like `template_password_reset`

2. **Configure Template**:
   - Set subject: `Password Reset Notification - {{company_name}}`
   - Paste the HTML content above
   - Set up the variables

3. **Test Template**:
   Use these test values:
   ```
   to_email: test@example.com
   to_name: John Doe
   reset_link: Please check your email from Firebase for the password reset link.
   expires_at: January 25, 2024 at 3:00 PM
   company_name: Standard Pensions Trust
   support_email: support@standardpensionstrust.com
   requested_by: Sarah Wilson (Admin)
   ```

4. **Update Environment Variables**:
   Add the new template ID to your `.env.local`

## Benefits of This Approach

✅ **Best of Both Worlds**: Firebase security + custom branding
✅ **Better Deliverability**: EmailJS notifications won't go to spam
✅ **User Education**: Clear instructions about the dual-email process
✅ **Professional Branding**: Your emails look professional and trustworthy
✅ **Security**: Firebase handles actual password changes securely
✅ **Analytics**: EmailJS provides delivery analytics for notifications
✅ **Flexibility**: Easy to modify notification templates
✅ **No Custom Token Management**: Firebase handles all security aspects

## Usage in Code

The system automatically sends both emails:

```typescript
// Self-service password reset
await PasswordResetService.sendPasswordResetEmail('user@example.com');

// Admin-initiated password reset
await PasswordResetService.sendAdminPasswordReset(
  'user@example.com', 
  'admin-id', 
  'Sarah Wilson'
);
```

## Email Flow

1. **User requests reset** → App triggers both Firebase Auth and EmailJS
2. **User receives branded notification** → Professional email from your EmailJS account
3. **User receives Firebase reset email** → Secure reset link from Firebase
4. **User follows Firebase process** → Secure password change through Firebase Auth
5. **User can log in with new password** → Standard Firebase Auth flow

## Troubleshooting

- **EmailJS notification fails**: Firebase reset still works, users just don't get branded notification
- **Firebase reset fails**: Users get error message, can try again
- **Both emails in spam**: Notify users to check spam folders in success message
- **Users confused by dual emails**: Clear instructions in notification email and UI

Your password reset system now provides professional branded notifications while maintaining Firebase Auth's security! 🚀 