# EmailJS Troubleshooting Guide

## Current Error: "The recipients address is empty"

This error occurs when EmailJS cannot find the recipient email address in your template configuration.

## Steps to Fix:

### 1. Check Your EmailJS Template Settings

1. Go to https://dashboard.emailjs.com/admin/templates
2. Find your template (ID: `template_578f9qj`)
3. Click on "Settings" or "Edit"

### 2. Configure the "To" Field

In your template settings, you need to set the "To" field to use the `to_email` variable:

**In the "To" field, enter:**
```
{{to_email}}
```

**NOT:**
- `{{email}}`
- `{{recipient}}`
- `{{user_email}}`

The exact variable name must be `{{to_email}}` as that's what the application is sending.

### 3. Verify Template Variables

Make sure your EmailJS template uses these exact variable names:

- `{{to_email}}` - Recipient's email (MUST be in the "To" field)
- `{{to_name}}` - Recipient's name
- `{{from_name}}` - Sender's name
- `{{workspace_name}}` - Workspace name
- `{{role}}` - User role
- `{{team_name}}` - Team name (optional)
- `{{invitation_link}}` - Invitation URL
- `{{expires_at}}` - Expiration date
- `{{company_name}}` - Company name
- `{{support_email}}` - Support email

### 4. Template Content

Your template HTML should use the variables like this:
```html
<p>Hello {{to_name}},</p>
<p>{{from_name}} has invited you to join <strong>{{workspace_name}}</strong>.</p>
<p>Your role will be: <strong>{{role}}</strong></p>
<a href="{{invitation_link}}">Accept Invitation</a>
```

### 5. Test Template

After making changes:
1. Save your template
2. Use the "Test" feature in EmailJS dashboard
3. Send a test email with sample data
4. Verify the email is received

### 6. Common Issues

1. **Variable names don't match**: Ensure exact spelling and case
2. **To field not set**: The "To" field MUST contain `{{to_email}}`
3. **Service not linked**: Make sure your template is linked to the correct service
4. **Public key issues**: Verify your public key is correct

### 7. Debug Information

The application will now log the exact parameters being sent to EmailJS. Check the browser console for:
```
Sending email with parameters: { to_email: "...", ... }
```

This will help you verify that the email address is being passed correctly.

## Quick Fix Checklist

- [ ] EmailJS template "To" field contains `{{to_email}}`
- [ ] Template ID matches: `template_578f9qj`
- [ ] Service ID matches: `service_d7cifw8`
- [ ] Public key is correct: `a3wvDMMpi31BJ18j1`
- [ ] Template is saved and published
- [ ] Test email works from EmailJS dashboard

## Need Help?

If you're still having issues:
1. Check the browser console for the debug logs
2. Test sending an email directly from the EmailJS dashboard
3. Verify all environment variables are correctly set
4. Make sure there are no typos in variable names
