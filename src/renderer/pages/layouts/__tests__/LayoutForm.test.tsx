import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';
import i18n from '../../../i18n';
import { InvoiceFormMode } from '../../../shared/enums/invoiceFormMode';
import type { Layout } from '../../../shared/types/layouts';
import { store } from '../../../state/configureStore';
import { Form } from '../Form';

vi.mock('monaco-editor', () => ({ editor: {} }));

vi.mock('@monaco-editor/react', () => ({
  default: ({ value }: { value?: string }) => <textarea data-testid="json-editor" readOnly value={value ?? ''} />,
  loader: { config: vi.fn() }
}));

vi.mock('../LayoutBuilder', () => ({
  LayoutBuilder: ({
    schema,
    onSchemaChange,
    onValidityChange
  }: {
    schema: string;
    onSchemaChange: (value: string) => void;
    onValidityChange: (valid: boolean) => void;
  }) => (
    <div data-testid="layout-builder">
      <output data-testid="builder-schema">{schema}</output>
      <button
        type="button"
        onClick={() =>
          onSchemaChange(
            JSON.stringify({
              schemaVersion: 1,
              meta: { name: 'Changed visually' },
              sections: []
            })
          )
        }
      >
        change visually
      </button>
      <button type="button" onClick={() => onValidityChange(false)}>
        invalidate builder
      </button>
    </div>
  )
}));

vi.mock('../LayoutBuilderPreview', () => ({
  LayoutBuilderPreview: ({ schema }: { schema: { meta?: { name?: string } } }) => (
    <div data-testid="layout-preview">{schema.meta?.name}</div>
  )
}));

const renderForm = (handleChange = vi.fn()) =>
  render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <Form handleChange={handleChange} />
      </I18nextProvider>
    </Provider>
  );

describe('Layout Form S4 integration', () => {
  it('starts in Visual mode and switches to the read-only JSON view', () => {
    renderForm();

    expect(screen.getByTestId('layout-builder')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'JSON' }));

    expect(screen.getByTestId('json-editor')).toBeInTheDocument();
    expect(screen.queryByTestId('layout-builder')).not.toBeInTheDocument();
  });

  it('keeps Visual and JSON views bound to the same schema', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'change visually' }));
    fireEvent.click(screen.getByRole('tab', { name: 'JSON' }));

    expect((screen.getByTestId('json-editor') as HTMLTextAreaElement).value).toContain('Changed visually');

    fireEvent.click(screen.getByRole('tab', { name: 'Visual' }));
    expect(screen.getByTestId('builder-schema')).toHaveTextContent('Changed visually');
  });

  it('imports valid V1 and V2 JSON through Upload schema', async () => {
    const { container } = renderForm();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const v2 = JSON.stringify({
      schemaVersion: 2,
      meta: { name: 'Uploaded V2' },
      regions: [{ id: 'main', width: '100%', direction: 'column', children: [] }]
    });

    fireEvent.change(input, { target: { files: [new File([v2], 'layout.json', { type: 'application/json' })] } });
    await waitFor(() => expect(screen.getByTestId('builder-schema')).toHaveTextContent('Uploaded V2'));

    const v1 = JSON.stringify({ schemaVersion: 1, meta: { name: 'Uploaded V1' }, sections: [] });
    fireEvent.change(input, { target: { files: [new File([v1], 'layout.json', { type: 'application/json' })] } });
    await waitFor(() => expect(screen.getByTestId('builder-schema')).toHaveTextContent('Uploaded V1'));
  });

  it('shows validation errors for invalid uploaded JSON', async () => {
    const { container } = renderForm();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, {
      target: { files: [new File(['{"schemaVersion": 2}'], 'invalid.json', { type: 'application/json' })] }
    });

    await waitFor(() => expect(screen.getByText(/regions/i)).toBeInTheDocument());
    expect(screen.getByTestId('layout-builder')).toBeInTheDocument();
  });

  it('propagates schema and builder validity to the form callback', async () => {
    const handleChange = vi.fn();
    renderForm(handleChange);

    await waitFor(() => expect(handleChange).toHaveBeenCalled());
    expect(handleChange.mock.lastCall?.[0].isFormValid).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'invalidate builder' }));
    await waitFor(() => expect(handleChange.mock.lastCall?.[0].isFormValid).toBe(false));
  });

  it('renders only valid schemas in preview mode', () => {
    const item: Layout = {
      id: 4,
      isArchived: false,
      schema: { schemaVersion: 1, meta: { name: 'Preview layout' }, sections: [] },
      invoiceCount: 0,
      quotesCount: 0,
      createdAt: '',
      updatedAt: ''
    };
    const { rerender } = render(
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <Form item={item} handleChange={vi.fn()} mode={InvoiceFormMode.preview} />
        </I18nextProvider>
      </Provider>
    );

    expect(screen.getByTestId('layout-preview')).toHaveTextContent('Preview layout');
    rerender(
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <Form
            item={{ ...item, schema: { schemaVersion: 2 } } as unknown as Layout}
            handleChange={vi.fn()}
            mode={InvoiceFormMode.preview}
          />
        </I18nextProvider>
      </Provider>
    );
    expect(screen.queryByTestId('layout-preview')).not.toBeInTheDocument();
  });

  it('propagates archived changes and ignores an empty file selection', async () => {
    const handleChange = vi.fn();
    const { container } = renderForm(handleChange);
    const archived = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    const upload = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.click(archived);
    await waitFor(() => expect(handleChange.mock.lastCall?.[0].layout.isArchived).toBe(true));

    fireEvent.change(upload, { target: { files: [] } });
    expect(upload.value).toBe('');
  });
});
