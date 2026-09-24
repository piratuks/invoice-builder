import keytar from 'keytar';
import type { Response } from '../shared/types/response';

const SERVICE = 'invoice-builder';
const ACCOUNT = 'smtp-password';

export const getSmtpPassword = () => keytar.getPassword(SERVICE, ACCOUNT);

export const hasSmtpPassword = async (): Promise<Response<{ configured: boolean; source: 'keychain' }>> => {
  const password = await getSmtpPassword();
  return { success: true, data: { configured: Boolean(password), source: 'keychain' } };
};

export const setSmtpPassword = async (password: string): Promise<Response<unknown>> => {
  if (!password) return { success: false, key: 'error.smtpPasswordRequired' };
  await keytar.setPassword(SERVICE, ACCOUNT, password);
  return { success: true };
};

export const deleteSmtpPassword = async (): Promise<Response<unknown>> => {
  await keytar.deletePassword(SERVICE, ACCOUNT);
  return { success: true };
};
