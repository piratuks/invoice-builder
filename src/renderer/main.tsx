import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createBrowserRouter, createHashRouter, Navigate, RouterProvider } from 'react-router-dom';
import { App } from './app/App';
import './globalErrorHandlers';
import './i18n';
import { BanksPage } from './pages/banks';
import { BusinessesPage } from './pages/businesses';
import { CategoriesPage } from './pages/categories';
import { ClientsPage } from './pages/clients';
import { CurrenciesPage } from './pages/currencies';
import { InvoicesPage } from './pages/invoices';
import { ItemsPage } from './pages/items';
import { PresetsPage } from './pages/presets';
import { QuotesPage } from './pages/quotes';
import { ReportsPage } from './pages/reports';
import { SettingsPage } from './pages/settings';
import { StyleProfilesPage } from './pages/styleProfiles';
import { UnitsPage } from './pages/units';
import reportWebVitals from './reportWebVitals';
import { isWebMode } from './shared/api/restApi';
import { GlobalErrorBoundaryWrapper } from './shared/components/feedback/globalErrorBoundaryWrapper/GlobalErrorBoundaryWrapper';
import { ThemeProviderWrapper } from './shared/components/layout/theme/ThemeProviderWrapper';
import { InvoiceType } from './shared/enums/invoiceType';
import { store } from './state/configureStore';

const mockEnabled = import.meta.env.VITE_ENABLE_MOCKS;

const createRouter = () => {
  const routes = [
    {
      path: '/',
      element: (
        <ThemeProviderWrapper>
          <App />
        </ThemeProviderWrapper>
      ),
      children: [
        { index: true, element: <Navigate to="/invoices" replace /> },
        { path: 'settings', element: <SettingsPage /> },
        { path: 'businesses', element: <BusinessesPage /> },
        { path: 'clients', element: <ClientsPage /> },
        { path: 'currencies', element: <CurrenciesPage /> },
        { path: 'units', element: <UnitsPage /> },
        { path: 'categories', element: <CategoriesPage /> },
        { path: 'items', element: <ItemsPage /> },
        { path: 'styleProfiles', element: <StyleProfilesPage /> },
        { path: 'invoices', element: <InvoicesPage type={InvoiceType.invoice} /> },
        { path: 'quotes', element: <QuotesPage /> },
        { path: 'reports', element: <ReportsPage /> },
        { path: 'banks', element: <BanksPage /> },
        { path: 'presets', element: <PresetsPage /> },
        { path: '*', element: <Navigate to="/invoices" replace /> }
      ]
    }
  ];

  return isWebMode() ? createBrowserRouter(routes) : createHashRouter(routes);
};

const startApp = async () => {
  if (mockEnabled === 'true' || mockEnabled === true) {
    try {
      const { worker } = await import('./mocks/browser');
      await worker.start();
    } catch (err) {
      console.error('Failed to load mocks:', err);
    }
  }

  const router = createRouter();

  const root = createRoot(document.getElementById('root') as HTMLElement);
  root.render(
    <StrictMode>
      <Provider store={store}>
        <GlobalErrorBoundaryWrapper>
          <RouterProvider router={router} />
        </GlobalErrorBoundaryWrapper>
      </Provider>
    </StrictMode>
  );

  reportWebVitals();
};

startApp();
