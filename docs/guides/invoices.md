---
title: Invoices
---

# Invoices screen

The **Invoices** screen allows you to **create, read, update, and delete (CRUD)** invoice records.

:::info
Amounts and dates are formatted based on the configuration in the [Settings screen](./settings.md#localization--formatting) and the currency format defined in the [Currencies screen](./currencies.md).
:::

You can also:

- **Filter** invoices by various criteria
- **Export** invoices to XLSX
- **Preview** invoices live in PDF format
- **Customize** PDF appearance and layout
- **Export** invoices as PDF documents
- **Duplicate Invoice** to quickly create a similar invoice

:::info
XLSX export does **not** include attachments or business logo snapshots.
:::

## Adding a Invoice

Click the **Add** button at the bottom to open the right-hand pane, where you can enter invoice details. If the [Presets screen](./presets.md) are enabled then you will have to choose either create new or from preset.

![Invoice creation](images/invoice-add-panel.jpg)

- **Required information:**
  - Currency
  - Language (Quote language for PDF labels which is independant from global application settings)
  - Business
  - Client (“Bill To”)
  - Invoice information
  - At least one item

![Invoice creation](images/invoice-form.jpg)

Select a currency from the dropdown. The dropdown supports **search, filter, and sort** (see [Currencies screen](./currencies.md) for details).

:::info
The selected currency is saved as a snapshot. The snapshot is updated only when editing the invoice and changing the currency.
:::

![Invoice currency creation](images/invoice-currency-selection.jpg)

Select a business from the dropdown. The dropdown supports **search, filter, and sort** (see [Businesses screen](./businesses.md) for details).

:::info
The selected business is saved as a snapshot. The snapshot is updated only when editing the invoice and changing the business.
:::

![Invoice business creation](images/invoice-business-selection.jpg)

Select a client from the dropdown. The dropdown supports **search, filter, and sort** (see [Clients screen](./clients.md) for details).

:::info
The selected client is saved as a snapshot. The snapshot is updated only when editing the invoice and changing the client.
:::

To create a client without leaving the invoice form, use the **Add** action in the client selector. Enter the required name and, optionally, a phone number; the new client is selected automatically after creation.

![Invoice client creation](images/invoice-client-selection.jpg)

Select a style profile from the dropdown. The dropdown supports **search, filter, and sort** (see [Style profiles screen](./style-profiles.md) for details).

:::info
The selected style profile is saved as a snapshot. The snapshot is updated only when editing the quote and changing the style profile.

This section can be hidden if the feature is turned off in the settings. Customization can still be adjusted in preview mode.

Selecting a style profile only applies preset values. You can continue customizing everything afterward.
:::

![Invoice style profile creation](images/invoice-style-profile-selection.jpg)

Select a language from the dropdown. The dropdown supports **search**.

:::info
The selected language applies only to the generated PDF and is independent of the application's global language setting.
:::

![Invoice language creation](images/invoice-language-selection.jpg)

Enter the invoice details, including:

- Invoice number prefix
- Invoice number suffix
- Invoice number
- Issued date
- Due date

:::info

- The prefix and suffix are saved as a snapshot if they were configured on the [Settings screen](./settings.md#invoice--file-naming).
- You can also change or add them here, even if they were not configured in Settings.
- If configured, the prefix and suffix are always incorporated into the invoice number automatically.

:::

![Invoice information](images/invoice-information.jpg)

Select a item from the dropdown and set quantity and unit price. The dropdown supports **search, filter, and sort** (see [Items screen](./items.md) for details).

:::info
The selected item is saved as a snapshot. The snapshot is updated only when editing the invoice and changing the item.

When adding or editing an item in a invoice, a modal will appear requiring you to set the quantity and unit price. You can also define custom field data for the item, including a header, value, and alignment. Each unique custom header is added as a column in the PDF’s item table, and the corresponding value is placed in that column for the item. Alignment is configured per unique header. A header can be selected from the existing list or typed in as a new one (pressing Enter is required to register a new header). Both fields header and value must either be fully selected / entered or empty; otherwise, the Save button will remain disabled.
:::

![Invoice item creation](images/invoice-item-selection.jpg)
![Invoice item quantity](images/invoice-item-quantity.jpg)

:::info
The items order can be changed by drag and drop.
:::

![Invoice items order](images/invoice-items-reorder.jpg)

Once all required information has been filled in, the invoice can be saved.

![Invoice item quantity](images/invoice-saved.jpg)

Information on other pages is also updated to reflect the current invoice count.

![Invoice count](images/invoice-count.jpg)

Additionally, you can set a **discount** (fixed amount or percentage-based).

![Invoice discount none](images/invoice-discount-none.jpg)
![Invoice discount fixed](images/invoice-discount-fixed.jpg)
![Invoice discount percentage](images/invoice-discount-percentage.jpg)
![Invoice discount result](images/invoice-discount-result.jpg)

Additionally, you can set a **surcharge** (fixed amount or percentage-based).

![Invoice surcharge none](images/invoice-surcharge-none.png)
![Invoice surcharge fixed](images/invoice-surcharge-fixed.png)
![Invoice surcharge percentage](images/invoice-surcharge-percentage.png)
![Invoice surcharge result](images/invoice-surcharge-result.png)

You can also configure **taxes** for the invoice:

- **Total-based taxes**: inclusive, exclusive, or deducted
- **Per-item taxes**: inclusive or exclusive

![Invoice none](images/invoice-tax-none.jpg)
![Invoice on total](images/invoice-tax-on-total.jpg)
![Invoice deducted](images/invoice-tax-deducted.jpg)
![Invoice per item](images/invoice-tax-per-item.jpg)

Results:

![Invoice on total inclusive](images/invoice-tax-total-inclusive.jpg)
![Invoice on total dedcuted](images/invoice-tax-total-deducted-result.jpg)
![Invoice on total exclusive](images/invoice-tax-total-exclusive.jpg)
![Invoice per item inclusive](images/invoice-tax-per-item-inclusive.jpg)
![Invoice per item exclusive](images/invoice-tax-per-item-exclusive.jpg)

Additionally, you can set a **shipping fees** (fixed amount).

![Invoice shipping fees](images/invoice-shipping-fees.jpg)

Additionally, **partial payments are supported**, allowing you to track paid amounts and outstanding balances per invoice.

![Invoice with partial payment applied](images/invoice-partial-payment.jpg)

Additionally, you can set a **notes** (customer notes, thank you note, terms & conditions note).

![Invoice thank you notes](images/invoice-thank-you-note.jpg)
![Invoice customer notes](images/invoice-customer-note.jpg)
![Invoice terms & conditions notes](images/invoice-terms-note.jpg)

Additionally, you can set a **signature** which can be set via hand/cursor or uploaded as image.

:::info
Maximum file size: 2 MB
:::

![Invoice signature](images/invoice-signature-draw.jpg)
![Invoice signature](images/invoice-signature-upload.jpg)

Additionally, you can attach **images**, which will be embedded into the PDF.

:::info
Maximum file size: 2 MB
:::

![Invoice attachments](images/invoice-attachments.jpg)

## Editing / Deleting a Invoice

Once invoice are added, select one from the list to edit it on the right-hand pane. Each invoice also displays:

- Invoice data (Issued At)
- Invoice status (Unpaid, Paid, Partially, Closed)
- Client name
- Total amount
- Due date / Overdue information / Partial paid information

![Invoice list with statuses](images/invoice-list.jpg)

You can also:

- **Search invoices by invoice number**
- **Delete a invoice** by clicking the vertical dots menu → **Delete**

![Invoice actions](images/invoice-add-panel.jpg)

## Filters

Invoices have filters to control what is displayed. By default:

- **Active**: shows all items except archived

The **archived flag** can be toggled during creation or editing. This flag only affects filtering and does not delete the invoice.

Invoices have **Unpaid**, **Partially**, **Paid** and **Closed** statuses, so the status filter includes only these options.  
Client and business filters are based on **snapshot data** stored with the invoice.
The **date filter** applies to the **Issued At** date.

![Invoices filters](images/invoice-filters.jpg)

## Sorting

Invoices can be sorted by:

- Status
- Issued at date
- Invoice number
- Last updated date

![Invoices sort](images/invoice-sort.jpg)

## Export

Invoices can be exported **only to XLSX** format.

- Export all invoice-related data to XLSX

:::info
Attachments and business logo snapshots are **not included** in the export.
:::

![Invoices import/export](images/invoice-export.jpg)

## PDF Preview

- Invoices can be **previewed live** and **exported as PDF**.
- PDF customization is based on **predefined configuration options**.
- The **Paid watermark** is applied **only when the status is set to Paid**.
- The watermark is applied **across all pages** of the document.
- **Page numbers** are shown **only when the document has more than one page**.
- **Attachments** are embedded into the PDF when present.
- Sections with zero values (**Surcharge**, **Discount**, **Tax**, **Shipping fees**) are **hidden** in the PDF.
- **Save as Profile** button will create style profile item with these customization presets for futher usage on other quotes.

![Invoices customized option 1](images/invoice-pdf-customization-1.jpg)
![Invoices customized option 2](images/invoice-pdf-customization-2.jpg)
![Invoices customized option 3](images/invoice-pdf-customization-3.jpg)
![Invoices customized option 4](images/invoice-pdf-customization-4.jpg)
![Invoices PDF](images/invoice-pdf-preview.jpg)
![Invoices PDF attachments](images/invoice-pdf-attachments.jpg)
![Invoices data](images/invoice-pdf-data.jpg)
![Invoices data example](images/invoice-pdf-data-example.jpg)
![Invoices paid](images/invoice-pdf-paid.jpg)
