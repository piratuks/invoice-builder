import { Document, Font, Image, Page, Text, View } from '@react-pdf/renderer';
import { Fragment, memo, useMemo, type FC } from 'react';
import { InvoiceStatus } from '../../../shared/enums/invoiceStatus';
import type { AttachmentURL, InvoiceFromData, PdfTexts } from '../../../shared/types/invoice';
import type { ColumnSizing, HeaderBlock, LayoutSectionType, TotalsRowBlock } from '../../../shared/types/layouts';
import type { Settings } from '../../../shared/types/settings';
import Inter_18pt_Bold from './../../../assets/inter/Inter_18pt-Bold.ttf';
import Inter_18pt_BoldItalic from './../../../assets/inter/Inter_18pt-BoldItalic.ttf';
import Inter_18pt_Italic from './../../../assets/inter/Inter_18pt-Italic.ttf';
import Inter_18pt_Medium from './../../../assets/inter/Inter_18pt-Medium.ttf';
import Inter_18pt_MediumItalic from './../../../assets/inter/Inter_18pt-MediumItalic.ttf';
import Inter_18pt_Regular from './../../../assets/inter/Inter_18pt-Regular.ttf';
import Inter_18pt_SemiBold from './../../../assets/inter/Inter_18pt-SemiBold.ttf';
import Inter_18pt_SemiBoldItalic from './../../../assets/inter/Inter_18pt-SemiBoldItalic.ttf';
import Inter_24pt_Bold from './../../../assets/inter/Inter_24pt-Bold.ttf';
import Inter_24pt_BoldItalic from './../../../assets/inter/Inter_24pt-BoldItalic.ttf';
import Inter_24pt_Italic from './../../../assets/inter/Inter_24pt-Italic.ttf';
import Inter_24pt_Medium from './../../../assets/inter/Inter_24pt-Medium.ttf';
import Inter_24pt_MediumItalic from './../../../assets/inter/Inter_24pt-MediumItalic.ttf';
import Inter_24pt_Regular from './../../../assets/inter/Inter_24pt-Regular.ttf';
import Inter_24pt_SemiBold from './../../../assets/inter/Inter_24pt-SemiBold.ttf';
import Inter_24pt_SemiBoldItalic from './../../../assets/inter/Inter_24pt-SemiBoldItalic.ttf';
import Inter_28pt_Bold from './../../../assets/inter/Inter_28pt-Bold.ttf';
import Inter_28pt_BoldItalic from './../../../assets/inter/Inter_28pt-BoldItalic.ttf';
import Inter_28pt_Italic from './../../../assets/inter/Inter_28pt-Italic.ttf';
import Inter_28pt_Medium from './../../../assets/inter/Inter_28pt-Medium.ttf';
import Inter_28pt_MediumItalic from './../../../assets/inter/Inter_28pt-MediumItalic.ttf';
import Inter_28pt_Regular from './../../../assets/inter/Inter_28pt-Regular.ttf';
import Inter_28pt_SemiBold from './../../../assets/inter/Inter_28pt-SemiBold.ttf';
import Inter_28pt_SemiBoldItalic from './../../../assets/inter/Inter_28pt-SemiBoldItalic.ttf';
import RobotoBold from './../../../assets/roboto/Roboto-Bold.ttf';
import RobotoBoldItalic from './../../../assets/roboto/Roboto-BoldItalic.ttf';
import RobotoItalic from './../../../assets/roboto/Roboto-Italic.ttf';
import RobotoMedium from './../../../assets/roboto/Roboto-Medium.ttf';
import RobotoMediumItalic from './../../../assets/roboto/Roboto-MediumItalic.ttf';
import RobotoRegular from './../../../assets/roboto/Roboto-Regular.ttf';
import RobotoSemiBold from './../../../assets/roboto/Roboto-SemiBold.ttf';
import RobotoSemiBoldItalic from './../../../assets/roboto/Roboto-SemiBoldItalic.ttf';
import { createCustomFontStyles, DEFAULT_FONT_SIZES, FONT_SIZES, PDF_STYLES } from './constant';
import { FinancialInfo } from './FinancialInfo';
import { HeaderInfo } from './HeaderInfo';
import { ItemsInfo } from './ItemsInfo';
import { NotesInfo } from './NotesInfo';
import { PageCounterInfo } from './PageCounterInfo';
import { PaymentInfo } from './PaymentInfo';
import { SignatureInfo } from './SignatureInfo';
import { WatermarkInfo } from './WatermarkInfo';
import { WatermarkPaidInfo } from './WatermarkPaidInfo';

