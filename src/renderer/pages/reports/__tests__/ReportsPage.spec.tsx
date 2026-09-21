import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../i18n';
import { getApi } from '../../../shared/api/restApi';
import { store } from '../../../state/configureStore';
import { ReportsPage } from '../index';

vi.mock('../../../shared/api/restApi', () => ({ getApi: vi.fn(), isWebMode: () => true }));

describe('ReportsPage', () => {
  const mockApi = { getAllInvoices: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getAllInvoices.mockResolvedValue({ success: true, data: [] });
    vi.mocked(getApi).mockReturnValue(mockApi as never);
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </Provider>
  );

  it('retrieves invoices and shows the empty overview state', async () => {
    render(<ReportsPage />, { wrapper });

    await waitFor(() => expect(mockApi.getAllInvoices).toHaveBeenCalled());
    expect(await screen.findByText(i18n.t('reports.title'))).toBeInTheDocument();
    expect(await screen.findByText(i18n.t('reports.noItems'))).toBeInTheDocument();
  });
});
