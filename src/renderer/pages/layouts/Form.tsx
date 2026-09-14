import Editor, { loader } from '@monaco-editor/react';
import { Button, FormControlLabel, Grid, Switch, Typography, useTheme } from '@mui/material';
import * as monaco from 'monaco-editor';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

loader.config({ monaco });

const formatSchema = (schema?: Layout['schema']) => (schema ? JSON.stringify(schema, null, 2) : '');

export const Form = ({
  item,
  handleChange
}: {
  item?: Layout;
  handleChange: (value: { layout: LayoutAdd; isFormValid: boolean; description: string }) => void;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const handleChangeRef = useRef(handleChange);
  const translateRef = useRef(t);
  const initialFormRef = useRef<LayoutFormData | undefined>(undefined);
  const schemaInputRef = useRef<HTMLInputElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const { form, setForm, update } = useForm<LayoutFormData>({
    id: item?.id,
    schema: formatSchema(item?.schema),
    isArchived: item?.isArchived ?? false
  });
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor>();
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
      isFormValid: valid,
      description:
        (hasSchemaInput
          ? result.errors
              .map(error => `${error.path}: ${translateRef.current(error.message, error.params)}`)
              .join(' | ')
          : '') || translateRef.current('common.invalidForm')
    });
  }, [form, hasSchemaInput, item?.id]);

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
              const text = await file.text();
              const result = parseLayoutSchema(text);
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
        <Button variant="outlined" onClick={() => schemaInputRef.current?.click()}>
          {t('layouts.uploadSchema')}
        </Button>
      </Grid>
      {uploadErrors.length > 0 && (
        <Grid size={12}>
          {uploadErrors.map(error => (
            <Typography key={error} color="error" variant="caption" sx={{ display: 'block' }}>
              {error}
            </Typography>
          ))}
        </Grid>
      )}
      <Grid size={12}>
        <Editor
          onMount={setEditor}
          height="600px"
          defaultLanguage="json"
          theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'vs'}
          value={form.schema}
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
      <Grid size={{ xs: 12, md: 12 }}>
        <FormControlLabel
          control={<Switch checked={form.isArchived} onChange={e => update('isArchived', e.target.checked)} />}
          label={t('common.archived')}
        />
      </Grid>
    </Grid>
  );
};
