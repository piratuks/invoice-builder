import { DatabaseType } from '../../enums/databaseType';
import { DBInitType } from '../../enums/dbInitType';
import { EInvoice } from '../../enums/einvoice';
import { InvoiceType } from '../../enums/invoiceType';
import { webApi } from '../platformApi';

const jsonResponse = (body: unknown, ok = true) =>
  ({
    ok,
    json: () => Promise.resolve(body),
    arrayBuffer: () => Promise.resolve(new Uint8Array([1, 2, 3]).buffer)
  }) as Response;

describe('webApi', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, data: {} }));
    vi.stubGlobal('fetch', fetchMock);
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('logs a pong for ping', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    webApi().ping();
    expect(spy).toHaveBeenCalledWith('pong');
  });

  it('fetches the app version', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ version: '1.2.3' }));
    await expect(webApi().getAppVersion()).resolves.toBe('1.2.3');
  });

  it('no-ops for update related methods on web', async () => {
    const api = webApi();
    await expect(api.checkForUpdates()).resolves.toBeUndefined();
    expect(api.restartApp()).toBeUndefined();

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(typeof api.onUpdateProgress(() => {})).toBe('function');
    expect(typeof api.onUpdateAvailable(() => {})).toBe('function');
    expect(typeof api.onUpdateNotAvailable(() => {})).toBe('function');
    expect(typeof api.onUpdateDownloaded(() => {})).toBe('function');
    api.onUpdateProgress(() => {})();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('opens a URL in a new tab', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    await webApi().openUrl('https://example.com');
    expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank');
  });

  it('handles database selection/initialization/testing endpoints', async () => {
    const api = webApi();
    await expect(api.selectDatabase()).resolves.toMatchObject({ success: true });
    await expect(api.openDatabase()).resolves.toMatchObject({ success: true });
    await api.initializeDatabase({ dbType: DatabaseType.sqlite, fullPath: '/tmp/db', mode: DBInitType.create });
    await api.getDatabaseList();
    await api.testConnection({ host: 'localhost', port: 5432, user: 'u', password: 'p', database: 'db', ssl: false });
    expect(fetchMock).toHaveBeenCalled();
  });

  it('gets and updates settings', async () => {
    const api = webApi();
    await api.getAllSettings();
    await api.updateSettings({ language: 'en' } as never);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/settings'));
  });

  describe('businesses (with logo mapping)', () => {
    it('round trips a base64 logo through get/add/update', async () => {
      const base64 = Buffer.from('logo').toString('base64');
      fetchMock.mockResolvedValue(jsonResponse({ success: true, data: [{ id: 1, name: 'Biz', logo: base64 }] }));
      const api = webApi();

      const listResult = await api.getAllBusinesses();
      expect(listResult.data?.[0].logo).toBeInstanceOf(Uint8Array);

      fetchMock.mockResolvedValue(jsonResponse({ success: true, data: { id: 1, name: 'Biz', logo: base64 } }));
      const addResult = await api.addBusiness({ name: 'Biz', shortName: 'B', logo: new Uint8Array([1]) } as never);
      expect(addResult.data?.logo).toBeInstanceOf(Uint8Array);

      const updateResult = await api.updateBusiness({ id: 1, name: 'Biz2', logo: new Uint8Array([2]) } as never);
      expect(updateResult.data?.logo).toBeInstanceOf(Uint8Array);

      await api.deleteBusiness(1);
      await api.addBatchBusiness([{ name: 'Biz3', shortName: 'B3' } as never]);
      expect(fetchMock).toHaveBeenCalled();
    });
  });

  describe('banks (with qrCode mapping)', () => {
    it('round trips a base64 qrCode through get/add/update', async () => {
      const base64 = Buffer.from('qr').toString('base64');
      fetchMock.mockResolvedValue(jsonResponse({ success: true, data: [{ id: 1, name: 'Bank', qrCode: base64 }] }));
      const api = webApi();

      const listResult = await api.getAllBanks();
      expect(listResult.data?.[0].qrCode).toBeInstanceOf(Uint8Array);

      fetchMock.mockResolvedValue(jsonResponse({ success: true, data: { id: 1, name: 'Bank', qrCode: base64 } }));
      await api.addBank({ name: 'Bank', qrCode: new Uint8Array([1]) } as never);
      await api.updateBank({ id: 1, name: 'Bank2', qrCode: new Uint8Array([2]) } as never);
      await api.deleteBank(1);
      await api.addBatchBank([{ name: 'Bank3' } as never]);
      expect(fetchMock).toHaveBeenCalled();
    });
  });

  describe('style profiles (with watermark mapping)', () => {
    it('round trips watermark buffers through get/add/update', async () => {
      const base64 = Buffer.from('wm').toString('base64');
      fetchMock.mockResolvedValue(
        jsonResponse({ success: true, data: [{ id: 1, name: 'Profile', watermarkFileData: base64 }] })
      );
      const api = webApi();

      const listResult = await api.getAllStyleProfiles();
      expect(listResult.data?.[0].watermarkFileData).toBeInstanceOf(Uint8Array);

      fetchMock.mockResolvedValue(
        jsonResponse({ success: true, data: { id: 1, name: 'Profile', watermarkFileData: base64 } })
      );
      await api.addStyleProfile({ name: 'Profile', watermarkFileData: new Uint8Array([1]) } as never);
      await api.updateStyleProfile({ id: 1, name: 'Profile2', watermarkFileData: new Uint8Array([2]) } as never);
      await api.deleteStyleProfile(1);
      await api.addBatchStyleProfile([{ name: 'Profile3' } as never]);
      expect(fetchMock).toHaveBeenCalled();
    });
  });

  describe('presets (with signature mapping)', () => {
    it('round trips signature buffers through get/add/update', async () => {
      const base64 = Buffer.from('sig').toString('base64');
      fetchMock.mockResolvedValue(
        jsonResponse({ success: true, data: [{ id: 1, name: 'Preset', signatureData: base64 }] })
      );
      const api = webApi();

      const listResult = await api.getAllPresets();
      expect(listResult.data?.[0].signatureData).toBeInstanceOf(Uint8Array);

      fetchMock.mockResolvedValue(
        jsonResponse({ success: true, data: { id: 1, name: 'Preset', signatureData: base64 } })
      );
      await api.addPreset({ name: 'Preset', signatureData: new Uint8Array([1]) } as never);
      await api.updatePreset({ id: 1, name: 'Preset2', signatureData: new Uint8Array([2]) } as never);
      await api.deletePreset(1);
      await api.addBatchPreset([{ name: 'Preset3' } as never]);
      expect(fetchMock).toHaveBeenCalled();
    });
  });

  describe('invoices (with nested snapshot + attachment mapping)', () => {
    const invoiceWeb = {
      id: 1,
      signatureData: Buffer.from('sig').toString('base64'),
      invoiceBusinessSnapshot: { businessName: 'Biz', businessLogo: Buffer.from('logo').toString('base64') },
      invoiceBankSnapshot: { qrCode: Buffer.from('qr').toString('base64') },
      invoiceCustomization: {
        watermarkFileData: Buffer.from('w').toString('base64'),
        paidWatermarkFileData: Buffer.from('p').toString('base64')
      },
      invoiceAttachments: [{ data: Buffer.from('a').toString('base64') }]
    };

    it('maps nested snapshot buffers when listing, adding, updating and duplicating', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ success: true, data: [invoiceWeb] }));
      const api = webApi();

      const listResult = await api.getAllInvoices(InvoiceType.invoice);
      expect(listResult.data?.[0].signatureData).toBeInstanceOf(Uint8Array);
      expect(listResult.data?.[0].invoiceBusinessSnapshot?.businessLogo).toBeInstanceOf(Uint8Array);
      expect(listResult.data?.[0].invoiceBankSnapshot?.qrCode).toBeInstanceOf(Uint8Array);
      expect(listResult.data?.[0].invoiceCustomization?.watermarkFileData).toBeInstanceOf(Uint8Array);
      expect(listResult.data?.[0].invoiceAttachments?.[0].data).toBeInstanceOf(Uint8Array);

      fetchMock.mockResolvedValue(jsonResponse({ success: true, data: invoiceWeb }));
      await api.addInvoice({
        invoiceType: InvoiceType.invoice,
        signatureData: new Uint8Array([1]),
        invoiceBusinessSnapshot: { businessLogo: new Uint8Array([1]) },
        invoiceBankSnapshot: { qrCode: new Uint8Array([1]) },
        invoiceCustomization: { watermarkFileData: new Uint8Array([1]), paidWatermarkFileData: new Uint8Array([1]) },
        invoiceAttachments: [{ data: new Uint8Array([1]) }]
      } as never);

      await api.updateInvoice({
        id: 1,
        invoiceType: InvoiceType.invoice
      } as never);

      await api.duplicateInvoice(1, InvoiceType.invoice);
      await api.deleteInvoice(1);
    });

    it('gets next sequence, e-invoice xml blob and custom headers', async () => {
      const api = webApi();
      await api.getNextSequence({ businessId: 1, clientId: 2, invoiceType: InvoiceType.invoice });

      fetchMock.mockResolvedValueOnce(jsonResponse({}, true));
      const xmlResult = await api.getEInvoiceXML({ invoiceId: 1, einvoice: EInvoice.ubl21 });
      expect(xmlResult.success).toBe(true);
      expect(xmlResult.data).toBeInstanceOf(Uint8Array);

      fetchMock.mockResolvedValueOnce(jsonResponse({}, false));
      const failedXml = await api.getEInvoiceXML({ invoiceId: 1, einvoice: EInvoice.xrechnung });
      expect(failedXml.success).toBe(false);

      await api.getCustomHeaders(InvoiceType.invoice);
    });
  });

  describe('simple CRUD entities without file mapping', () => {
    it('covers clients, items, units, categories, currencies, layouts', async () => {
      const api = webApi();

      await api.getAllClients();
      await api.addClient({ name: 'Client', shortName: 'C' } as never);
      await api.updateClient({ id: 1, name: 'Client2', shortName: 'C' } as never);
      await api.deleteClient(1);
      await api.addBatchClient([{ name: 'Client3', shortName: 'C3' } as never]);

      await api.getAllItems();
      await api.addItem({ name: 'Item' } as never);
      await api.updateItem({ id: 1, name: 'Item2' } as never);
      await api.deleteItem(1);
      await api.addBatchItem([{ name: 'Item3' } as never]);

      await api.getAllUnits();
      await api.addUnit({ name: 'Unit' } as never);
      await api.updateUnit({ id: 1, name: 'Unit2' } as never);
      await api.deleteUnit(1);
      await api.addBatchUnit([{ name: 'Unit3' } as never]);

      await api.getAllCategories();
      await api.addCategory({ name: 'Cat' } as never);
      await api.updateCategory({ id: 1, name: 'Cat2' } as never);
      await api.deleteCategory(1);
      await api.addBatchCategory([{ name: 'Cat3' } as never]);

      await api.getAllCurrencies();
      await api.addCurrency({ code: 'USD' } as never);
      await api.updateCurrency({ id: 1, code: 'USD' } as never);
      await api.deleteCurrency(1);
      await api.addBatchCurrency([{ code: 'EUR' } as never]);

      await api.getAllLayouts();
      await api.addLayout({ schema: {} } as never);
      await api.updateLayout({ id: 1, schema: {} } as never);
      await api.deleteLayout(1);

      expect(fetchMock).toHaveBeenCalled();
    });

    it('filters by FilterData when provided', async () => {
      const api = webApi();
      await api.getAllClients([{ type: 'Active' } as never]);
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('filter='));
    });
  });

  describe('exportLayout/exportAllData', () => {
    it('downloads a layout schema as JSON and returns the file path', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ success: true, data: { schema: { meta: { name: 'My Layout' } } } }));
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      const result = await webApi().exportLayout(1);
      expect(result.success).toBe(true);
      expect(result.data?.filePath).toContain('My_Layout');
      clickSpy.mockRestore();
    });

    it('returns the failure response unchanged when export fails', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ success: false }));
      const result = await webApi().exportLayout(1);
      expect(result.success).toBe(false);
    });

    it('downloads a full backup as JSON', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ success: true, data: { businesses: [] } }));
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      const result = await webApi().exportAllData();
      expect(result.success).toBe(true);
      expect(result.data?.filePath).toContain('invoice-builder-backup-');
      clickSpy.mockRestore();
    });

    it('returns the failure response unchanged when the backup export fails', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ success: false }));
      const result = await webApi().exportAllData();
      expect(result.success).toBe(false);
    });
  });

  describe('importAllData', () => {
    it('resolves with failure when no file is chosen', async () => {
      const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (
        this: HTMLInputElement
      ) {
        this.onchange?.(new Event('change'));
      });

      const result = await webApi().importAllData();
      expect(result.success).toBe(false);
      clickSpy.mockRestore();
    });

    it('imports a valid JSON file', async () => {
      const file = new File([JSON.stringify({ businesses: [] })], 'backup.json', { type: 'application/json' });
      const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (
        this: HTMLInputElement
      ) {
        Object.defineProperty(this, 'files', { value: [file], configurable: true });
        this.onchange?.(new Event('change'));
      });
      fetchMock.mockResolvedValue(jsonResponse({ success: true }));

      const result = await webApi().importAllData();
      expect(result.success).toBe(true);
      clickSpy.mockRestore();
    });

    it('resolves with an invalidFile error for malformed JSON', async () => {
      const file = new File(['not-json'], 'backup.json', { type: 'application/json' });
      const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (
        this: HTMLInputElement
      ) {
        Object.defineProperty(this, 'files', { value: [file], configurable: true });
        this.onchange?.(new Event('change'));
      });

      const result = await webApi().importAllData();
      expect(result.success).toBe(false);
      expect((result as { key?: string }).key).toBe('error.invalidFile');
      clickSpy.mockRestore();
    });
  });
});
