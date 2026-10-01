export type EntityWithId = { id?: number };

/** Write payload for a table row; missing/null fields are persisted as NULL. */
export type EntityInput<T> = { [K in keyof T]?: T[K] | null } & EntityWithId;
