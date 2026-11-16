import type { IpcMainInvokeEvent } from 'electron';

export type EditionIpcChannel = `edition:${string}`;

export interface EditionIpcRegistrar {
  handle<TArgs extends unknown[], TResult>(
    channel: EditionIpcChannel,
    handler: (event: IpcMainInvokeEvent, ...args: TArgs) => TResult | Promise<TResult>
  ): void;
}
