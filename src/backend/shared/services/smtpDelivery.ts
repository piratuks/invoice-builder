import nodemailer from 'nodemailer';
import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import type { Response } from '../types/response';
import type { Settings } from '../types/settings';

export type SmtpSettings = Pick<
  Settings,
  'smtpHost' | 'smtpPort' | 'smtpSecure' | 'smtpUser' | 'smtpFromEmail' | 'smtpFromName'
>;

export type SmtpDeliveryConfig = SmtpSettings & { smtpPassword?: string };

export const getSmtpSettings = async (db: DatabaseAdapter) => db.get<SmtpSettings>('SELECT * FROM settings LIMIT 1');

export const isSmtpConfigured = (settings: SmtpSettings | null | undefined, smtpPassword?: string) => {
  return Boolean(
    settings?.smtpHost && settings.smtpPort && settings.smtpFromEmail && (!settings.smtpUser || smtpPassword)
  );
};

export const createSmtpTransport = (settings: SmtpDeliveryConfig) =>
  nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpSecure,
    auth: settings.smtpUser
      ? {
          user: settings.smtpUser,
          pass: settings.smtpPassword
        }
      : undefined
  });

export const formatSmtpFrom = (settings: SmtpDeliveryConfig) =>
  settings.smtpFromName
    ? `"${settings.smtpFromName.replace(/"/g, '\\"')}" <${settings.smtpFromEmail}>`
    : settings.smtpFromEmail;

export const testSmtpDelivery = async (
  db: DatabaseAdapter,
  data: { recipient: string; smtpPassword?: string }
): Promise<Response<unknown>> => {
  const recipient = data.recipient.trim();
  if (!recipient) return { success: false, key: 'error.smtpTestRecipientRequired' };

  const settings = await getSmtpSettings(db);
  if (!isSmtpConfigured(settings, data.smtpPassword)) return { success: false, key: 'error.smtpNotConfigured' };

  try {
    const config = { ...settings!, smtpPassword: data.smtpPassword };
    await createSmtpTransport(config).sendMail({
      from: formatSmtpFrom(config),
      to: recipient,
      subject: 'Invoice Builder SMTP test',
      text: 'This is a test email from Invoice Builder.'
    });
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : String(error) };
  }
};
