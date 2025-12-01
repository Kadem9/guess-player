import mailjet from 'node-mailjet';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
}

export interface EmailVerificationData {
  name: string;
  verificationUrl: string;
}

export interface EmailTemplate {
  render: (data: any) => string;
}


export class EmailService {
  private static readonly FROM_EMAIL = process.env.FROM_EMAIL || '';
  private static readonly FROM_NAME = process.env.FROM_NAME || 'Guess Player';
  // via la doc mailjet
  private static getMailjetClient() {
    const apiKeyPublic = process.env.API_MAILJET_PUBLIC;
    const apiKeySecret = process.env.API_MAILJET_SECRET;

    if (!apiKeyPublic || !apiKeySecret) {
      throw new Error('API_MAILJET_PUBLIC et API_MAILJET_SECRET doivent être configurés dans le .env');
    }

    return mailjet.apiConnect(apiKeyPublic, apiKeySecret);
  }

  static async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const apiKeyPublic = process.env.API_MAILJET_PUBLIC;
      const apiKeySecret = process.env.API_MAILJET_SECRET;

      if (!apiKeyPublic || !apiKeySecret) {
        console.error('API_MAILJET_PUBLIC et API_MAILJET_SECRET doivent être configurés');
        return { success: false, error: 'Configuration email manquante' };
      }

      const fromEmail = options.from || EmailService.FROM_EMAIL;
      const fromName = options.fromName || EmailService.FROM_NAME;

      if (!fromEmail) {
        console.error('FROM_EMAIL doit être configuré dans le .env');
        return { success: false, error: 'FROM_EMAIL non configuré' };
      }

      const client = EmailService.getMailjetClient();

      const result = await client.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: {
              Email: fromEmail,
              Name: fromName,
            },
            To: [
              {
                Email: options.to,
              },
            ],
            Subject: options.subject,
            HTMLPart: options.html,
          },
        ],
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur envoi email:', error);

      let errorMessage = 'Erreur inconnue';
      if (error.response) {
        const statusCode = error.response.status || error.statusCode;
        const body = error.response.body || error.body;
        errorMessage = `Erreur Mailjet (${statusCode}): ${JSON.stringify(body)}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  }

  static async sendVerificationEmail(
    email: string,
    data: EmailVerificationData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { EmailVerificationTemplate } = await import('@/templates/email/EmailVerificationTemplate');
      const template = new EmailVerificationTemplate();

      return EmailService.sendEmail({
        to: email,
        subject: 'Vérifiez votre adresse email - Guess Player',
        html: template.render(data),
      });
    } catch (error: any) {
      console.error('Erreur lors de la compilation du template:', error);
      return { success: false, error: error.message || 'Erreur lors de la compilation du template' };
    }
  }
}
