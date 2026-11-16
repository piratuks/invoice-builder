import { describe, expect, it, vi } from 'vitest';
import type { EditionIpcRegistrar } from '../contract';
import { registerEditionHandlers } from '../index';
import { createEditionIpcInitializer, createEditionIpcRegistrar } from '../registration';

describe('Community edition IPC registration', () => {
  it('contributes no additional IPC handlers', () => {
    const registrar = { handle: vi.fn() } as unknown as EditionIpcRegistrar;

    registerEditionHandlers(registrar);

    expect(registrar.handle).not.toHaveBeenCalled();
  });

  it('only accepts unique, namespaced handlers through the restricted registrar', () => {
    const handle = vi.fn();
    const registrar = createEditionIpcRegistrar({ handle } as never);
    const handler = vi.fn();

    registrar.handle('edition:status', handler);

    expect(handle).toHaveBeenCalledWith('edition:status', handler);
    expect(() => registrar.handle('status' as `edition:${string}`, handler)).toThrow(
      'Edition IPC channels must use the "edition:" namespace.'
    );
    expect(() => registrar.handle('edition:status', handler)).toThrow(
      'Edition IPC handler already registered: "edition:status".'
    );
    expect(handle).toHaveBeenCalledOnce();
  });

  it('runs the edition registration implementation only once', () => {
    const handle = vi.fn();
    const register = vi.fn((registrar: EditionIpcRegistrar) => registrar.handle('edition:status', vi.fn()));
    const initialize = createEditionIpcInitializer(register, { handle } as never);

    initialize();
    initialize();

    expect(register).toHaveBeenCalledOnce();
    expect(handle).toHaveBeenCalledOnce();
  });
});
