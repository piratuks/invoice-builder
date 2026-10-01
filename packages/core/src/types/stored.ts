/** DB row shape of `T`: JSON columns `K` may still be serialized strings. */
export type Stored<T, K extends keyof T> = Omit<T, K> & { [P in K]: T[P] | string };