const registerFonts = () => {
  Font.register({ family: 'Roboto', src: RobotoRegular, fontWeight: 400 });
  Font.register({ family: 'Roboto', src: RobotoMedium, fontWeight: 500 });
  Font.register({ family: 'Roboto', src: RobotoSemiBold, fontWeight: 600 });
  Font.register({ family: 'Roboto', src: RobotoBold, fontWeight: 700 });
  Font.register({ family: 'Roboto', src: RobotoItalic, fontStyle: 'italic' });
  Font.register({
    family: 'Roboto',
    src: RobotoBoldItalic,
    fontWeight: 700,
    fontStyle: 'italic'
  });
  Font.register({
    family: 'Roboto',
    src: RobotoMediumItalic,
    fontWeight: 500,
    fontStyle: 'italic'
  });
  Font.register({
    family: 'Roboto',
    src: RobotoSemiBoldItalic,
    fontWeight: 600,
    fontStyle: 'italic'
  });
  Font.register({ family: 'Inter', src: Inter_18pt_Regular, fontWeight: 400 });
  Font.register({ family: 'Inter', src: Inter_18pt_Italic, fontWeight: 400, fontStyle: 'italic' });
  Font.register({ family: 'Inter', src: Inter_18pt_Medium, fontWeight: 500 });
  Font.register({ family: 'Inter', src: Inter_18pt_MediumItalic, fontWeight: 500, fontStyle: 'italic' });
  Font.register({ family: 'Inter', src: Inter_18pt_SemiBold, fontWeight: 600 });
  Font.register({ family: 'Inter', src: Inter_18pt_SemiBoldItalic, fontWeight: 600, fontStyle: 'italic' });
  Font.register({ family: 'Inter', src: Inter_18pt_Bold, fontWeight: 700 });
  Font.register({ family: 'Inter', src: Inter_18pt_BoldItalic, fontWeight: 700, fontStyle: 'italic' });
  Font.register({ family: 'Inter', src: Inter_24pt_Regular, fontWeight: 400 });
  Font.register({ family: 'Inter', src: Inter_24pt_Italic, fontWeight: 400, fontStyle: 'italic' });
  Font.register({ family: 'Inter', src: Inter_24pt_Medium, fontWeight: 500 });
  Font.register({ family: 'Inter', src: Inter_24pt_MediumItalic, fontWeight: 500, fontStyle: 'italic' });
  Font.register({ family: 'Inter', src: Inter_24pt_SemiBold, fontWeight: 600 });
  Font.register({ family: 'Inter', src: Inter_24pt_SemiBoldItalic, fontWeight: 600, fontStyle: 'italic' });
  Font.register({ family: 'Inter', src: Inter_24pt_Bold, fontWeight: 700 });
  Font.register({ family: 'Inter', src: Inter_24pt_BoldItalic, fontWeight: 700, fontStyle: 'italic' });
  Font.register({ family: 'Inter', src: Inter_28pt_Regular, fontWeight: 400 });
  Font.register({ family: 'Inter', src: Inter_28pt_Italic, fontWeight: 400, fontStyle: 'italic' });
  Font.register({ family: 'Inter', src: Inter_28pt_Medium, fontWeight: 500 });
  Font.register({ family: 'Inter', src: Inter_28pt_MediumItalic, fontWeight: 500, fontStyle: 'italic' });
  Font.register({ family: 'Inter', src: Inter_28pt_SemiBold, fontWeight: 600 });
  Font.register({ family: 'Inter', src: Inter_28pt_SemiBoldItalic, fontWeight: 600, fontStyle: 'italic' });
  Font.register({ family: 'Inter', src: Inter_28pt_Bold, fontWeight: 700 });
  Font.register({ family: 'Inter', src: Inter_28pt_BoldItalic, fontWeight: 700, fontStyle: 'italic' });
};

registerFonts();

