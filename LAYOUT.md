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

Ready-made layout examples, including V2 region, sidebar, nested-header, and receipt-style compositions, are available in [`examples/layouts`](examples/layouts).

The Layouts Visual tab can edit both V1 and V2 schemas. The JSON tab is a read-only inspection view; use **Upload schema** to replace a layout with validated JSON. Visual edits support undo and redo, and Preview mode renders a representative invoice through the same PDF interpreter used by invoice and quote output.

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

## V2 Page Regions

V2 layouts compose the complete page from explicit regions. V2 keeps content types whitelisted and continues to use invoice customization for fonts, colors, labels, table styles, and page format.

```json
{
  "schemaVersion": 2,
  "meta": { "name": "Sidebar invoice" },
  "orientation": "landscape",
  "regions": [
    {
      "id": "sidebar",
      "width": "30%",
      "direction": "column",
      "blocks": [{ "type": "logo" }, { "type": "businessInfo" }, { "type": "paymentInfo" }]
    },
    {
      "id": "main",
      "width": "70%",
      "direction": "column",
      "sections": ["header", "itemsTable", "financialTotals", "notes"]
    }
  ]
}
```

| Property             | Required    | Description                                                                                                                                                                                                                                                  |
| -------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `schemaVersion`      | Yes         | Must be `2`.                                                                                                                                                                                                                                                 |
| `meta.name`          | Yes         | Non-empty layout name, up to 120 characters.                                                                                                                                                                                                                 |
| `meta.description`   | No          | Optional description.                                                                                                                                                                                                                                        |
| `orientation`        | No          | `portrait` or `landscape`; defaults to the selected page format orientation.                                                                                                                                                                                 |
| `regions`            | Yes         | Ordered page regions. Each region must have unique `id`, a supported percentage `width`, and `direction` of `row`, `column`, or `grid`. Supported region widths are `20%`, `25%`, `30%`, `35%`, `40%`, `50%`, `60%`, `65%`, `70%`, `75%`, `80%`, and `100%`. |
| `regions[].gap`      | No          | Optional spacing after the region, `5` or `10`.                                                                                                                                                                                                              |
| `regions[].blocks`   | Conditional | A whitelisted header-block tree. A region cannot define both `blocks` and `sections`.                                                                                                                                                                        |
| `regions[].sections` | Conditional | References to supported invoice sections. Each section may be referenced only once across the layout.                                                                                                                                                        |

- `regions[].children` is a recursive list of `row`, `column`, `grid`, `block`, or `section` nodes. Use `section` nodes for per-region section settings.
- `regions[].overflow` is either `continue` or `keepTogether`.
- `regions[].gap` accepts `5` or `10` and adds spacing after the region when rendered beside another region.

For V2, region widths must total no more than 100%. Use `children` when a region needs nested rows, columns, grids, or per-section configuration. A region must use exactly one content form: `blocks`, `sections`, or `children`.

When a V1 layout is upgraded through the Visual Builder, its sections are preserved as section nodes inside one `main` V2 region. V2-only features such as regions, grids, orientation, and overflow then become available; downgrading V2 back to V1 is not supported.

```json
{
  "type": "row",
  "children": [
    { "type": "block", "block": { "type": "logo" } },
    { "type": "section", "section": { "type": "itemsTable", "visible": true, "columnSizing": "proportional" } }
  ]
}
```

Regions with `continue` flow across pages, while `keepTogether` requests a single region placement when the PDF renderer has enough space. Item-table headers repeat on continuation pages and individual item rows remain together. Financial and payment sections are kept together. Unsupported properties, executable content, duplicate region IDs, invalid widths, oversized combined widths, unsupported blocks, and duplicate sections are rejected before saving.

For a configured section, use a `section` node:

```json
{
  "type": "section",
  "section": {
    "type": "totalsRow",
    "visible": true,
    "totalsBlocks": [{ "type": "financialTotals" }, { "type": "spacer" }]
  }
}
```

## Visual Builder Dropdowns

The Visual tab exposes the same values accepted by the schema validator. The labels below describe the controls shown while editing a V2 layout:

