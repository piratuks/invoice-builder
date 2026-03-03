import { Divider, FormControlLabel, Grid, Switch, TextField } from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { Language } from '../../shared/enums/language';
import { useForm } from '../../shared/hooks/useForm';
import { useFormDirtyCheck } from '../../shared/hooks/useFormDirtyCheck';
import type { Bank } from '../../shared/types/bank';
import type { Business } from '../../shared/types/business';
import type { Client } from '../../shared/types/client';
import type { Currency } from '../../shared/types/currency';
import type { SignatureForm } from '../../shared/types/invoice';
import type { Preset, PresetFromData } from '../../shared/types/preset';
import type { StyleProfile } from '../../shared/types/styleProfiles';
import { validators } from '../../shared/utils/validatorFunctions';
import { useAppSelector } from '../../state/configureStore';
import { selectSettings } from '../../state/pageSlice';
import { BankSelector } from '../invoices/Form/BankSelector';
import { BusinessSelector } from '../invoices/Form/BusinessSelector';
import { ClientSelector } from '../invoices/Form/ClientSelector';
import { CurrencySelector } from '../invoices/Form/CurrencySelector';
import { BanksDropdown } from '../invoices/Form/Dropdowns/BanksDropdown';
import { BusinessesDropdown } from '../invoices/Form/Dropdowns/BusinessesDropdown';
import { ClientsDropdown } from '../invoices/Form/Dropdowns/ClientsDropdown';
import { CurrenciesDropdown } from '../invoices/Form/Dropdowns/CurrenciesDropdown';
import { LanguageDropdown } from '../invoices/Form/Dropdowns/LanguageDropdown';
import { StyleProfilesDropdown } from '../invoices/Form/Dropdowns/StyleProfilesDropdown';
import { LanguageSelector } from '../invoices/Form/LanguageSelector';
import { NotesSelector } from '../invoices/Form/NotesSelector';
import { SignatureSelector } from '../invoices/Form/SignatureSelector';
import { StyleProfileSelector } from '../invoices/Form/StyleProfileSelector';

