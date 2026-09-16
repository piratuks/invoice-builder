import Editor, { loader } from '@monaco-editor/react';
import { Button, FormControlLabel, Grid, Stack, Switch, Tab, Tabs, Typography, useTheme } from '@mui/material';
import * as monaco from 'monaco-editor';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InvoiceFormMode } from '../../shared/enums/invoiceFormMode';
import { useForm } from '../../shared/hooks/form/useForm';
import { useFormDirtyCheck } from '../../shared/hooks/form/useFormDirtyCheck';
import {
  parseLayoutSchema,
  type Layout,
  type LayoutAdd,
  type LayoutFormData,
  type LayoutSchemaAny
} from '../../shared/types/layouts';
import '../../shared/utils/monacoEnvironment';
import { LayoutBuilder } from './LayoutBuilder';
import { LayoutBuilderPreview } from './LayoutBuilderPreview';

loader.config({ monaco });

const createEmptyLayoutSchema = (): LayoutSchemaAny => ({
  schemaVersion: 1,
  meta: { name: 'New layout' },
  sections: []
});

const formatSchema = (schema?: Layout['schema']) => JSON.stringify(schema ?? createEmptyLayoutSchema(), null, 2);

export const Form = ({
  item,
  handleChange,
  mode = InvoiceFormMode.edit
}: {
  item?: Layout;
  handleChange: (value: { layout: LayoutAdd; isFormValid: boolean; description: string }) => void;
  mode?: InvoiceFormMode;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const handleChangeRef = useRef(handleChange);
  const translateRef = useRef(t);
  const initialFormRef = useRef<LayoutFormData | undefined>(undefined);
  const schemaInputRef = useRef<HTMLInputElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<'visual' | 'json'>('visual');
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [builderValid, setBuilderValid] = useState(true);
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor>();
  const { form, setForm, update } = useForm<LayoutFormData>({
    id: item?.id,
    schema: formatSchema(item?.schema),
    isArchived: item?.isArchived ?? false
  });
  const schemaResult = parseLayoutSchema(form.schema);
  const hasSchemaInput = form.schema.trim() !== '';

  useEffect(() => {
    handleChangeRef.current = handleChange;
    translateRef.current = t;
  }, [handleChange, t]);

  useFormDirtyCheck(form, initialFormRef);

  useEffect(() => {
    const initial = {
      id: item?.id,
      schema: formatSchema(item?.schema),
      isArchived: item?.isArchived ?? false
    };
    initialFormRef.current = initial;
    setUploadErrors([]);
    setForm(initial);
  }, [item, setForm]);

  useEffect(() => {
    const result = parseLayoutSchema(form.schema);
    const valid = form.schema.trim() !== '' && result.errors.length === 0;
    handleChangeRef.current({
      layout: {
        ...(item?.id !== undefined ? { id: item.id } : {}),
        isArchived: form.isArchived,
        schema: (result.schema as LayoutSchemaAny | undefined) ?? { schemaVersion: 1, meta: { name: '' } }
      },
      isFormValid: valid && builderValid,
      description:
        (hasSchemaInput
          ? result.errors
              .map(error => `${error.path}: ${translateRef.current(error.message, error.params)}`)
              .join(' | ')
          : '') || translateRef.current('common.invalidForm')
    });
  }, [builderValid, form, hasSchemaInput, item?.id]);

  useEffect(() => {
    if (!editor) return;
    const container = editorContainerRef.current;
    if (!container) return;
    const layoutEditor = () => editor.layout();
    const resizeObserver = new ResizeObserver(layoutEditor);
    resizeObserver.observe(container);
    window.addEventListener('resize', layoutEditor);
    const frame = requestAnimationFrame(layoutEditor);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', layoutEditor);
      cancelAnimationFrame(frame);
    };
  }, [editor]);

  if (mode === InvoiceFormMode.preview) {
    return schemaResult.schema ? <LayoutBuilderPreview schema={schemaResult.schema} /> : null;
  }

  return (
    <Grid container spacing={2}>
      <Grid ref={editorContainerRef} size={12}>
        <input
          ref={schemaInputRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async event => {
            const file = event.target.files?.[0];
            if (file) {
              const result = parseLayoutSchema(await file.text());
              if (result.errors.length) {
                setUploadErrors(result.errors.map(error => `${error.path}: ${t(error.message, error.params)}`));
              } else {
                setUploadErrors([]);
                update('schema', JSON.stringify(result.schema, null, 2));
              }
            }
            event.target.value = '';
          }}
        />
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Tabs value={tab} onChange={(_, nextTab) => setTab(nextTab)}>
            <Tab label={t('layouts.visualTab')} value="visual" />
            <Tab label={t('layouts.jsonTab')} value="json" />
          </Tabs>
          <Button variant="outlined" onClick={() => schemaInputRef.current?.click()}>
            {t('layouts.uploadSchema')}
          </Button>
        </Stack>
      </Grid>
      {uploadErrors.map(error => (
        <Grid size={12} key={error}>
          <Typography color="error" variant="caption">
            {error}
          </Typography>
        </Grid>
      ))}
      {tab === 'visual' ? (
        <Grid size={12}>
          <LayoutBuilder
            schema={form.schema}
            onSchemaChange={schema => update('schema', schema)}
            onValidityChange={setBuilderValid}
            t={t}
          />
        </Grid>
      ) : (
        <Grid size={12}>
          <Editor
            onMount={setEditor}
            height="600px"
            defaultLanguage="json"
            theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'vs'}
            value={form.schema}
            onChange={value => update('schema', value ?? '')}
            options={{
              automaticLayout: false,
              fontSize: 14,
              minimap: { enabled: false },
              readOnly: true,
              readOnlyMessage: { value: t('layouts.readOnlySchema') },
              scrollBeyondLastLine: false,
              tabSize: 2
            }}
          />
          {hasSchemaInput &&
            schemaResult.errors.map(error => (
              <Typography
                key={`${error.path}-${error.message}`}
                color="error"
                variant="caption"
                sx={{ display: 'block' }}
              >
                {error.path}: {t(error.message, error.params)}
              </Typography>
            ))}
        </Grid>
      )}
      <Grid size={12}>
        <FormControlLabel
          control={<Switch checked={form.isArchived} onChange={event => update('isArchived', event.target.checked)} />}
          label={t('common.archived')}
        />
      </Grid>
    </Grid>
  );
};