| Visual control        | Values                                                                                                                  | Meaning                                                                                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Orientation           | `portrait`, `landscape`                                                                                                 | Selects the PDF page orientation for the V2 composition. `Default` leaves orientation unset so the selected page format supplies it.                                          |
| Region width          | `20%`, `25%`, `30%`, `35%`, `40%`, `50%`, `60%`, `65%`, `70%`, `75%`, `80%`, `100%`                                     | The region's share of the page width. Combined region widths cannot exceed `100%`.                                                                                            |
| Region direction      | `row`, `column`, `grid`                                                                                                 | `row` lays children horizontally, `column` lays children vertically, and `grid` lays children horizontally with wrapping.                                                     |
| Region gap            | `5`, `10`                                                                                                               | Adds supported spacing after the region. The empty/default choice leaves the region gap unset.                                                                                |
| Region overflow       | `continue`, `keepTogether`                                                                                              | `Wrap` leaves the default flowing behavior. `continue` allows the region to flow across pages; `keepTogether` requests that the region stay together when space allows.       |
| Section visibility    | `true`, `false`, `auto`                                                                                                 | `Visible` always renders the section, `Hidden` suppresses it, and `auto` lets the section decide whether it has content.                                                      |
| Section alignment     | `start`, `center`, `end`                                                                                                | Controls the supported horizontal alignment of section output, currently used by `financialTotals`. The empty/default choice leaves alignment unset.                          |
| Watermark order       | `default`, `paidFirst`                                                                                                  | `Default` uses the normal watermark order. `paidFirst` places the paid watermark before the normal watermark when applicable.                                                 |
| Table sizing          | `fixedFlex`, `proportional`                                                                                             | `Table default` leaves the section's sizing unset. `fixedFlex` uses the standard fixed/flexible columns; `proportional` uses proportional column widths.                      |
| Header block          | `title`, `logo`, `businessInfo`, `clientInfo`, `invoiceMeta`, `paymentInfo`                                             | Adds the selected header content block. The builder does not add an unspecified block type automatically.                                                                     |
| Structural node       | `row`, `column`, `grid`                                                                                                 | Adds a recursive composition node. Structural nodes can contain additional nodes.                                                                                             |
| Section node          | `watermark`, `header`, `itemsTable`, `financialTotals`, `paymentInfo`, `totalsRow`, `notes`, `signature`, `pageCounter` | Adds the selected invoice section as a V2 node. Section types already used anywhere in the layout are removed from the palette because each section type may occur only once. |
| Block width           | `20%`, `40%`, `50%`, `60%`, `100%`                                                                                      | Sets a header block's width within a row. The empty/default choice leaves width unset.                                                                                        |
| Block alignment       | `start`, `center`, `end`                                                                                                | Aligns the block's content within its available space.                                                                                                                        |
| Gap                   | `5`, `10`                                                                                                               | Sets the spacing between children. The empty/default choice leaves the schema property unset.                                                                                 |
| Padding               | `paddingTop`: `10`, `20`; `paddingBottom`: `20`                                                                         | Adds supported spacing before or after a header block. Empty choices leave the property unset.                                                                                |
| Payment source        | `bank`, `legacyBusiness`                                                                                                | Chooses the bank snapshot or legacy business payment information for a payment block.                                                                                         |
| Justification         | `between`                                                                                                               | Places row children with space between them. The empty/default choice leaves justification unset.                                                                             |
| Boolean block options | `boxed`, `showTitle`, `showInvoiceLabel`: enabled or disabled                                                           | Writes `true` or `false` for the selected supported presentation property. The empty/default choice leaves it unset.                                                          |

Region IDs are editable inline and must be unique and non-empty. Adding a region uses the lowest available generated ID such as `region-1`; the semantic `main` ID is reserved for the V1-to-V2 upgrade. Invalid or duplicate values are rejected before saving.

Header blocks are reusable composition elements. The same `logo`, `businessInfo`, `clientInfo`, `invoiceMeta`, or `paymentInfo` block may appear more than once when the page composition needs it. Repeating a block renders the corresponding invoice content again; it does not duplicate the underlying invoice data. This differs from invoice section types, which are unique across a layout.

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

Sections may also define `align` with `"start"`, `"center"`, or `"end"`. This currently affects `financialTotals`; other section types ignore it.

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
Optional `align` controls the horizontal placement and text alignment of the financial summary: `"start"`, `"center"`, or `"end"`. The default is `"end"`.

```json
{ "type": "financialTotals", "visible": true, "align": "start" }
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
- Page format, margins, and other page setup. V2 may select `portrait` or `landscape` orientation for its composition.
- Invoice data, business data, client data, and payment values.
- Thermal receipt printing.
- Arbitrary React components, JavaScript, HTML, or CSS.

## Validation Rules

The application rejects a layout when:

- The JSON is invalid or larger than 64 KB.
- `schemaVersion` is not `1` or `2`.
- `meta.name` is missing, empty, or longer than 120 characters.
- A property is not listed in this document.
- A section or block type is unsupported.
- A section is duplicated.
- A container has no valid `children` array.
- A block uses `children`, `paymentSource`, or another property in an unsupported location.
- An enum value such as `visible`, `width`, `align`, `columnSizing`, or `watermarkOrder` is invalid.
- A V2 region has invalid content ownership, duplicate region IDs, unsupported overflow behavior, or region widths totaling more than 100%.
- A V2 recursive node has an unsupported type, invalid children, invalid spacing, nesting deeper than 12 levels, or a total layout node count above 500.

When adding new capabilities, the schema version and validator may be extended with a backwards-compatible field or a new version.
