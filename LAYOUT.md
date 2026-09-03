# Invoice Layout JSON

Invoice Builder layouts describe the structure and order of an invoice PDF. A layout is a JSON document interpreted by the invoice renderer using the application's built-in PDF components.

Layouts are intentionally declarative and restricted. JSON can choose which supported content appears and how supported blocks are composed, but it cannot provide React code, arbitrary styles, custom fonts, labels, or page settings.

## How To Use A Layout

1. Open **Layouts** in the application.
2. Export an existing layout JSON or create a JSON file using the schema below.
3. Open a layout and use **Upload schema** to select the `.json` file.
4. Confirm that the read-only viewer shows the expected structure.
5. Save the layout.
6. Select the saved, non-archived layout in invoice customization under page setup.

The upload is validated before it replaces the displayed schema. Invalid JSON or unsupported properties are rejected. The maximum layout size is 64 KB.

An invoice stores a snapshot of the selected layout. Later changes to the saved layout do not change invoices that already have a snapshot.

## Top-Level Structure

```json
{
  "schemaVersion": 1,
  "meta": {
    "name": "My Layout",
    "description": "Optional description"
  },
  "sections": []
}
```

| Property           | Required | Description                                                            |
| ------------------ | -------- | ---------------------------------------------------------------------- |
| `schemaVersion`    | Yes      | Must be `1`.                                                           |
| `meta.name`        | Yes      | Non-empty layout name, up to 120 characters.                           |
| `meta.description` | No       | Optional description.                                                  |
| `sections`         | No       | Ordered list of invoice sections. Sections are rendered in this order. |

Only `schemaVersion`, `meta`, and `sections` are allowed at the top level. Each section type may occur at most once.

## Sections

Every section has this shape:

```json
{
  "type": "itemsTable",
  "visible": true
}
```

`visible` is required and accepts:

- `true`: always render the section.
- `false`: never render the section.
- `"auto"`: let the content component decide whether there is content to render. This is useful for optional notes, signatures, payment information, and watermarks.

The supported section types are:

### `watermark`

Renders the normal invoice watermark and, when applicable, the paid watermark. Optional `watermarkOrder` controls their order:

```json
{
  "type": "watermark",
  "visible": "auto",
  "watermarkOrder": "paidFirst"
}
```

Values are `"default"` or `"paidFirst"`. If omitted, the default order is used.

### `header`

