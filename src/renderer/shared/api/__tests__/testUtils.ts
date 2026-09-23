import { act } from '@testing-library/react';

export const runApiTrigger = async <T>(trigger: () => T | PromiseLike<T>): Promise<Awaited<T>> => {
  let result: Awaited<T> | undefined;

  await act(async () => {
    result = await trigger();
  });

  return result as Awaited<T>;
};

export const runApiUpdate = (update: () => void) => {
  act(update);
};
