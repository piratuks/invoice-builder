const configuredApiUrl = import.meta.env.VITE_API_URL as string | undefined;
const configuredMocks = import.meta.env.VITE_ENABLE_MOCKS as string | boolean | undefined;

export const frontendConfig = {
  mocksEnabled: configuredMocks === 'true' || configuredMocks === true,
  getApiOrigin: () => configuredApiUrl || (typeof window === 'undefined' ? '' : window.location.origin)
};
