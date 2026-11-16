import type {
  ColumnSizing,
  HeaderBlock,
  LayoutNode,
  LayoutSchemaV2,
  LayoutSectionType,
  TotalsRowBlock
} from '@invoice-builder/contracts';
import { InvoiceStatus } from '@invoice-builder/contracts';
import { Document, Image, Page, Text, View } from '@react-pdf/renderer';
import { Fragment, memo, useMemo, type ComponentProps, type FC, type ReactNode } from 'react';
import type { InvoiceAdd } from '@invoice-builder/contracts';
import type { AttachmentURL, PdfSettings, PdfTexts } from '../types.js';
import { createCustomFontStyles, DEFAULT_FONT_SIZES, FONT_SIZES, PDF_STYLES } from './constant.js';
import { FinancialInfo } from './FinancialInfo.js';
import { HeaderInfo } from './HeaderInfo.js';
import { ItemsInfo } from './ItemsInfo.js';
import { NotesInfo } from './NotesInfo.js';
import { PageCounterInfo } from './PageCounterInfo.js';
import { PaymentInfo } from './PaymentInfo.js';
import { SignatureInfo } from './SignatureInfo.js';
import { WatermarkInfo } from './WatermarkInfo.js';
import { WatermarkPaidInfo } from './WatermarkPaidInfo.js';

interface Props {
  invoiceForm?: InvoiceAdd;
  storeSettings?: PdfSettings;
  logoUrl?: string;
  qrCodeUrl?: string;
  signatureUrl?: string;
  attachmentUrls: AttachmentURL[];
  pdfTexts: PdfTexts;
  layoutRequired: string;
  watermarkUrl?: string;
  watermarkPaidUrl?: string;
  splittableItemRowIds?: ReadonlySet<string>;
  measureItemRows?: boolean;
  onRender?: ComponentProps<typeof Document>['onRender'];
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
  watermarkPaidUrl,
  splittableItemRowIds,
  onRender,
  measureItemRows = false
}) => {
  const templateLayout = invoiceForm?.invoiceLayoutSnapshot?.layoutSchema;
  const templateSections = templateLayout?.schemaVersion === 1 ? (templateLayout.sections ?? []) : [];
  const templateRegions = templateLayout?.schemaVersion === 2 ? templateLayout.regions : [];
  const dynamicStyle = useMemo(
    () => createCustomFontStyles(invoiceForm?.invoiceCustomization?.fontFamily),
    [invoiceForm?.invoiceCustomization?.fontFamily]
  );

  const renderTemplateSection = (
    type: LayoutSectionType,
    blocks?: HeaderBlock[],
    columnSizing?: ColumnSizing,
    totalsBlocks?: TotalsRowBlock[],
    watermarkOrder?: 'default' | 'paidFirst',
    align?: 'start' | 'center' | 'end'
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
            splittableItemRowIds={splittableItemRowIds}
          />
        );
      case 'financialTotals':
        return (
          <View
            key={type}
            wrap={false}
            style={[
              PDF_STYLES.row,
              align === 'start'
                ? { justifyContent: 'flex-start' }
                : align === 'center'
                  ? { justifyContent: 'center' }
                  : PDF_STYLES.spaceBetween,
              PDF_STYLES.alignStart,
              PDF_STYLES.pt10
            ]}
            minPresenceAhead={20}
          >
            {align !== 'start' && <View style={PDF_STYLES.flexGrow} />}
            <FinancialInfo
              invoiceForm={invoiceForm}
              storeSettings={storeSettings}
              align={align}
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

  const renderRegion = (region: LayoutSchemaV2['regions'][number]) => (
    <View
      key={region.id}
      wrap={region.overflow !== 'keepTogether'}
      minPresenceAhead={region.overflow === 'keepTogether' ? 40 : undefined}
      style={{
        width: region.width,
        flexDirection: region.direction === 'column' ? 'column' : 'row',
        flexWrap: region.direction === 'grid' ? 'wrap' : 'nowrap',
        alignContent: 'flex-start',
        marginRight: region.gap
      }}
    >
      {region.blocks && (
        <HeaderInfo
          invoiceForm={invoiceForm}
          storeSettings={storeSettings}
          logoUrl={logoUrl}
          pdfTexts={pdfTexts}
          blocks={region.blocks}
        />
      )}
      {region.sections?.map(section => renderTemplateSection(section))}
      {region.children?.map((node, index) => renderLayoutNode(node, `${region.id}-${index}`))}
    </View>
  );

  const renderLayoutNode = (node: LayoutNode, key: string): ReactNode => {
    if (node.type === 'block') {
      return (
        <HeaderInfo
          key={key}
          invoiceForm={invoiceForm}
          storeSettings={storeSettings}
          logoUrl={logoUrl}
          pdfTexts={pdfTexts}
          blocks={[node.block]}
        />
      );
    }
    if (node.type === 'section') {
      if (node.section.visible === false) return null;
      return (
        <View key={key}>
          {renderTemplateSection(
            node.section.type,
            node.section.blocks,
            node.section.columnSizing,
            node.section.totalsBlocks,
            node.section.watermarkOrder,
            node.section.align
          )}
        </View>
      );
    }
    return (
      <View
        key={key}
        style={{
          width: node.width,
          flexDirection: node.type === 'column' ? 'column' : 'row',
          flexWrap: node.type === 'grid' ? 'wrap' : 'nowrap',
          gap: node.gap
        }}
      >
        {node.children.map((child, index) => renderLayoutNode(child, `${key}-${index}`))}
      </View>
    );
  };

  return (
    <Document onRender={onRender}>
      <Page
        size={invoiceForm?.invoiceCustomization?.pageFormat}
        wrap={!measureItemRows}
        orientation={templateLayout?.schemaVersion === 2 ? templateLayout.orientation : undefined}
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
        ) : templateLayout?.schemaVersion === 2 ? (
          <View wrap={templateRegions.length === 1} style={{ flexDirection: 'row', flexWrap: 'nowrap', width: '100%' }}>
            {templateRegions.map(renderRegion)}
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
                section.watermarkOrder,
                section.align
              )
            )
        )}
      </Page>

      {attachmentUrls.map(item => (
        <Page
          key={item.id}
          size={invoiceForm?.invoiceCustomization?.pageFormat}
          orientation={templateLayout?.schemaVersion === 2 ? templateLayout.orientation : undefined}
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
