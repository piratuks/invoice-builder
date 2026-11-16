import type { EditionServerContribution } from './contract';

const communityEditionContribution: EditionServerContribution = {
  registerRoutes: router => {
    void router;
  },
  onStarted: async () => {},
  onStopping: async () => {}
};

export const registerEditionRoutes = communityEditionContribution.registerRoutes;
export const onEditionServerStarted = communityEditionContribution.onStarted;
export const onEditionServerStopping = communityEditionContribution.onStopping;
