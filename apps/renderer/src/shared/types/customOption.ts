export type CustomOption<T extends string | number | symbol, TItem = unknown> = {
  label: string;
  value: T;
  getValue?: (item: TItem) => string | number | undefined;
};