interface Props {
  invoiceForm?: InvoiceFromData;
  storeSettings?: Settings;
  logoUrl?: string;
  qrCodeUrl?: string;
  signatureUrl?: string;
  attachmentUrls: AttachmentURL[];
  pdfTexts: PdfTexts;
  layoutRequired: string;
  watermarkUrl?: string;
  watermarkPaidUrl?: string;
}
const PDFDocumentComponent: FC<Props> = ({
  invoiceForm,
  storeSettings,
  logoUrl,
  qrCodeUrl,
  signatureUrl,
  attachmentUrls,
  pdfTexts,
  layoutRequired,
  watermarkUrl,
  watermarkPaidUrl
}) => {
  const templateSections = invoiceForm?.invoiceLayoutSnapshot?.layoutSchema?.sections ?? [];
  const dynamicStyle = useMemo(
    () => createCustomFontStyles(invoiceForm?.invoiceCustomization?.fontFamily),
    [invoiceForm?.invoiceCustomization?.fontFamily]
  );

  const renderTemplateSection = (
    type: LayoutSectionType,
    blocks?: HeaderBlock[],
    columnSizing?: ColumnSizing,
    totalsBlocks?: TotalsRowBlock[],
    watermarkOrder?: 'default' | 'paidFirst'
  ) => {
    switch (type) {
      case 'watermark':
        return (
          <Fragment key={type}>
            {watermarkOrder === 'paidFirst' && invoiceForm?.status === InvoiceStatus.paid && (
              <WatermarkPaidInfo invoiceForm={invoiceForm} watermarkPaidUrl={watermarkPaidUrl} />
            )}
            <WatermarkInfo invoiceForm={invoiceForm} watermarkUrl={watermarkUrl} />
            {watermarkOrder !== 'paidFirst' && invoiceForm?.status === InvoiceStatus.paid && (
              <WatermarkPaidInfo invoiceForm={invoiceForm} watermarkPaidUrl={watermarkPaidUrl} />
            )}
          </Fragment>
        );
      case 'header':
        return (
          <HeaderInfo
            key={type}
            invoiceForm={invoiceForm}
            storeSettings={storeSettings}
            logoUrl={logoUrl}
            pdfTexts={pdfTexts}
            blocks={blocks ?? []}
          />
        );
      case 'itemsTable':
        return (
          <ItemsInfo
            key={type}
            invoiceForm={invoiceForm}
            storeSettings={storeSettings}
            columnSizing={columnSizing}
            labels={{
              itemLabel: pdfTexts.itemLabel,
              unitLabel: pdfTexts.unitLabel,
              qtyLabel: pdfTexts.qtyLabel,
              unitCostLabel: pdfTexts.unitCostLabel,
              totalLabel: pdfTexts.totalLabel,
              taxLabel: pdfTexts.taxLabel,
              discountLabel: pdfTexts.discountLabel
            }}
          />
        );
      case 'financialTotals':
        return (
          <View
            key={type}
            wrap={false}
            style={[PDF_STYLES.row, PDF_STYLES.spaceBetween, PDF_STYLES.alignStart, PDF_STYLES.pt10]}
            minPresenceAhead={20}
          >
            <View style={PDF_STYLES.flexGrow} />
            <FinancialInfo
              invoiceForm={invoiceForm}
              storeSettings={storeSettings}
              labels={{
                subTotalLabel: pdfTexts.subTotalLabel,
                discountLabel: pdfTexts.discountLabel,
                surchargeLabel: pdfTexts.surchargeLabel,
                incLabel: pdfTexts.incLabel,
                taxLabel: pdfTexts.taxLabel,
                taxExclusivePerItemLabel: pdfTexts.taxExclusivePerItemLabel,
                taxInclusivePerItemLabel: pdfTexts.taxInclusivePerItemLabel,
                shippingFeeLabel: pdfTexts.shippingFeeLabel,
                totalLabel: pdfTexts.totalLabel,
                paidLabel: pdfTexts.paidLabel,
                balanceDueLabel: pdfTexts.balanceDueLabel
              }}
            />
          </View>
        );
      case 'paymentInfo':
        return (
          <View
            key={type}
            wrap={false}
            style={[PDF_STYLES.row, PDF_STYLES.spaceBetween, PDF_STYLES.alignStart, PDF_STYLES.pt20]}
            minPresenceAhead={20}
          >
            <PaymentInfo invoiceForm={invoiceForm} paymentInfoLabel={pdfTexts.paymentInfo} qrCodeUrl={qrCodeUrl} />
          </View>
        );
      case 'totalsRow':
        return (
          <View
            key={type}
            wrap={false}
            style={[PDF_STYLES.row, PDF_STYLES.spaceBetween, PDF_STYLES.alignStart, PDF_STYLES.pt10]}
            minPresenceAhead={20}
          >
            {totalsBlocks?.map(block => {
              if (block.type === 'spacer') return <View key="spacer" style={PDF_STYLES.flexGrow} />;
              if (block.type === 'paymentInfo') {
                return (
                  <PaymentInfo
                    key="paymentInfo"
                    invoiceForm={invoiceForm}
                    paymentInfoLabel={pdfTexts.paymentInfo}
                    qrCodeUrl={qrCodeUrl}
                    source={block.paymentSource}
                  />
                );
              }
              return (
                <FinancialInfo
                  key="financialTotals"
                  invoiceForm={invoiceForm}
                  storeSettings={storeSettings}
                  labels={{
                    subTotalLabel: pdfTexts.subTotalLabel,
                    discountLabel: pdfTexts.discountLabel,
                    surchargeLabel: pdfTexts.surchargeLabel,
                    incLabel: pdfTexts.incLabel,
                    taxLabel: pdfTexts.taxLabel,
                    taxExclusivePerItemLabel: pdfTexts.taxExclusivePerItemLabel,
                    taxInclusivePerItemLabel: pdfTexts.taxInclusivePerItemLabel,
                    shippingFeeLabel: pdfTexts.shippingFeeLabel,
                    totalLabel: pdfTexts.totalLabel,
                    paidLabel: pdfTexts.paidLabel,
                    balanceDueLabel: pdfTexts.balanceDueLabel
                  }}
                />
              );
            })}
          </View>
        );
      case 'notes':
        return (
          <NotesInfo
            key={type}
            invoiceForm={invoiceForm}
            labels={{ customerNoteLabel: pdfTexts.customerNote, termsConditionsLabel: pdfTexts.termsConditions }}
          />
        );
      case 'signature':
        return (
          <SignatureInfo
            key={type}
            invoiceForm={invoiceForm}
            signatureUrl={signatureUrl}
            authorisedSignatoryLabel={pdfTexts.authorisedSignatoryLabel}
          />
        );
      case 'pageCounter':
        return (
          <PageCounterInfo
            key={type}
            invoiceForm={invoiceForm}
            labels={{ ofLabel: pdfTexts.of, pageLabel: pdfTexts.page }}
          />
        );
    }
  };

  return (
    <Document>
      <Page
        size={invoiceForm?.invoiceCustomization?.pageFormat}
        style={[
          PDF_STYLES.page,
          dynamicStyle.customFont,
          { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].page }
        ]}
      >
        {!invoiceForm?.layoutId || !invoiceForm.invoiceLayoutSnapshot?.layoutSchema ? (
          <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={PDF_STYLES.layoutRequired}>{layoutRequired}</Text>
          </View>
        ) : (
          templateSections
            .filter(section => section.visible !== false)
            .map(section =>
              renderTemplateSection(
                section.type,
                section.blocks,
                section.columnSizing,
                section.totalsBlocks,
                section.watermarkOrder
              )
            )
        )}
      </Page>

      {attachmentUrls.map(item => (
        <Page
          key={item.id}
          size={invoiceForm?.invoiceCustomization?.pageFormat}
          style={[
            PDF_STYLES.page,
            dynamicStyle.customFont,
            { fontSize: FONT_SIZES[invoiceForm?.invoiceCustomization?.fontSize ?? DEFAULT_FONT_SIZES].page }
          ]}
        >
          <WatermarkInfo invoiceForm={invoiceForm} watermarkUrl={watermarkUrl} />
          <Image style={PDF_STYLES.attachment} src={item.url} />
          <PageCounterInfo
            invoiceForm={invoiceForm}
            labels={{
              ofLabel: pdfTexts.of,
              pageLabel: pdfTexts.page
            }}
          />
        </Page>
      ))}
    </Document>
  );
};
export const PDFDocument = memo(PDFDocumentComponent);
