---
title: Quotes
---

# Quotes screen

The **Quotes** screen allows you to **create, read, update, and delete (CRUD)** quote records.

:::info
Amounts and dates are formatted based on the configuration in the [Settings screen](./settings.md#localization--formatting) and the currency format defined in the [Currencies screen](./currencies.md).
:::

You can also:

- **Filter** quotes by various criteria
- **Export** quotes to XLSX
- **Preview** quotes live in PDF format
- **Customize** PDF appearance and layout
- **Export** quotes as PDF documents
- **Create Invoice from Quote** (generate an invoice directly from a quote, quote becomes closed, but can be manually opened again)
- **Duplicate Quote** to quickly create a similar quote

:::info
XLSX export does **not** include attachments or business logo snapshots.
:::

## Adding a Quote

Click the **Add** button at the bottom to open the right-hand pane, where you can enter quote details. If the [Presets screen](./presets.md) are enabled then you will have to choose either create new or from preset.

![Quote creation](images/quote-add-panel.jpg)

- **Required information:**
  - Currency
  - Language (Quote language for PDF labels which is independant from global application settings)
  - Business
  - Client (“Bill To”)
  - Quote information
  - At least one item

![Quote creation](images/quote-form.jpg)

Select a currency from the dropdown. The dropdown supports **search, filter, and sort** (see [Currencies screen](./currencies.md) for details).

:::info
The selected currency is saved as a snapshot. The snapshot is updated only when editing the quote and changing the currency.
:::

![Quote currency creation](images/quote-currency-selection.jpg)

Select a business from the dropdown. The dropdown supports **search, filter, and sort** (see [Businesses screen](./businesses.md) for details).

:::info
The selected business is saved as a snapshot. The snapshot is updated only when editing the quote and changing the business.
:::

![Quote business creation](images/quote-business-selection.jpg)

Select a client from the dropdown. The dropdown supports **search, filter, and sort** (see [Clients screen](./clients.md) for details).

To create a client without leaving the quote form, use the **Add** action in the client selector. Enter the required name and, optionally, a phone number; the new client is selected automatically after creation.

:::info
The selected client is saved as a snapshot. The snapshot is updated only when editing the quote and changing the client.
:::

![Quote client creation](images/quote-client-selection.jpg)

Select a style profile from the dropdown. The dropdown supports **search, filter, and sort** (see [Style profiles screen](./style-profiles.md) for details).

:::info
The selected style profile is saved as a snapshot. The snapshot is updated only when editing the quote and changing the style profile.

This section can be hidden if the feature is turned off in the settings. Customization can still be adjusted in preview mode.

Selecting a style profile only applies preset values. You can continue customizing everything afterward.
:::

![Quote style profile creation](images/quote-style-profile-selection.jpg)

Select a language from the dropdown. The dropdown supports **search**.

:::info
The selected language applies only to the generated PDF and is independent of the application's global language setting.
:::

![Quote language creation](images/quote-language-selection.jpg)

Enter the quote details, including:

- Quote number prefix
- Quote number suffix
- Quote number
- Issued date
- Due date

:::info

- The prefix and suffix are saved as a snapshot if they were configured on the [Settings screen](./settings.md#invoice--file-naming).
- You can also change or add them here, even if they were not configured in Settings.
- If configured, the prefix and suffix are always incorporated into the quote number automatically.

:::

![Quote information](images/quote-information.jpg)

Select a item from the dropdown and set quantity and unit price. The dropdown supports **search, filter, and sort** (see [Items screen](./items.md) for details).

:::info
The selected item is saved as a snapshot. The snapshot is updated only when editing the quote and changing the item.

When adding or editing an item in a quotation, a modal will appear requiring you to set the quantity and unit price. You can also define custom field data for the item, including a header, value, and alignment. Each unique custom header is added as a column in the PDF’s item table, and the corresponding value is placed in that column for the item. Alignment is configured per unique header. A header can be selected from the existing list or typed in as a new one (pressing Enter is required to register a new header). Both fields header and value must either be fully selected / entered or empty; otherwise, the Save button will remain disabled.
:::

![Quote item creation](images/quote-item-selection.jpg)
![Quote item quantity](images/quote-item-quantity.jpg)
![Quote item quantity](images/quote-item-quantity-custom-fields.jpg)

:::info
The items order can be changed by drag and drop.
:::

![Quote items order](images/quote-items-reorder.jpg)

Once all required information has been filled in, the quote can be saved.

![Quote item quantity](images/quote-saved.jpg)

Information on other pages is also updated to reflect the current quote count.

![Quote count](images/quote-count.jpg)

Additionally, you can set a **discount** (fixed amount or percentage-based).

![Quote discount none](images/quote-discount-none.jpg)
![Quote discount fixed](images/quote-discount-fixed.jpg)
![Quote discount percentage](images/quote-discount-percentage.jpg)
![Quote discount result](images/quote-discount-result.jpg)

Additionally, you can set a **surcharge** (fixed amount or percentage-based).

![Quote surcharge none](images/quote-surcharge-none.png)
![Quote surcharge fixed](images/quote-surcharge-fixed.png)
![Quote surcharge percentage](images/quote-surcharge-percentage.png)
![Quote surcharge result](images/quote-surcharge-result.png)

You can also configure **taxes** for the quote:

- **Total-based taxes**: inclusive, exclusive, or deducted
- **Per-item taxes**: inclusive or exclusive

![Quote none](images/quote-tax-none.jpg)
![Quote on total](images/quote-tax-on-total.jpg)
![Quote deducted](images/quote-tax-deducted.jpg)
![Quote per item](images/quote-tax-per-item.jpg)

Results:

![Quote on total inclusive](images/quote-tax-total-inclusive.jpg)
![Quote on total dedcuted](images/quote-tax-total-deducted-result.jpg)
![Quote on total exclusive](images/quote-tax-total-exclusive.jpg)
![Quote per item inclusive](images/quote-tax-per-item-inclusive.jpg)
![Quote per item exclusive](images/quote-tax-per-item-exclusive.jpg)

Additionally, you can set a **shipping fees** (fixed amount).

![Quote shipping fees](images/quote-shipping-fees.jpg)

Additionally, you can set a **notes** (customer notes, thank you note, terms & conditions note).

![Quote thank you notes](images/quote-thank-you-note.jpg)
![Quote customer notes](images/quote-customer-note.jpg)
![Quote terms & conditions notes](images/quote-terms-note.jpg)

Additionally, you can set a **signature** which can be set via hand/cursor or uploaded as image.

:::info
Maximum file size: 2 MB
:::

![Quote signature](images/quote-signature-draw.jpg)
![Quote signature](images/quote-signature-upload.jpg)

Additionally, you can attach **images**, which will be embedded into the PDF.

:::info
Maximum file size: 2 MB
:::

![Quote attachments](images/quote-attachments.jpg)

## Editing / Deleting a Quote

Once quotes are added, select one from the list to edit it on the right-hand pane. Each quote also displays:

- Quote data (Issued At)
- Quote status (Open, Closed)
- Client name
- Total amount
- Due date / Overdue information

![Quote list](images/quote-list.jpg)
![Quote status due today](images/quote-status-due-today.jpg)
![Quote status overdue](images/quote-status-overdue.jpg)

You can also:

- **Search quotes by quote number**
- **Delete a quote** by clicking the vertical dots menu → **Delete**

![Quote actions](images/quote-actions-menu.jpg)

## Filters

Quotes have filters to control what is displayed. By default:

- **Active**: shows all items except archived

The **archived flag** can be toggled during creation or editing. This flag only affects filtering and does not delete the quote.

Quotes have only **Open** and **Closed** statuses, so the status filter includes only these options.  
Client and business filters are based on **snapshot data** stored with the quote.
The **date filter** applies to the **Issued At** date.

![Quotes filters](images/quote-filters.jpg)

## Sorting

Quotes can be sorted by:

- Status
- Issued at date
- Quote number
- Last updated date

![Quotes sort](images/quote-sort.jpg)

## Export

Quotes can be exported **only to XLSX** format.

- Export all quote-related data to XLSX

:::info
Attachments and business logo snapshots are **not included** in the export.
:::

![Quotes import/export](images/quote-export.jpg)

## PDF Preview

- Quotes can be **previewed live** and **exported as PDF**.
- PDF customization is based on **predefined configuration options**.
- The **Paid watermark** is applied **only when the status is set to Paid**.
- The watermark is applied **across all pages** of the document.
- **Page numbers** are shown **only when the document has more than one page**.
- **Attachments** are embedded into the PDF when present.
- Sections with zero values (**Surcharge**, **Discount**, **Tax**, **Shipping fees**) are **hidden** in the PDF.
- **Save as Profile** button will create style profile item with these customization presets for futher usage on other quotes.

![Quotes customized option 1](images/quote-pdf-customization-1.jpg)
![Quotes customized option 2](images/quote-pdf-customization-2.jpg)
![Quotes customized option 3](images/quote-pdf-customization-3.jpg)
![Quotes customized option 4](images/quote-pdf-customization-4.jpg)
![Quotes PDF](images/quote-pdf-preview.jpg)
![Quotes PDF attachments](images/quote-pdf-attachments.jpg)
![Quotes data](images/quote-pdf-data.jpg)
![Quotes data example](images/quote-pdf-data-example.jpg)
