# EmailJS Template Setup for Standard Pensions Trust

## Template Variables

Based on your HTML template, here are the variables you need to set up in your EmailJS template:

### Required Variables in EmailJS Template:
```
{{to_email}} - Recipient's email address
{{to_name}} - Recipient's name (fallback to email prefix)
{{from_name}} - Name of person sending the invitation
{{workspace_name}} - Name of the workspace they're being invited to
{{role}} - Their assigned role (admin, member, etc.)
{{team_name}} - Team name (optional)
{{invitation_link}} - The actual invitation URL
{{expires_at}} - When the invitation expires
{{company_name}} - Company name (Standard Pensions Trust)
{{support_email}} - Support contact email
```

## Updated HTML Template for EmailJS

Replace your current EmailJS template content with this updated version that uses the variables:

```html
<div style="font-family: system-ui, sans-serif, Arial; font-size: 16px; background-color: #fff8f1;">
<div style="max-width: 600px; margin: auto; padding: 16px;">
  <a style="text-decoration: none; outline: none;" href="https://www.standardpensions.com" target="_blank" rel="noopener">
    <img style="height: 32px; vertical-align: middle;" src="cid:logo.png" alt="Standard Pensions Trust Logo" height="32px">
  </a>
  
  <p>Hello {{to_name}},</p>
  
  <p>{{from_name}} has invited you to join <strong>{{workspace_name}}</strong> on {{company_name}}'s collaboration platform.</p>
  
  {{#team_name}}
  <p>You'll be part of the <strong>{{team_name}}</strong> team with the role of <strong>{{role}}</strong>.</p>
  {{/team_name}}
  
  {{^team_name}}
  <p>You've been assigned the role of <strong>{{role}}</strong>.</p>
  {{/team_name}}
  
  <p>Click the button below to accept your invitation and get started:</p>
  
  <p>
    <a style="display: inline-block; text-decoration: none; outline: none; color: #fff; background-color: #fc0038; padding: 10px 20px; border-radius: 4px; font-weight: bold;" href="{{invitation_link}}" target="_blank" rel="noopener">
      Join Workspace
    </a>
  </p>
  
  <p><small>This invitation expires on {{expires_at}}.</small></p>
  
  <p>If you weren&rsquo;t expecting this email or have any questions, feel free to reach out to our team at 
    <a style="text-decoration: none; color: #fc0038;" href="mailto:{{support_email}}">
      {{support_email}}
    </a>.
  </p>
  
  <p>We look forward to collaborating with you!</p>
  
  <p>Best regards,<br>The {{company_name}} Team</p>
</div>
</div>
```

## Email Subject Template

For the subject line in EmailJS, use:
```
You're invited to join {{workspace_name}} - {{company_name}}
```

## Testing Your Template

1. Go to your EmailJS dashboard
2. Navigate to your template (template_2h95qor)
3. Replace the HTML content with the updated template above
4. Use the test feature with sample data:
   - to_email: test@example.com
   - to_name: John Doe
   - from_name: Sarah Wilson
   - workspace_name: Marketing Team
   - role: member
   - team_name: Content Team
   - invitation_link: https://your-app.com/invite?token=abc123
   - expires_at: January 25, 2024
   - company_name: Standard Pensions Trust
   - support_email: support@standardpensionstrust.com

## Logo Setup

Since your template uses `cid:logo.png`, you'll need to:

1. **Option 1: Use hosted image**
   - Upload your logo to a public URL
   - Replace `cid:logo.png` with the full URL

2. **Option 2: Use EmailJS attachments**
   - Upload logo as attachment in EmailJS
   - Keep `cid:logo.png` reference

## Environment Variables Already Set

✅ Your .env.local already has:
```
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_d7cifw8
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_2h95qor
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=a3wvDMMpi31BJ18j1
```

## Next Steps

1. Update your EmailJS template with the new HTML above
2. Test the template with sample data
3. Try sending an actual invitation from your app
4. Check the email delivery and formatting

The system is now ready to send professional Standard Pensions Trust branded invitation emails! 🚀
