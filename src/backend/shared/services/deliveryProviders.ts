import { DeliveryProvider } from '../enums/deliveryProvider';
import type { DatabaseAdapter } from '../types/DatabaseAdapter';
import type { Response } from '../types/response';
import type { Settings } from '../types/settings';
import { createSmtpTransport, formatSmtpFrom, isSmtpConfigured, type SmtpSettings } from './smtpDelivery';

export type DeliverySecrets = {
  smtpPassword?: string;
};

export type DeliveryMessage = {
  recipient: string;
  subject: string;
  text: string;
};

export type DeliveryProviderSettings = Pick<Settings, 'deliveryProvider'> & SmtpSettings;

export interface DeliveryProviderAdapter {
  provider: DeliveryProvider;
  isConfigured(settings: DeliveryProviderSettings | null | undefined, secrets?: DeliverySecrets): boolean;
  send(
    settings: DeliveryProviderSettings,
    secrets: DeliverySecrets | undefined,
    message: DeliveryMessage
  ): Promise<void>;
}

const smtpProvider: DeliveryProviderAdapter = {
  provider: DeliveryProvider.smtp,
  isConfigured: (settings, secrets) => isSmtpConfigured(settings, secrets?.smtpPassword),
  send: async (settings, secrets, message) => {
    const config = { ...settings, smtpPassword: secrets?.smtpPassword };
    await createSmtpTransport(config).sendMail({
      from: formatSmtpFrom(config),
      to: message.recipient,
      subject: message.subject,
      text: message.text
    });
  }
};

const deliveryProviderAdapters: Record<DeliveryProvider, DeliveryProviderAdapter> = {
  [DeliveryProvider.smtp]: smtpProvider
};

const getProvider = (settings?: DeliveryProviderSettings | null) =>
  deliveryProviderAdapters[settings?.deliveryProvider ?? DeliveryProvider.smtp];

export const getDeliverySettings = async (db: DatabaseAdapter) =>
  db.get<DeliveryProviderSettings>('SELECT * FROM settings LIMIT 1');

export const isDeliveryConfigured = (
  settings: DeliveryProviderSettings | null | undefined,
  secrets?: DeliverySecrets
) => getProvider(settings).isConfigured(settings, secrets);

export const sendDelivery = async (
  settings: DeliveryProviderSettings,
  secrets: DeliverySecrets | undefined,
  message: DeliveryMessage
) => getProvider(settings).send(settings, secrets, message);

export const testDeliveryProvider = async (
  db: DatabaseAdapter,
  data: { recipient: string; secrets?: DeliverySecrets }
): Promise<Response<unknown>> => {
  const recipient = data.recipient.trim();
  if (!recipient) return { success: false, key: 'error.smtpTestRecipientRequired' };

  const settings = await getDeliverySettings(db);
  if (!isDeliveryConfigured(settings, data.secrets)) return { success: false, key: 'error.smtpNotConfigured' };

  try {
    await sendDelivery(settings!, data.secrets, {
      recipient,
      subject: 'Invoice Builder delivery test',
      text: 'This is a test email from Invoice Builder.'
    });
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : String(error) };
  }
};
