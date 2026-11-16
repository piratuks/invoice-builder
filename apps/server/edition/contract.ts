import type { Router } from 'express';

export interface EditionServerLifecycle {
  onStarted: () => void | Promise<void>;
  onStopping: () => void | Promise<void>;
}

export interface EditionServerContribution extends EditionServerLifecycle {
  registerRoutes: (router: Router) => void;
}
