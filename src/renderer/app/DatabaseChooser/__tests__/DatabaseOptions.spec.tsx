import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';
import type { PostgresConfig } from '../../../shared/types/postgresConfig';
import { LocalDatabase } from '../LocalDatabase';
import { ServerDatabase } from '../ServerDatabase';

type DoneOptions<T> = { onDone: (result: T) => void };

const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  isWebMode: false,
  initExecute: vi.fn(),
  listExecute: vi.fn(),
  selectExecute: vi.fn(),
  openExecute: vi.fn(),
  initOptions: undefined as DoneOptions<{ success: boolean; message?: string; key?: string }> | undefined,
  listOptions: undefined as DoneOptions<{ data?: string[] }> | undefined,
  selectOptions: undefined as DoneOptions<{ data?: { canceled?: boolean; filePath?: string } }> | undefined,
  openOptions: undefined as DoneOptions<{ data?: { canceled?: boolean; filePath?: string } }> | undefined
}));

vi.mock('../../../state/configureStore', () => ({ useAppDispatch: () => mocks.dispatch }));
vi.mock('../../../shared/api/restApi', () => ({ isWebMode: () => mocks.isWebMode }));
vi.mock('../../../shared/hooks/dbSelector/useDBInit', () => ({
  useDBInit: (options: typeof mocks.initOptions) => {
    mocks.initOptions = options;
    return { execute: mocks.initExecute };
  }
}));
vi.mock('../../../shared/hooks/dbSelector/useDBListSelector', () => ({
  useDBListSelector: (options: typeof mocks.listOptions) => {
    mocks.listOptions = options;
    return { execute: mocks.listExecute };
  }
}));
vi.mock('../../../shared/hooks/dbSelector/useDBSelector', () => ({
  useDBSelector: (options: typeof mocks.selectOptions) => {
    mocks.selectOptions = options;
    return { execute: mocks.selectExecute };
  }
}));
vi.mock('../../../shared/hooks/dbSelector/useDBOpener', () => ({
  useDBOpener: (options: typeof mocks.openOptions) => {
    mocks.openOptions = options;
    return { execute: mocks.openExecute };
  }
}));

vi.mock('../modals/NameSetter', () => ({
  NameSetter: ({ onCancel, onSave }: { onCancel: () => void; onSave: (name: string) => void }) => (
    <div data-testid="name-setter">
      <button onClick={onCancel}>Cancel name</button>
      <button onClick={() => onSave('created')}>Save name</button>
    </div>
  )
}));
vi.mock('../modals/ConnectionSetter', () => ({
  ConnectionSetter: ({ onCancel, onSave }: { onCancel: () => void; onSave: (value: PostgresConfig) => void }) => (
    <div data-testid="connection-setter">
      <button onClick={onCancel}>Cancel connection</button>
      <button
        onClick={() =>
          onSave({ host: 'server', port: 5432, user: 'user', password: 'secret', database: 'new-db', ssl: true })
        }
      >
        Save connection
      </button>
    </div>
  )
}));
vi.mock('../modals/PasswordSetter', () => ({
  PasswordSetter: ({ onCancel, onSave }: { onCancel: () => void; onSave: (value: string) => void }) => (
    <div data-testid="password-setter">
      <button onClick={onCancel}>Cancel password</button>
      <button onClick={() => onSave('secret')}>Save password</button>
    </div>
  )
}));

const renderOption = (component: React.ReactElement) =>
  render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);

const postgresConfig = (overrides: Partial<PostgresConfig> = {}): PostgresConfig => ({
  host: 'localhost',
  port: 5432,
  user: 'invoice-user',
  password: '',
  database: 'invoice-db',
  ssl: false,
  ...overrides
});

