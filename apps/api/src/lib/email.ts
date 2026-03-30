import { Resend } from 'resend';

import type { Business, UserProfile } from 'types';

export interface EmailService {
  sendBusinessApprovedEmail(input: { business: Business; owner?: UserProfile }): Promise<void>;
}

class ConsoleEmailService implements EmailService {
  async sendBusinessApprovedEmail(input: { business: Business; owner?: UserProfile }) {
    console.log('[email:console] business approved', {
      businessId: input.business.id,
      businessName: input.business.name,
      ownerEmail: input.owner?.email,
    });
  }
}

class ResendEmailService implements EmailService {
  private readonly client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async sendBusinessApprovedEmail(input: { business: Business; owner?: UserProfile }) {
    if (!input.owner?.email) {
      return;
    }

    await this.client.emails.send({
      from: 'EncuentraloTodo <noreply@encuentralotodo.app>',
      to: [input.owner.email],
      subject: `${input.business.name} ya fue aprobado`,
      html: `<p>Hola ${input.owner.fullName}, tu negocio <strong>${input.business.name}</strong> ya está visible en EncuentraloTodo.</p><p>Empieza a compartir tu perfil y a recibir contactos por WhatsApp.</p>`,
    });
  }
}

export function createEmailService(apiKey?: string): EmailService {
  if (!apiKey) {
    return new ConsoleEmailService();
  }

  return new ResendEmailService(apiKey);
}