interface Props {
  preset?: Preset;
  handleChange?: (data: { preset: PresetFromData; isFormValid: boolean; description?: string }) => void;
}
export const Form: FC<Props> = ({ handleChange = () => {}, preset }) => {
  const storeSettings = useAppSelector(selectSettings);
  const { t } = useTranslation();
  const initialFormRef = useRef<PresetFromData | undefined>(undefined);
  const { form, setForm, update } = useForm<PresetFromData>({
    id: preset?.id,
    name: preset?.name ?? '',
    businessId: preset?.businessId,
    businessName: preset?.businessName,
    clientId: preset?.clientId,
    clientName: preset?.clientName,
    currencyId: preset?.currencyId,
    currencyCode: preset?.currencyCode,
    currencySymbol: preset?.currencySymbol,
    bankId: preset?.bankId,
    bankName: preset?.bankName,
    styleProfilesId: preset?.styleProfilesId,
    styleProfileName: preset?.styleProfileName,
    customerNotes: preset?.customerNotes,
    thanksNotes: preset?.thanksNotes,
    termsConditionNotes: preset?.termsConditionNotes,
    language: preset?.language,
    signatureSize: preset?.signatureSize,
    signatureType: preset?.signatureType,
    signatureName: preset?.signatureName,
    signatureData: preset?.signatureData,
    isArchived: preset?.isArchived ?? false
  });

  const [errors, setErrors] = useState({
    name: false
  });

  const [isDropdownOpenBusinesses, setIsDropdownOpenBusinesses] = useState<boolean>(false);
  const [isDropdownOpenClients, setIsDropdownOpenClients] = useState<boolean>(false);
  const [isDropdownOpenCurrencies, setIsDropdownOpenCurrencies] = useState<boolean>(false);
  const [isDropdownOpenStyleProfile, setIsDropdownOpenStyleProfile] = useState<boolean>(false);
  const [isDropdownOpenBanks, setIsDropdownOpenBanks] = useState<boolean>(false);
  const [isDropdownOpenLanguages, setIsDropdownOpenLanguages] = useState<boolean>(false);

  const signatureFormData = useMemo(
    () => ({
      signatureData: form.signatureData ?? undefined,
      signatureName: form.signatureName,
      signatureSize: form.signatureSize,
      signatureType: form.signatureType
    }),
    [form.signatureData, form.signatureName, form.signatureSize, form.signatureType]
  );

  const currencyFormData = useMemo(
    () => ({
      currencyCode: form.currencyCode,
      currencySymbol: form.currencySymbol
    }),
    [form.currencyCode, form.currencySymbol]
  );

  const businessFormData = useMemo(
    () => ({
      businessName: form?.businessName
    }),
    [form.businessName]
  );

  const notesFormData = useMemo(
    () => ({
      customerNotes: form.customerNotes,
      thanksNotes: form.thanksNotes,
      termsConditionNotes: form.termsConditionNotes
    }),
    [form.termsConditionNotes, form.thanksNotes, form.customerNotes]
  );

  const validateField = (field: keyof typeof errors, value: string) => {
    if (!validators.required(value) && field === 'name') {
      setErrors(e => ({ ...e, [field]: true }));
    } else {
      setErrors(e => ({ ...e, [field]: false }));
    }
  };

  const handleOnOpen = useCallback((setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(true);
  }, []);

  const handleOnClose = useCallback((setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(false);
  }, []);

  const handleOnClickBusiness = useCallback(
    (data: Business) => {
      handleOnClose(setIsDropdownOpenBusinesses);
      setForm(prev => ({
        ...prev,
        businessId: data.id,
        businessName: data.name
      }));
    },
    [handleOnClose, setForm]
  );

  const handleOnClickClients = useCallback(
    (data: Client) => {
      handleOnClose(setIsDropdownOpenClients);
      setForm(prev => ({
        ...prev,
        clientId: data.id,
        clientName: data.name
      }));
    },
    [handleOnClose, setForm]
  );

  const handleOnClickCurrencies = useCallback(
    (data: Currency) => {
      handleOnClose(setIsDropdownOpenCurrencies);
      setForm(prev => ({
        ...prev,
        currencyId: data.id,
        currencyCode: data.code,
        currencySymbol: data.symbol
      }));
    },
    [handleOnClose, setForm]
  );

  const handleOnClickStyleProfile = useCallback(
    (data: StyleProfile) => {
      handleOnClose(setIsDropdownOpenStyleProfile);
      setForm(prev => ({
        ...prev,
        styleProfilesId: data.id,
        styleProfileName: data.name
      }));
    },
    [handleOnClose, setForm]
  );

  const handleOnClickBank = useCallback(
    (data: Bank) => {
      handleOnClose(setIsDropdownOpenBanks);
      setForm(prev => ({
        ...prev,
        bankId: data.id,
        bankName: data.name
      }));
    },
    [handleOnClose, setForm]
  );

  const handleOnClickLanguage = useCallback(
    (data: Language) => {
      handleOnClose(setIsDropdownOpenLanguages);

      setForm(prev => ({
        ...prev,
        language: data
      }));
    },
    [handleOnClose, setForm]
  );

  const handleSignature = useCallback(
    (data: SignatureForm) => {
      handleOnClose(setIsDropdownOpenLanguages);

      setForm(prev => ({
        ...prev,
        signatureData: data.data,
        signatureName: data.name,
        signatureType: data.type,
        signatureSize: data.size
      }));
    },
    [handleOnClose, setForm]
  );

  useFormDirtyCheck(form, initialFormRef);

  useEffect(() => {
    const initial = {
      id: preset?.id,
      name: preset?.name ?? '',
      businessId: preset?.businessId,
      businessName: preset?.businessName,
      clientId: preset?.clientId,
      clientName: preset?.clientName,
      currencyId: preset?.currencyId,
      currencyCode: preset?.currencyCode,
      currencySymbol: preset?.currencySymbol,
      bankId: preset?.bankId,
      bankName: preset?.bankName,
      styleProfilesId: preset?.styleProfilesId,
      styleProfileName: preset?.styleProfileName,
      customerNotes: preset?.customerNotes,
      thanksNotes: preset?.thanksNotes,
      termsConditionNotes: preset?.termsConditionNotes,
      language: preset?.language,
      signatureSize: preset?.signatureSize,
      signatureType: preset?.signatureType,
      signatureName: preset?.signatureName,
      signatureData: preset?.signatureData,
      isArchived: preset?.isArchived ?? false
    };
    initialFormRef.current = initial;
    setForm(initial);
  }, [preset, setForm]);

  useEffect(() => {
    const valid = form.name.trim() !== '' && !errors.name;

    handleChange({
      preset: form,
      isFormValid: valid,
      description: t('common.invalidForm')
    });
  }, [form, errors, handleChange, t]);

  return (
    <>
      <BusinessesDropdown
        isOpen={isDropdownOpenBusinesses}
        onClose={() => handleOnClose(setIsDropdownOpenBusinesses)}
        onOpen={() => handleOnOpen(setIsDropdownOpenBusinesses)}
        onClick={handleOnClickBusiness}
      />
      <ClientsDropdown
        isOpen={isDropdownOpenClients}
        onClose={() => handleOnClose(setIsDropdownOpenClients)}
        onOpen={() => handleOnOpen(setIsDropdownOpenClients)}
        onClick={handleOnClickClients}
      />
      <CurrenciesDropdown
        isOpen={isDropdownOpenCurrencies}
        onClose={() => handleOnClose(setIsDropdownOpenCurrencies)}
        onOpen={() => handleOnOpen(setIsDropdownOpenCurrencies)}
        onClick={handleOnClickCurrencies}
      />
      <StyleProfilesDropdown
        isOpen={isDropdownOpenStyleProfile}
        onClose={() => handleOnClose(setIsDropdownOpenStyleProfile)}
        onOpen={() => handleOnOpen(setIsDropdownOpenStyleProfile)}
        onClick={handleOnClickStyleProfile}
      />
      <BanksDropdown
        isOpen={isDropdownOpenBanks}
        onClose={() => handleOnClose(setIsDropdownOpenBanks)}
        onOpen={() => handleOnOpen(setIsDropdownOpenBanks)}
        onClick={handleOnClickBank}
      />
      <LanguageDropdown
        isOpen={isDropdownOpenLanguages}
        onClose={() => handleOnClose(setIsDropdownOpenLanguages)}
        onOpen={() => handleOnOpen(setIsDropdownOpenLanguages)}
        onClick={handleOnClickLanguage}
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label={t('common.name')}
            fullWidth
            required
            value={form.name}
            error={errors.name}
            helperText={errors.name ? t('common.fieldRequired') : ''}
            onChange={e => {
              update('name', e.target.value);
              validateField('name', e.target.value);
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 12 }}>
          <Divider flexItem />
        </Grid>
        <Grid size={{ xs: 12, md: storeSettings?.styleProfilesON ? 3 : 4 }}>
          <CurrencySelector
            onEdit={() => handleOnOpen(setIsDropdownOpenCurrencies)}
            data={currencyFormData}
            isRequired={false}
          />
        </Grid>
        <Grid size={{ xs: 12, md: storeSettings?.styleProfilesON ? 3 : 4 }}>
          <BankSelector onEdit={() => handleOnOpen(setIsDropdownOpenBanks)} name={form.bankName} />
        </Grid>
        {storeSettings?.styleProfilesON && (
          <Grid size={{ xs: 12, md: 3 }}>
            <StyleProfileSelector
              onEdit={() => handleOnOpen(setIsDropdownOpenStyleProfile)}
              name={form.styleProfileName}
            />
          </Grid>
        )}
        <Grid size={{ xs: 12, md: storeSettings?.styleProfilesON ? 3 : 4 }}>
          <LanguageSelector
            onEdit={() => handleOnOpen(setIsDropdownOpenLanguages)}
            language={form.language}
            isRequired={false}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 12 }}>
          <Divider flexItem />
        </Grid>
        <Grid size={{ xs: 12, md: 12 }}>
          <BusinessSelector
            onEdit={() => handleOnOpen(setIsDropdownOpenBusinesses)}
            data={businessFormData}
            isRequired={false}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 12 }}>
          <Divider flexItem />
        </Grid>
        <Grid size={{ xs: 12, md: 12 }}>
          <ClientSelector
            onEdit={() => handleOnOpen(setIsDropdownOpenClients)}
            clientName={form.clientName}
            isRequired={false}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 12 }}>
          <Divider flexItem />
        </Grid>
        <Grid size={{ xs: 12, md: 12 }}>
          <NotesSelector
            data={notesFormData}
            onCustomerNotesChanged={value => {
              setForm(prev => ({ ...prev, customerNotes: value }));
            }}
            onThanksNotesChanged={value => {
              setForm(prev => ({ ...prev, thanksNotes: value }));
            }}
            onTermsConditionsNotesChanged={value => {
              setForm(prev => ({ ...prev, termsConditionNotes: value }));
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 12 }}>
          <Divider flexItem />
        </Grid>
        <Grid size={{ xs: 12, md: 12 }}>
          <SignatureSelector data={signatureFormData} onEdit={handleSignature} />
        </Grid>
        <Grid size={{ xs: 12, md: 12 }}>
          <Divider flexItem />
        </Grid>
        <Grid size={{ xs: 12, md: 12 }}>
          <FormControlLabel
            control={<Switch checked={form.isArchived} onChange={e => update('isArchived', e.target.checked)} />}
            label={t('common.archived')}
          />
        </Grid>
      </Grid>
    </>
  );
};