describe('database chooser options', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.isWebMode = false;
    mocks.initOptions = undefined;
    mocks.listOptions = undefined;
    mocks.selectOptions = undefined;
    mocks.openOptions = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('LocalDatabase', () => {
    it('opens, initializes, and forgets saved desktop databases', async () => {
      const user = userEvent.setup();
      const onDatabaseRead = vi.fn();
      localStorage.setItem('databases', JSON.stringify(['C:\\data\\zeta.db', '/data/alpha.db']));
      renderOption(<LocalDatabase onDatabaseRead={onDatabaseRead} />);

      const alpha = await screen.findByText('alpha.db');
      await user.click(alpha);
      await waitFor(() => expect(mocks.initExecute).toHaveBeenCalledTimes(1));
      act(() => mocks.initOptions!.onDone({ success: true }));
      expect(onDatabaseRead).toHaveBeenCalledTimes(1);

      await user.click(screen.getAllByLabelText(i18n.t('ariaLabel.remove'))[0]);
      expect(screen.queryByText('alpha.db')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: i18n.t('databaseChooser.createNew') }));
      expect(mocks.selectExecute).toHaveBeenCalledTimes(1);
      act(() => mocks.selectOptions!.onDone({ data: { canceled: true } }));
      act(() => mocks.selectOptions!.onDone({ data: { filePath: 'C:\\data\\new.db' } }));
      await waitFor(() => expect(mocks.initExecute).toHaveBeenCalledTimes(2));

      const openExisting = screen.getByRole('button', { name: i18n.t('databaseChooser.openExisting') });
      act(() => mocks.initOptions!.onDone({ success: true }));
      await waitFor(() => expect(openExisting).toBeEnabled());
      await user.click(openExisting);
      expect(mocks.openExecute).toHaveBeenCalledTimes(1);
      act(() => mocks.openOptions!.onDone({ data: { canceled: true } }));
      expect(mocks.initExecute).toHaveBeenCalledTimes(2);
      act(() => mocks.openOptions!.onDone({ data: { filePath: '/data/opened.db' } }));
      await waitFor(() => expect(mocks.initExecute).toHaveBeenCalledTimes(3));
    });

    it('loads web databases, creates a named database, and reports initialization errors', async () => {
      const user = userEvent.setup();
      mocks.isWebMode = true;
      renderOption(<LocalDatabase />);

      expect(mocks.listExecute).toHaveBeenCalledTimes(1);
      act(() => mocks.listOptions!.onDone({}));
      act(() => mocks.listOptions!.onDone({ data: ['remote.db'] }));
      expect((await screen.findAllByText('remote.db')).length).toBeGreaterThan(0);

      await user.click(screen.getByRole('button', { name: i18n.t('databaseChooser.createNew') }));
      expect(screen.getByTestId('name-setter')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Cancel name' }));
      expect(screen.queryByTestId('name-setter')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: i18n.t('databaseChooser.createNew') }));
      await user.click(screen.getByRole('button', { name: 'Save name' }));
      await waitFor(() => expect(mocks.initExecute).toHaveBeenCalledTimes(1));

      act(() => mocks.initOptions!.onDone({ success: false, message: 'Cannot initialize' }));
      expect(mocks.dispatch).toHaveBeenLastCalledWith(
        expect.objectContaining({ payload: { message: 'Cannot initialize', severity: 'error' } })
      );
      act(() => mocks.initOptions!.onDone({ success: false, key: 'error.failedToLoad' }));
      expect(mocks.dispatch).toHaveBeenCalledTimes(2);

      act(() => mocks.initOptions!.onDone({ success: false, message: 'error.failedToLoad' }));
      expect(mocks.dispatch).toHaveBeenLastCalledWith(
        expect.objectContaining({ payload: { message: i18n.t('error.failedToLoad'), severity: 'error' } })
      );
      act(() => mocks.initOptions!.onDone({ success: false }));
      act(() => mocks.initOptions!.onDone({ success: true }));
    });

    it('ignores incomplete selections and reports storage failures', async () => {
      const user = userEvent.setup();
      localStorage.setItem('databases', JSON.stringify(['/data/kept.db']));
      localStorage.setItem('lastUsedLanguage', 'en');
      const changeLanguage = vi.spyOn(i18n, 'changeLanguage');
      const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('storage full');
      });
      renderOption(<LocalDatabase />);
      expect(changeLanguage).toHaveBeenCalledWith('en');

      await user.click(screen.getByRole('button', { name: i18n.t('databaseChooser.createNew') }));
      act(() => mocks.selectOptions!.onDone({ data: {} }));
      act(() => mocks.selectOptions!.onDone({}));
      expect(mocks.initExecute).not.toHaveBeenCalled();

      await user.click(screen.getByLabelText(i18n.t('ariaLabel.remove')));
      expect(mocks.dispatch).toHaveBeenLastCalledWith(
        expect.objectContaining({ payload: { message: i18n.t('error.failedToSave'), severity: 'error' } })
      );
      setItem.mockRestore();

      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('storage unavailable');
      });
      renderOption(<LocalDatabase />);
      expect(mocks.dispatch).toHaveBeenLastCalledWith(
        expect.objectContaining({ payload: { message: i18n.t('error.failedToLoad'), severity: 'error' } })
      );
    });
  });

  describe('ServerDatabase', () => {
    it('prompts for a saved connection password, initializes it, and can forget it', async () => {
      const user = userEvent.setup();
      const onDatabaseRead = vi.fn();
      localStorage.setItem('connetionData', JSON.stringify([postgresConfig()]));
      renderOption(<ServerDatabase onDatabaseRead={onDatabaseRead} />);

      await user.click(await screen.findByText('invoice-db'));
      expect(screen.getByTestId('password-setter')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Save password' }));
      await waitFor(() => expect(mocks.initExecute).toHaveBeenCalledTimes(1));
      act(() => mocks.initOptions!.onDone({ success: true }));
      expect(onDatabaseRead).toHaveBeenCalledTimes(1);

      const savedCard = screen.getByText('invoice-db').closest('.MuiPaper-root') as HTMLElement;
      await user.click(within(savedCard).getByLabelText(i18n.t('ariaLabel.remove')));
      expect(screen.queryByText('invoice-db')).not.toBeInTheDocument();
    });

    it('cancels a saved password prompt and renders encoded SSL connection details', async () => {
      const user = userEvent.setup();
      localStorage.setItem(
        'connetionData',
        JSON.stringify([postgresConfig({ user: 'invoice user', database: 'secure-db', ssl: true })])
      );
      renderOption(<ServerDatabase />);

      expect(
        await screen.findByText('postgresql://invoice%20user@localhost:5432/secure-db?sslmode=require')
      ).toBeInTheDocument();
      await user.click(screen.getByText('secure-db'));
      await user.click(screen.getByRole('button', { name: 'Cancel password' }));
      expect(screen.queryByTestId('password-setter')).not.toBeInTheDocument();
      expect(mocks.initExecute).not.toHaveBeenCalled();
    });

    it('creates connections and reports initialization failures', async () => {
      const user = userEvent.setup();
      renderOption(<ServerDatabase />);

      await user.click(screen.getByRole('button', { name: i18n.t('databaseChooser.connect') }));
      expect(screen.getByTestId('connection-setter')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Cancel connection' }));
      expect(screen.queryByTestId('connection-setter')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: i18n.t('databaseChooser.connect') }));
      await user.click(screen.getByRole('button', { name: 'Save connection' }));
      await waitFor(() => expect(mocks.initExecute).toHaveBeenCalledTimes(1));

      act(() => mocks.initOptions!.onDone({ success: false, message: 'Connection refused' }));
      expect(mocks.dispatch).toHaveBeenLastCalledWith(
        expect.objectContaining({ payload: { message: 'Connection refused', severity: 'error' } })
      );
      act(() => mocks.initOptions!.onDone({ success: false, key: 'error.failedToLoad' }));
      expect(mocks.dispatch).toHaveBeenCalledTimes(2);

      act(() => mocks.initOptions!.onDone({ success: false, message: 'error.failedToLoad' }));
      expect(mocks.dispatch).toHaveBeenLastCalledWith(
        expect.objectContaining({ payload: { message: i18n.t('error.failedToLoad'), severity: 'error' } })
      );
      act(() => mocks.initOptions!.onDone({ success: false }));
      act(() => mocks.initOptions!.onDone({ success: true }));
    });

    it('reports storage read and write failures', async () => {
      const user = userEvent.setup();
      localStorage.setItem('connetionData', JSON.stringify([postgresConfig()]));
      localStorage.setItem('lastUsedLanguage', 'en');
      const changeLanguage = vi.spyOn(i18n, 'changeLanguage');
      const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('storage full');
      });
      renderOption(<ServerDatabase />);
      expect(changeLanguage).toHaveBeenCalledWith('en');

      const savedCard = (await screen.findByText('invoice-db')).closest('.MuiPaper-root') as HTMLElement;
      await user.click(within(savedCard).getByLabelText(i18n.t('ariaLabel.remove')));
      expect(mocks.dispatch).toHaveBeenLastCalledWith(
        expect.objectContaining({ payload: { message: i18n.t('error.failedToSave'), severity: 'error' } })
      );
      setItem.mockRestore();

      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('storage unavailable');
      });
      renderOption(<ServerDatabase />);
      expect(mocks.dispatch).toHaveBeenLastCalledWith(
        expect.objectContaining({ payload: { message: i18n.t('error.failedToLoad'), severity: 'error' } })
      );
    });
  });
});
