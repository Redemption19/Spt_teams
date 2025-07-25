import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAIL_CONFIG = {
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '',
  templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '',
  passwordResetTemplateId: process.env.NEXT_PUBLIC_EMAILJS_PASSWORD_RESET_TEMPLATE_ID || process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '',
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '',
};

export interface EmailInvitation {
  to_email: string;
  to_name: string;
  from_name: string;
  workspace_name: string;
  role: string;
  team_name?: string;
  invitation_link: string;
  expires_at: string;
  company_name?: string;
  support_email?: string;
}

export interface PasswordResetEmail {
  to_email: string;
  to_name: string;
  reset_link: string;
  expires_at: string;
  company_name?: string;
  support_email?: string;
  requested_by?: string;
}

export class EmailService {
  /**
   * Initialize EmailJS (call this once in your app)
   */
  static init() {
    console.log('Initializing EmailJS with config:', {
      serviceId: EMAIL_CONFIG.serviceId,
      templateId: EMAIL_CONFIG.templateId,
      passwordResetTemplateId: EMAIL_CONFIG.passwordResetTemplateId,
      publicKey: EMAIL_CONFIG.publicKey ? 'Set' : 'Not set'
    });
    
    if (EMAIL_CONFIG.publicKey) {
      emailjs.init(EMAIL_CONFIG.publicKey);
      console.log('EmailJS initialized successfully');
    } else {
      console.warn('EmailJS public key not found');
    }
  }

  /**
   * Send password reset email using EmailJS
   */
  static async sendPasswordResetEmail(params: PasswordResetEmail): Promise<boolean> {
    try {
      if (!EMAIL_CONFIG.serviceId || !EMAIL_CONFIG.passwordResetTemplateId || !EMAIL_CONFIG.publicKey) {
        console.warn('EmailJS not configured for password reset. Email will not be sent.');
        return false;
      }

      // Initialize EmailJS with public key before sending
      emailjs.init(EMAIL_CONFIG.publicKey);

      const emailParams = {
        to_email: params.to_email,
        to_name: params.to_name,
        reset_link: params.reset_link,
        expires_at: params.expires_at,
        company_name: params.company_name || 'Standard Pensions Trust',
        support_email: params.support_email || 'support@standardpensionstrust.com',
        requested_by: params.requested_by || 'System Administrator',
      };

      console.log('Sending password reset email with parameters:', emailParams);

      const response = await emailjs.send(
        EMAIL_CONFIG.serviceId,
        EMAIL_CONFIG.passwordResetTemplateId,
        emailParams,
        EMAIL_CONFIG.publicKey
      );

      console.log('Password reset email sent successfully:', response);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  /**
   * Send invitation email using EmailJS
   */
  static async sendInvitationEmail(params: EmailInvitation): Promise<boolean> {
    try {
      if (!EMAIL_CONFIG.serviceId || !EMAIL_CONFIG.templateId || !EMAIL_CONFIG.publicKey) {
        console.warn('EmailJS not configured. Email will not be sent.');
        console.log('EmailJS Config:', {
          serviceId: EMAIL_CONFIG.serviceId,
          templateId: EMAIL_CONFIG.templateId,
          publicKey: EMAIL_CONFIG.publicKey ? 'Set' : 'Not set'
        });
        return false;
      }

      // Initialize EmailJS with public key before sending
      emailjs.init(EMAIL_CONFIG.publicKey);

      const emailParams = {
        to_email: params.to_email,
        to_name: params.to_name,
        from_name: params.from_name,
        workspace_name: params.workspace_name,
        role: params.role,
        team_name: params.team_name || 'General',
        invitation_link: params.invitation_link,
        expires_at: params.expires_at,
        company_name: params.company_name || 'Standard Pensions Trust',
        support_email: params.support_email || 'support@standardpensionstrust.com',
      };

      console.log('Sending email with parameters:', emailParams);
      console.log('EmailJS Config being used:', {
        serviceId: EMAIL_CONFIG.serviceId,
        templateId: EMAIL_CONFIG.templateId,
        publicKey: EMAIL_CONFIG.publicKey ? 'Set' : 'Not set'
      });

      const response = await emailjs.send(
        EMAIL_CONFIG.serviceId,
        EMAIL_CONFIG.templateId,
        emailParams,
        EMAIL_CONFIG.publicKey // Pass public key as third parameter
      );

      console.log('Email sent successfully:', response);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send welcome email to new user
   */
  static async sendWelcomeEmail(params: {
    to_email: string;
    to_name: string;
    workspace_name: string;
  }): Promise<boolean> {
    try {
      // You can create a separate template for welcome emails
      // For now, we'll just log it
      console.log('Welcome email would be sent to:', params);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }
}
