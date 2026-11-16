import type { HeaderBlock } from '@invoice-builder/contracts';
import { View } from '@react-pdf/renderer';
import { memo, type FC } from 'react';
import type { InvoiceAdd } from '@invoice-builder/contracts';
import type { PdfTexts } from '../types.js';
import type { PdfSettings } from '../types.js';

import { BusinessInfo } from './BusinessInfo.js';
import { ClientInfo } from './ClientInfo.js';
import { PDF_STYLES } from './constant.js';
import { InvoiceInformationInfo } from './InvoiceInformationInfo.js';
import { LogoInfo } from './LogoInfo.js';
import { PaymentInfo } from './PaymentInfo.js';
import { TitleInfo } from './TitleInfo.js';

interface Props {
  invoiceForm?: InvoiceAdd;
  storeSettings?: PdfSettings;
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
      block.width ? PDF_STYLES.headerBlockWidth : undefined,
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
          <View key={key} style={style}>
            <TitleInfo
              invoiceForm={invoiceForm}
              labels={{ pdfINVOICELabel: pdfTexts.pdfINVOICE, pdfQUOTELabel: pdfTexts.pdfQUOTE }}
            />
          </View>
        );
      case 'logo':
        return (
          <View key={key} style={style}>
            <LogoInfo invoiceForm={invoiceForm} logoUrl={logoUrl} />
          </View>
        );
      case 'businessInfo':
        return (
          <View key={key} style={style}>
            <BusinessInfo invoiceForm={invoiceForm} textAlign={block.textAlign} />
          </View>
        );
      case 'clientInfo':
        return (
          <View key={key} style={style}>
            <ClientInfo invoiceForm={invoiceForm} billToLabel={pdfTexts.billTo} />
          </View>
        );
      case 'invoiceMeta':
        return (
          <View key={key} style={style}>
            <InvoiceInformationInfo
              storeSettings={storeSettings}
              invoiceForm={invoiceForm}
              showTitle={block.showTitle}
              showInvoiceLabel={block.showInvoiceLabel}
              textAlign={block.textAlign}
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

  return <View style={PDF_STYLES.header}>{blocks.map((block, index) => renderBlock(block, index))}</View>;
};
export const HeaderInfo = memo(HeaderInfoComponent);
