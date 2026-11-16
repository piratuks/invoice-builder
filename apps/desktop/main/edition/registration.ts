import { ipcMain, type IpcMain } from 'electron';
import type { EditionIpcChannel, EditionIpcRegistrar } from './contract';
import { registerEditionHandlers } from './index';

const editionChannelPrefix = 'edition:';

export const createEditionIpcRegistrar = (target: Pick<IpcMain, 'handle'>): EditionIpcRegistrar => {
  const registeredChannels = new Set<string>();

  return {
    handle(channel, handler) {
      if (!channel.startsWith(editionChannelPrefix) || channel.length === editionChannelPrefix.length) {
        throw new Error(`Edition IPC channels must use the "${editionChannelPrefix}" namespace.`);
      }
      if (registeredChannels.has(channel)) {
        throw new Error(`Edition IPC handler already registered: "${channel}".`);
      }

      registeredChannels.add(channel);
      target.handle(channel as EditionIpcChannel, handler);
    }
  };
};

export const createEditionIpcInitializer = (
  register: (registrar: EditionIpcRegistrar) => void,
  target: Pick<IpcMain, 'handle'>
) => {
  let registrationAttempted = false;
  return (): void => {
    if (registrationAttempted) return;
    // Mark before calling out so a partial registration cannot be repeated.
    registrationAttempted = true;
    register(createEditionIpcRegistrar(target));
  };
};

const initializeEditionHandlers = createEditionIpcInitializer(registerEditionHandlers, ipcMain);

export const initEditionIpcHandlers = (): void => initializeEditionHandlers();
