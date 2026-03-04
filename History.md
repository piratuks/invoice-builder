# Invoice Builder

## 2026-03-04, version 2.4.2

Bug Fixes

- Fix for dirty confirmation after saves. It was still not stable as not always log the state of dirty
- Fix for PDF table columns. The sizes of columns will be more dynamic

## 2026-03-03, version 2.4.1

Bug Fixes

- Hotfix for dirty confirmation

## 2026-03-03, version 2.4.0

New features & improvements

- Improved creation from presets. Showing searchable presets right away instead of opening new modal
- Implemented confirmation for dirty records before leaving the page and before selecting a different item
- Implemented persistent filters / search / sort

## 2026-03-02, version 2.3.0

New features & improvements

- Official Docker prebuilt image published
- UBL Peppol XML support: download embedded XML alongside the PDF, or as a standalone XML file

Bug Fixes

- Fixed an issue where incorrect financial totals were shown when using both discounts and per-item taxes. Previously, taxes were calculated before applying the discount in this scenario. The system now correctly allocates the discount first and then calculates taxes on the adjusted item amounts

## 2026-03-01, version 2.2.2

Bug Fixes

- Fixed an issue that could prevent invoice creation when using docker and not providing "Bank"

## 2026-02-28, version 2.2.1

Bug Fixes

- Fixed an issue that could prevent invoice creation when using presets that include a style profile without a default font family set

## 2026-02-23, version 2.2.0

New features & improvements

- Updated signature representation and added a customizable "Authorised signatory" label
- Loosened bank "Account number" validation to support various international formats
- Added "Account Holder" and "Sort Code / Sort Order" fields, which are now included in the PDF if provided.
- Introduced a new Presets menu item, allowing users to predefine Invoice/Quote data
- Reorganized navigation: Presets and Style Profiles are now grouped under a new Templates section

## 2026-02-19, version 2.1.1

Bug Fixes

- Hotfix for customization dropdown. Removing visible overlay when dropdown is open
- Fixing "Bordered" table layout. Some borders were overlapping

## 2026-02-19, version 2.1.0

New features & improvements

- Automatically prefill issue date
- Automatically prefill invoice numbers
- Font family selection added. Supported fonts: Helvetica, Times-Roman, Courier, Roboto, Inter
- Ability to customize invoice / quote labels to custom text

## 2026-02-13, version 2.0.2

Bug Fixes

- Fixed an issue where invoice modals could render behind other UI elements due to an incorrect `z-index`

## 2026-02-12, version 2.0.0

New features & improvements

- Added dedicated VAT fields for both businesses and clients
- Introduced validations for custom header sections (now visible in the UI)
- Implemented pre‑filling of custom header section data from the last used configuration when selecting an existing one (including sort order and alignment)
- Added a tooltip explaining why the Save button is disabled when an invoice or quote is invalid
- Added a visual "\*" indicator to highlight required fields in invoices and quotes
- Added collapsible sections to the main menu, allowing related items to be grouped for a cleaner and more organized navigation experience
- Introduced Banks as the new source of payment information - breaking change:
  - The previous Business → PaymentInformation field is now considered legacy and becomes read‑only
  - Invoices and quotes created prior to this release will continue using the legacy field to preserve existing data; these documents will also retain the legacy Classic, Modern, Compact layouts
  - All newly created invoices and quotes must use the new Banks payment information structure

Bug Fixes

- Fixed an issue where the Save button appeared active for empty invoices/quotes

## 2026-02-09, version 1.7.0

New features & improvements

- PostgreSQL support added. Users can now choose between a local SQLite database file or connecting to a PostgreSQL server.
- Custom header sections are reused per invoices/quotes
- Added the ability to reorder invoice item table columns, including custom fields, via drag-and-drop. Users can now fully customize the column order in the invoice table, and the changes are reflected in both the UI and exported PDFs.
- Customization layout improvements

Bug Fixes

- Fixed an issue that prevented the “Forget recent databases” action from clearing the full list. Previously, it would forget entries only up to the last one, leaving the final database entry undeleted.
- Fixed a problem that caused invoice creation to fail when a custom field was included during creation.
- Corrected styling inconsistencies where custom field values were incorrectly using table header formatting.

## 2026-02-04, version 1.6.0

New features & improvements

- Added Docker support for seamless self‑hosting and deployment flexibility
- Separated snapshot data into dedicated tables to reduce invoice‑table complexity and improve maintainability
- Added the ability to show quantity, unit, and row number in the PDF item table
- Added support for custom header sections and custom values in the PDF item table

Bug Fixes

- Resolved an issue where style profiles created from the PDF live preview were not being populated correctly

## 2026-01-29, version 1.5.0

New features & improvements

- Technical depth has been removed to simplify the customization workflow
- Style profiles are now available for invoices and quotes, enabling quick, consistent theming.

## 2026-01-28, version 1.4.0

