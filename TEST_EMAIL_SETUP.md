# Testing Email Setup

## Quick Test for EmailJS Configuration

To verify your email service is working:

1. **Check Environment Variables**
   Make sure these are set in your `.env.local`:
   ```
   NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
   NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_INVITATION=your_invitation_template_id
   NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_WELCOME=your_welcome_template_id
   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
   ```

2. **Test Email Sending**
   - Go to `/dashboard/invite`
   - Send an invitation to your email
   - Check if email is received

3. **Check Browser Console**
   - Open DevTools (F12)
   - Look for any EmailJS errors
   - Should see "Invitation email sent successfully" if working

4. **Common Issues**
   - EmailJS templates not created
   - Service ID mismatch
   - Template variables mismatch
   - EmailJS quota exceeded

## Template Variables Required

### Invitation Template:
- `to_email`
- `to_name`
- `from_name`
- `workspace_name`
- `role`
- `team_name` (optional)
- `invitation_link`
- `expires_at`

### Welcome Template:
- `to_email`
- `to_name`
- `workspace_name` 