Renders the header using recursive `blocks`. See [Header blocks](#header-blocks).

```json
{
  "type": "header",
  "visible": true,
  "blocks": [
    {
      "type": "row",
      "justify": "between",
      "children": [{ "type": "logo" }, { "type": "invoiceMeta", "showInvoiceLabel": true }]
    }
  ]
}
```

### `itemsTable`

Renders the invoice item table. Optional `columnSizing` accepts:

- `"fixedFlex"`: the standard fixed/flexible column behavior.
- `"proportional"`: proportional column widths used by the legacy-compatible layouts.

```json
{
  "type": "itemsTable",
  "visible": true,
  "columnSizing": "fixedFlex"
}
```

Column labels, colors, borders, fonts, and table styling come from invoice customization, not this JSON.

### `financialTotals`

Renders subtotal, discounts, taxes, shipping, total, paid, and balance due using the current invoice values and customization labels.

```json
{ "type": "financialTotals", "visible": true }
```

### `paymentInfo`

Renders payment information. With no extra property it uses the invoice bank snapshot.

```json
{ "type": "paymentInfo", "visible": "auto" }
```

Payment information can also be placed inside a header block or a `totalsRow`. Those locations support the optional `paymentSource` property:

- `"bank"`: use the invoice bank information and QR code.
- `"legacyBusiness"`: use the legacy business payment information.

### `totalsRow`

Renders several totals-related blocks in one horizontal row. Use `totalsBlocks` in the desired order:

```json
{
  "type": "totalsRow",
  "visible": true,
  "totalsBlocks": [
    { "type": "paymentInfo", "paymentSource": "legacyBusiness" },
    { "type": "spacer" },
    { "type": "financialTotals" }
  ]
}
```

Supported totals row blocks are `paymentInfo`, `financialTotals`, and `spacer`. A `spacer` consumes flexible space and is useful for pushing financial totals to the opposite side.

### `notes`

Renders customer notes and terms and conditions. Use `"auto"` to omit the section when both are empty.

```json
{ "type": "notes", "visible": "auto" }
```

### `signature`

Renders the signature image and authorised signatory information when available.

```json
{ "type": "signature", "visible": "auto" }
```

### `pageCounter`

Renders the page counter.

```json
{ "type": "pageCounter", "visible": true }
```

## Header Blocks

Header blocks can be nested only inside `row` and `column` blocks. This makes the header a small layout tree:

```text
row
├── column
│   ├── logo
│   └── businessInfo
└── invoiceMeta
```

Leaf block types are:

| Type           | Renders                                              |
| -------------- | ---------------------------------------------------- |
| `title`        | Invoice title.                                       |
| `logo`         | Business logo.                                       |
| `businessInfo` | Business name and contact information.               |
| `clientInfo`   | Client information.                                  |
| `invoiceMeta`  | Invoice number, dates, status, and related metadata. |
| `paymentInfo`  | Payment information.                                 |

Container block types:

- `row`: lays children out horizontally.
- `column`: lays children out vertically.

### Header block properties

| Property           | Supported values                             | Applies to                                        |
| ------------------ | -------------------------------------------- | ------------------------------------------------- |
| `children`         | Array of header blocks                       | `row`, `column` only.                             |
| `width`            | `"20%"`, `"40%"`, `"50%"`, `"60%"`, `"100%"` | Any block used in a row.                          |
| `align`            | `"start"`, `"center"`, `"end"`               | Header blocks.                                    |
| `justify`          | `"between"`                                  | Rows.                                             |
| `paddingTop`       | `10`, `20`                                   | Header blocks.                                    |
| `paddingBottom`    | `20`                                         | Header blocks.                                    |
| `gap`              | `5`, `10`                                    | Rows and columns.                                 |
| `boxed`            | `true` or `false`                            | Supported content blocks, commonly `invoiceMeta`. |
| `showTitle`        | `true` or `false`                            | `invoiceMeta`.                                    |
| `showInvoiceLabel` | `true` or `false`                            | `invoiceMeta`.                                    |
| `paymentSource`    | `"bank"`, `"legacyBusiness"`                 | `paymentInfo`.                                    |

`row` and `column` blocks must include a `children` array. Leaf blocks cannot include `children`.

## Complete Example

```json
{
  "schemaVersion": 1,
  "meta": {
    "name": "Two Column Invoice",
    "description": "Business and invoice details above the items table"
  },
  "sections": [
    {
      "type": "watermark",
      "visible": "auto",
      "watermarkOrder": "paidFirst"
    },
    {
      "type": "header",
      "visible": true,
      "blocks": [
        {
          "type": "row",
          "justify": "between",
          "paddingBottom": 20,
          "children": [
            {
              "type": "column",
              "width": "50%",
              "children": [{ "type": "logo" }, { "type": "businessInfo" }]
            },
            {
              "type": "column",
              "width": "50%",
              "align": "end",
              "children": [
                {
                  "type": "invoiceMeta",
                  "showTitle": true,
                  "showInvoiceLabel": true,
                  "boxed": true
                }
              ]
            }
          ]
        },
        {
          "type": "row",
          "paddingTop": 20,
          "children": [
            { "type": "clientInfo", "width": "50%" },
            { "type": "paymentInfo", "width": "50%", "paymentSource": "bank" }
          ]
        }
      ]
    },
    { "type": "itemsTable", "visible": true, "columnSizing": "fixedFlex" },
    { "type": "financialTotals", "visible": true },
    { "type": "notes", "visible": "auto" },
    { "type": "signature", "visible": "auto" },
    { "type": "pageCounter", "visible": true }
  ]
}
```

## What Layout JSON Controls

Layout JSON controls the invoice's structural composition:

- Which supported sections are included.
- The order in which sections appear in the PDF.
- Whether a section is always shown, hidden, or shown automatically when it has content.
- The order of the normal and paid watermarks.
- Whether the item table uses fixed/flexible or proportional column sizing.
- Which header content blocks appear: title, logo, business information, client information, invoice metadata, and payment information.
- Header composition through nested horizontal rows and vertical columns.
- Header block widths, alignment, spacing, optional boxed presentation, invoice title visibility, and invoice label visibility.
- Whether payment blocks use bank or legacy business payment information.
- The order of payment information, financial totals, and flexible spacing inside a `totalsRow`.

The JSON controls composition, not the underlying invoice data. The renderer still supplies the current business, client, item, payment, and totals values.

## What Layout JSON Does Not Control

The following remain outside the layout schema and are configured elsewhere in invoice customization or application settings:

- Translated labels and invoice text.
- Colors, fonts, font sizes, borders, and table styling.
- Page format, orientation, margins, and other page setup.
- Invoice data, business data, client data, and payment values.
- Thermal receipt printing.
- Arbitrary React components, JavaScript, HTML, or CSS.

## Validation Rules

The application rejects a layout when:

- The JSON is invalid or larger than 64 KB.
- `schemaVersion` is not `1`.
- `meta.name` is missing, empty, or longer than 120 characters.
- A property is not listed in this document.
- A section or block type is unsupported.
- A section is duplicated.
- A container has no valid `children` array.
- A block uses `children`, `paymentSource`, or another property in an unsupported location.
- An enum value such as `visible`, `width`, `align`, `columnSizing`, or `watermarkOrder` is invalid.

When adding new capabilities, the schema version and validator may be extended with a backwards-compatible field or a new version.