New features & improvements

- Signature can be either uploaded or drawn. Previously it was only possible to draw.
- Simplified DataURL generation by replacing fromUint8Array with the unified uint8ArrayToDataUrl API.

Bug Fixes

- Fixed issues with report filters where some presets (e.g. This Year, This Quarter) were limited to the current date instead of the full period.
- Fixed a potential error when resizing the invoice builder inside the signature modal.
- Fixed an issue where very large image attachments were being cut off during upload, even when scrolling was enabled.

## 2026-01-22, version 1.3.0

New features & improvements

- Added German language support
- Improved Reporting UI (currency selection dropdown instead of listing all currencies)
- Added the ability to apply a handwritten signature to PDF invoices

Bug Fixes

- Fixed an issue with Invoice Excel export

## 2026-01-12, version 1.2.1

Bug Fixes

- Fixed macOS build.

## 2026-01-08, version 1.2.0

Bug Fixes

- Fixed incorrect translations under the Invoice Status filter.
- Fixed Quantity field error not showing the correct value.
- Fixed Shipping Fees field error not showing the correct value.
- Fixed Closed state incorrectly showing overdue status.
- Fixed Normal watermark not appearing on attachments.
- Fixed Legend in reporting: vertical layout now fits when there are many items.
- Fixed Attachments layout to wrap correctly.
- Fixed Date fields: allow removing value if not required; delete keyboard button no longer triggers errors.
- Fixed Import/Export JSON functionality.
- Fixed Report aggregation to respect date filter.
- Fixed layout issue for invoices on smaller screens.

UX / Interaction Improvements

- Delete now deselects the previous item and shows the correct selection.
- Add New immediately selects the new item after saving.
- Duplicate invoices/quotes now select the newly created item automatically.
- Reports: custom dates are now required.
- Add new items appear at the top instead of the bottom of the list.
- Delete shows a confirmation prompt.
- First screen scroll style is now consistent across all pages.
- Date fields now allow selecting month, similar to year selection.

Functional Updates

- Invoice uniqueness now enforced on: (business ID, and invoice number combined with suffix and prefix).
- Renamed Invoice Number Suffix and Prefix Snapshot columns to clarify they are not snapshots.
- Ghost data cleanup.
- Invoice/Quote translations now allow selecting a language, instead of always using settings language.

Performance / Reporting

- Reports performance improved.

## 2026-01-07, version 1.1.4

Bug Fixes

- Fixed the More Actions dropdown so it hides after an action is selected
- Fixed the Delete action to deselect the previously selected (deleted) item

## 2026-01-07, version 1.1.3

Bug Fixes

- Fixed attachment URL issue.
- Fixed image remove icon visibility over the crop modal (z-index issue).
- Fixed crop modal to allow changing the aspect ratio.
- Stabilized pdf preview to ensure consistent attachment display in PDFs.

## 2026-01-07, version 1.1.2

Bug Fixes

- Export pdf which is empty contained undefined parts in the file name
- Overdue showed always even on paid
- Duplicating was setting issuedAt as current date instead of copying it
- Corrected reporting calculations to properly respect selected date range filters

## 2026-01-06, version 1.1.1

PDF Preview Bug Fixes

- Fixed a UI issue that caused a break when adding a new invoice in preview mode with a logo present.

## 2026-01-06, version 1.1.0

New features & improvements

- Added French language support (translations provided by the community)
- Quantity now supports decimal values (up to 3 decimal places)
- macOS support
- Partial payment status fix - invoices and quotes no longer remain marked as “partial” after all payments are removed.

## 2026-01-02, version 1.0.7

PDF Preview Bug Fixes & Improvements

- Fixed an issue where the Payment Information label did not respond correctly to the upper/lower case toggle
- Added missing translations for the Lithuanian (LTU) language
- Improved the look and feel of layout options for a more consistent user experience
- Watermark, Paid Watermark, Attachments, and Business Logo are now correctly included in the generated PDF files. (Previously, these elements were visible only in the live preview)

## 2025-12-30, version 1.0.5

Initial release with the following functionality

- Create and manage Invoices and Quotes
- Full offline-first operation with local SQLite database
- Business, Client, Item, Category, Unit, and Currency management
- Multi-currency support per invoice/quote
- Discounts (fixed & percentage), shipping fees, and flexible tax options
- Partial payments and balance tracking
- PDF generation with live preview and customization (layout, colors, fonts, logo size)
- Attachments support in PDFs
- XLSX import/export for most entities
- Full database backup & restore
- Export all data to JSON
- Reports with aggregated data and charts
- Light & dark mode
- Language support: English & Lithuanian
- Customizable numbering, formatting, and file naming
- Windows & Linux builds
- Invoice/Quote state tracking (unpaid, partially paid, paid, closed; quote open/closed)
- Automatic snapshotting of business, client, item, and currency data for historical accuracy
