import { View } from '@react-pdf/renderer';
import { memo, type FC } from 'react';
import type { InvoiceFromData, PdfTexts } from '../../../shared/types/invoice';
import type { HeaderBlock } from '../../../shared/types/layouts';
import type { Settings } from '../../../shared/types/settings';
import { BusinessInfo } from './BusinessInfo';
import { ClientInfo } from './ClientInfo';
import { PDF_STYLES } from './constant';
import { InvoiceInformationInfo } from './InvoiceInformationInfo';
import { LogoInfo } from './LogoInfo';
import { PaymentInfo } from './PaymentInfo';
import { TitleInfo } from './TitleInfo';

interface Props {
  invoiceForm?: InvoiceFromData;
  storeSettings?: Settings;
  logoUrl?: string;
  pdfTexts: PdfTexts;
  blocks: HeaderBlock[];
}
const HeaderInfoComponent: FC<Props> = ({ invoiceForm, storeSettings, logoUrl, pdfTexts, blocks }) => {
  const renderBlock = (block: HeaderBlock, index: number): React.ReactNode => {
    const style = [
      block.type === 'row' ? PDF_STYLES.row : undefined,
      block.align === 'start'
        ? PDF_STYLES.alignStart
        : block.align === 'center'
          ? PDF_STYLES.alignCenter
          : block.align === 'end'
            ? PDF_STYLES.alignEnd
            : undefined,
      block.justify === 'between' ? PDF_STYLES.spaceBetween : undefined,
      block.width === '20%'
        ? PDF_STYLES.w20
        : block.width === '40%'
          ? PDF_STYLES.w40
          : block.width === '50%'
            ? PDF_STYLES.w50
            : block.width === '60%'
              ? PDF_STYLES.w60
              : block.width === '100%'
                ? PDF_STYLES.w100
                : undefined,
      block.paddingTop === 10 ? PDF_STYLES.pt10 : block.paddingTop === 20 ? PDF_STYLES.pt20 : undefined,
      block.paddingBottom === 20 ? PDF_STYLES.pb20 : undefined,
      block.gap === 5 ? PDF_STYLES.gap5 : block.gap === 10 ? PDF_STYLES.gap10 : undefined,
      block.boxed ? { backgroundColor: '#e0e0e0', padding: 5, borderRadius: 5 } : undefined
    ];
    const key = `${block.type}-${index}`;

    switch (block.type) {
      case 'row':
      case 'column':
        return (
          <View key={key} style={style}>
            {block.children?.map(renderBlock)}
          </View>
        );
      case 'title':
        return (
          <TitleInfo
            key={key}
            invoiceForm={invoiceForm}
            labels={{ pdfINVOICELabel: pdfTexts.pdfINVOICE, pdfQUOTELabel: pdfTexts.pdfQUOTE }}
          />
        );
      case 'logo':
        return <LogoInfo key={key} invoiceForm={invoiceForm} logoUrl={logoUrl} />;
      case 'businessInfo':
        return <BusinessInfo key={key} invoiceForm={invoiceForm} />;
      case 'clientInfo':
        return <ClientInfo key={key} invoiceForm={invoiceForm} billToLabel={pdfTexts.billTo} />;
      case 'invoiceMeta':
        return (
          <View key={key} style={style}>
            <InvoiceInformationInfo
              storeSettings={storeSettings}
              invoiceForm={invoiceForm}
              showTitle={block.showTitle}
              showInvoiceLabel={block.showInvoiceLabel}
              labels={{
                invoiceNoLabel: pdfTexts.invoiceNo,
                quoteNoLabel: pdfTexts.quoteNo,
                dueDateLabel: pdfTexts.dueDate,
                dateLabel: pdfTexts.date,
                pdfINVOICELabel: pdfTexts.pdfINVOICE,
                pdfQUOTELabel: pdfTexts.pdfQUOTE
              }}
            />
          </View>
        );
      case 'paymentInfo':
        return (
          <View key={key} style={style}>
            <PaymentInfo
              invoiceForm={invoiceForm}
              paymentInfoLabel={pdfTexts.paymentInfo}
              source={block.paymentSource}
            />
          </View>
        );
    }
  };

  return <View style={PDF_STYLES.header}>{blocks.map(renderBlock)}</View>;
};
export const HeaderInfo = memo(HeaderInfoComponent);
