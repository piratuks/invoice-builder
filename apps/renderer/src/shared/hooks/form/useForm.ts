import { useState } from 'react';

export const useForm = <T extends object>(initial: T) => {
  const [form, setForm] = useState<T>(initial);

  const update = <K extends keyof T>(key: K, value: T[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return { form, setForm, update };
};
