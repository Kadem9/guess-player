import { EmailTemplate } from '@/services/email';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface EmailVerificationData {
  name: string;
  verificationUrl: string;
}

export class EmailVerificationTemplate implements EmailTemplate {
  private static htmlTemplate: string | null = null;

  private getHtmlTemplate(): string {
    if (EmailVerificationTemplate.htmlTemplate === null) {
      const templatePath = join(process.cwd(), 'src', 'templates', 'email', 'compiled', 'EmailVerificationTemplate.html');
      EmailVerificationTemplate.htmlTemplate = readFileSync(templatePath, 'utf-8');
    }
    return EmailVerificationTemplate.htmlTemplate;
  }

  render(data: EmailVerificationData): string {
    const { name, verificationUrl } = data;
    const currentYear = new Date().getFullYear().toString();

    let html = this.getHtmlTemplate();

    html = html.replace(/\{\{name\}\}/g, name);
    html = html.replace(/\{\{verificationUrl\}\}/g, verificationUrl);
    html = html.replace(/\{\{year\}\}/g, currentYear);

    return html;
  }
}
