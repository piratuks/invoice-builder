# Invoice Builder Tutorial

> 💡 **Note:** The interface is fully responsive and works well on resizable windows, making it suitable for users on Linux tiling window managers, small screens, or any desktop setup.

## Database creation screen

The first screen of the application lets you choose how you want to work with your database.
You can either create/open a local database file or connect to a database server.

### Local database

Recently opened databases are displayed in a **quick access list** for faster reopening.

![First screen](tutorial/initial_screen.jpg)

When the application runs in Docker or the web version, databases are created inside a predefined folder. All databases in that folder are automatically listed in Quick Access.
To remove a database from the Quick Access list, simply delete it from that folder.
During creation, you will be prompted to enter the database name.

![First screen](tutorial/initial_screen_web.jpg)
![First screen](tutorial/initial_screen_naming_web.jpg)

### Server database

Recently used server connections also appear in a Quick Access list for faster reconnecting.
For security reasons, passwords are never saved, so you will always need to re-enter the password when reconnecting.
On the connection screen, you can:

- Enter server connection details
- Test the connection
- Save the connection (without password) for quick access

![First screen](tutorial/connection.jpg)
![First screen](tutorial/server_connections.jpg)
![First screen](tutorial/password_enter.jpg)

## Settings screen

The **Settings** screen allows you to configure application behavior, manage data, and customize document output.

### General & Data Management

From this screen you can:

- Enable or disable optional layouts (**Presets**, **Style profiles**, **Quotes** and **Reports**)
- Enable or disable optional features (**UBL 2.1**)
- Export all application data to **JSON**
- Import previously exported data
- Access project resources:
  - GitHub repository
  - Issue tracker
  - Tutorial
  - Project homepage
  - Privacy Policy
  - Terms of Use
- Check for application updates via GitHub Releases (Available only for native software version)

![Look and feel](tutorial/settings_page_3.jpg)

### Localization & Formatting

You can customize:

- Application language
- Number (amount) formatting
- Date formatting

![Language and format](tutorial/settings_page_1.jpg)

### Invoice & File Naming

The following options are available:

- Customize invoice and quote numbers using:
  - Prefix
  - Suffix
- Customize exported PDF file names

By default, files are named: "{Invoice|Quote}\_{InvoiceNumber}.pdf"

You can optionally include:

- Year
- Month
- Business name

![Customize invoice](tutorial/settings_page_2.jpg)

## Businesses screen

The **Businesses** screen allows you to **create, read, update, and delete (CRUD)** business data.

You can also:

- **Filter** businesses by various criteria
- **Import** and **export** businesses via XLSX
  > 💡 **Note:** XLSX import/export does **not** include business logo data.

### Adding a Business

Click the **Add** button at the bottom to open a modal where you can:

- Enter business information
- Upload a logo (crop and adjust as needed)
  > ⚠️ Maximum file size: 2 MB

![Businesses creation](tutorial/businesses_page_1.jpg)

### Editing/Deleting a Business

Once businesses are added, select one from the list to edit it on the right side. Each business item also shows:

- Number of invoices created
- Number of quotes created (hidden if the layout is disabled in settings)

You can also:

- **Search businesses by name**
- **Delete a business** by clicking the red trash icon

![Businesses list](tutorial/businesses_page_2.jpg)

### Filters

Businesses have filters to control what is displayed. By default:

- **Active**: shows all businesses except archived

The **archived flag** can be toggled during creation or editing. This flag only affects filtering and does not delete the business.

![Businesses filters](tutorial/businesses_page_3.jpg)

### Sorting

Businesses can be sorted by:

- Name
- Last updated date

![Businesses sort](tutorial/businesses_page_4.jpg)

### Import & Export

You can:

- Export businesses to XLSX
- Import businesses from XLSX
- Download a XLSX template for business import

![Businesses import/export](tutorial/businesses_page_5.jpg)

## Banks screen

The **Banks** screen allows you to **create, read, update, and delete (CRUD)** bank data.

You can also:

- **Filter** banks by various criteria
- **Import** and **export** banks via XLSX
  > 💡 **Note:** XLSX import/export does **not** include bank qr code data.

### Adding a Bank

Click the **Add** button at the bottom to open a modal where you can:

- Enter bank information
- Upload a QR code (crop and adjust as needed)
  > ⚠️ Maximum file size: 2 MB

![Banks creation](tutorial/banks_page_1.jpg)

### Editing/Deleting a Bank

Once banks are added, select one from the list to edit it on the right side. Each bank item also shows:

- Number of invoices created
- Number of quotes created (hidden if the layout is disabled in settings)

You can also:

- **Search banks by name**
- **Delete a bank** by clicking the red trash icon

![Banks list](tutorial/banks_page_2.jpg)

### Filters

Banks have filters to control what is displayed. By default:

- **Active**: shows all banks except archived

The **archived flag** can be toggled during creation or editing. This flag only affects filtering and does not delete the bank.

![Banks filters](tutorial/banks_page_3.jpg)

### Sorting

Banks can be sorted by:

- Name
- Last updated date

![Banks sort](tutorial/banks_page_4.jpg)

### Import & Export

You can:

- Export banks to XLSX
- Import banks from XLSX
- Download a XLSX template for bank import

![Banks import/export](tutorial/banks_page_5.jpg)

## Presets screen

The **Presets** screen allows you to **create, read, update, and delete (CRUD)** preset data.

You can also:

- **Filter** presets by various criteria
- **Import** and **export** presets via XLSX

### Adding a Preset

Click the **Add** button at the bottom to open a modal where you can:

- Enter preset information

![Presets creation](tutorial/presets_page_1.jpg)

### Editing/Deleting a Preset

Once presets are added, select one from the list to edit it on the right side.

You can also:

- **Search presets by name**
- **Delete a preset** by clicking the red trash icon

![Presets list](tutorial/presets_page_2.jpg)

### Filters

Presets have filters to control what is displayed. By default:

- **Active**: shows all presets except archived

The **archived flag** can be toggled during creation or editing. This flag only affects filtering and does not delete the preset.

![Presets filters](tutorial/presets_page_3.jpg)

### Sorting

Presets can be sorted by:

- Name
- Last updated date

![Presets sort](tutorial/presets_page_4.jpg)

### Import & Export

You can:

- Export presets to XLSX
- Import presets from XLSX
- Download a XLSX template for preset import

![Presets import/export](tutorial/presets_page_5.jpg)

## Clients screen

The **Clients** screen allows you to **create, read, update, and delete (CRUD)** client data. You can also **filter**, **import**, and **export** clients via XLSX.

### Adding a Client

Click the **Add** button at the bottom to open a modal where you can:

- Enter client information

![Clients creation](tutorial/clients_page_1.jpg)

### Editing/Deleting a Client

Once clients are added, select one from the list to edit it on the right side. Each client item also shows:

- Number of invoices created
- Number of quotes created (hidden if the layout is disabled in settings)

You can also:

- **Search clients by name**
- **Delete a client** by clicking the red trash icon

![Clients list](tutorial/clients_page_2.jpg)

### Filters

Clients have filters to control what is displayed. By default:

- **Active**: shows all clients except archived

The **archived flag** can be toggled during creation or editing. This flag only affects filtering and does not delete the client.

![Clients filters](tutorial/clients_page_3.jpg)

### Sorting

Clients can be sorted by:

- Name
- Last updated date

![Clients sort](tutorial/clients_page_4.jpg)

### Import & Export

You can:

- Export clients to XLSX
- Import clients from XLSX
- Download a XLSX template for client import

![Clients import/export](tutorial/clients_page_5.jpg)

## Categories screen

The **Categories** screen allows you to **create, read, update, and delete (CRUD)** category data. You can also **filter**, **import**, and **export** categories via XLSX.

### Adding a Category

Click the **Add** button at the bottom to open a modal where you can:

- Enter category information
  > 💡 **Note:** Category names must be unique. You cannot create two categories with the same name.

![Categories creation](tutorial/categories_page_1.jpg)

### Editing/Deleting a Category

Once categories are added, select one from the list to edit it on the right side. Each category item also shows:

- Number of invoices created
- Number of quotes created (hidden if the layout is disabled in settings)

You can also:

- **Search categories by name**
- **Delete a category** by clicking the red trash icon

![Categories list](tutorial/categories_page_2.jpg)

### Filters

Categories have filters to control what is displayed. By default:

- **Active**: shows all categories except archived

The **archived flag** can be toggled during creation or editing. This flag only affects filtering and does not delete the category.

![Categories filters](tutorial/categories_page_3.jpg)

### Sorting

Categories can be sorted by:

- Name
- Last updated date

![Categories sort](tutorial/categories_page_4.jpg)

### Import & Export

You can:

- Export categories to XLSX
- Import categories from XLSX
- Download a XLSX template for category import

![Categories import/export](tutorial/categories_page_5.jpg)

## Units screen

The **Units** screen allows you to **create, read, update, and delete (CRUD)** unit data. You can also **filter**, **import**, and **export** units via XLSX.

### Adding a Unit

Click the **Add** button at the bottom to open a modal where you can:

- Enter unit information
  > 💡 **Note:** Unit names must be unique. You cannot create two units with the same name.

![Units creation](tutorial/units_page_1.jpg)

### Editing/Deleting a Unit

Once units are added, select one from the list to edit it on the right side. Each unit item also shows:

- Number of invoices created
- Number of quotes created (hidden if the layout is disabled in settings)

You can also:

- **Search units by name**
- **Delete a unit** by clicking the red trash icon

![Units list](tutorial/units_page_2.jpg)

### Filters

Units have filters to control what is displayed. By default:

- **Active**: shows all units except archived

The **archived flag** can be toggled during creation or editing. This flag only affects filtering and does not delete the unit.

![Units filters](tutorial/units_page_3.jpg)

### Sorting

Units can be sorted by:

- Name
- Last updated date

![Units sort](tutorial/units_page_4.jpg)

### Import & Export

You can:

- Export units to XLSX
- Import units from XLSX
- Download a XLSX template for unit import

![Units import/export](tutorial/units_page_5.jpg)

## Currencies screen

The **Currencies** screen allows you to **create, read, update, and delete (CRUD)** currency data. You can also **filter**, **import**, and **export** currencies via XLSX.

### Adding a Currency

Click the **Add** button at the bottom to open a modal where you can:

- Enter currency information
  > 💡 **Note:** Currency symbols must be unique. You cannot create two currencies with the same symbol.  
  > 💡 **Subunit:** Defines how many subunits make up one unit of the currency.  
  > For example:
  >
  > - USD and EUR: 100 subunits = 1 USD/EUR
  > - Japanese Yen (JPY): 1 subunit = 1 JPY

![Currencies creation](tutorial/currencies_page_1.jpg)

### Editing/Deleting a Currency

Once currencies are added, select one from the list to edit it on the right side. Each currency item also shows:

- Number of invoices created
- Number of quotes created (hidden if the layout is disabled in settings)

You can also:

- **Search currencies by text**
- **Delete a currency** by clicking the red trash icon

![Currencies list](tutorial/currencies_page_3.jpg)

### Filters

Currencies have filters to control what is displayed. By default:

- **Active**: shows all currencies except archived

The **archived flag** can be toggled during creation or editing. This flag only affects filtering and does not delete the currency.

![Currencies filters](tutorial/currencies_page_2.jpg)

### Sorting

Currencies can be sorted by:

- Text
- Last updated date

![Currencies sort](tutorial/currencies_page_4.jpg)

### Import & Export

You can:

- Export currencies to XLSX
- Import currencies from XLSX
- Download a XLSX template for currency import

![Currencies import/export](tutorial/currencies_page_5.jpg)

## Items screen

The **Items** screen allows you to **create, read, update, and delete (CRUD)** item data. You can also **filter**, **import**, and **export** items via XLSX.

### Adding a Item

Click the **Add** button at the bottom to open a modal where you can:

- Enter item information
  > 💡 **Note:** The item amount is always recorded in the selected currency. The currency is attached once when the item is added to a quote or invoice. Changing the quote/invoice currency will **not** automatically convert existing item amounts.

![Items creation](tutorial/items_page_1.jpg)

### Editing/Deleting a Item

Once items are added, select one from the list to edit it on the right side. Each item also shows:

- Number of invoices created
- Number of quotes created (hidden if the layout is disabled in settings)

You can also:

- **Search items by name**
- **Delete a item** by clicking the red trash icon

![Items list](tutorial/items_page_2.jpg)

### Filters

Items have filters to control what is displayed. By default:

- **Active**: shows all items except archived

The **archived flag** can be toggled during creation or editing. This flag only affects filtering and does not delete the item.

![Items filters](tutorial/items_page_3.jpg)

### Sorting

Items can be sorted by:

- Name
- Last updated date

![Items sort](tutorial/items_page_4.jpg)

### Import & Export

You can:

- Export items to XLSX
- Import items from XLSX
- Download a XLSX template for item import

> 💡 **Note:** When importing items from XLSX, if a unit or category name is provided and does not already exist in the system, it will be automatically created.

![Items import/export](tutorial/items_page_5.jpg)

## Style profiles screen

The **Style profiles** screen allows you to **create, read, update, and delete (CRUD)** style profiles data, which can be later used in **Invoice** | **Quote**. You can also **filter**, **import**, and **export** style profiles via XLSX.

### Adding a Style profile

Click the **Add** button at the bottom to open a modal where you can:

- Enter style profile information
  > 💡 **Name:** must be unique. You cannot create two style profiles with the same name.
  > 💡 **Sort Order:** under "Table" tab its possible to customize sort order of generic item table headers.

![Style profile creation](tutorial/style_profiles_page_1_1.jpg)
![Style profile creation](tutorial/style_profiles_page_1_2.jpg)
![Style profile creation](tutorial/style_profiles_page_1_3.jpg)
![Style profile creation](tutorial/style_profiles_page_1_4.jpg)

### Editing/Deleting a Style profile

Once style profiles are added, select one from the list to edit it on the right side. Each style profile item also shows:

- Number of invoices created
- Number of quotes created (hidden if the layout is disabled in settings)

You can also:

- **Search style profiles by name**
- **Delete a style profile** by clicking the red trash icon

![Style profiles list](tutorial/style_profiles_page_3.jpg)

### Filters

Style profiles have filters to control what is displayed. By default:

- **Active**: shows all style profiles except archived

The **archived flag** can be toggled during creation or editing. This flag only affects filtering and does not delete the style profile.

![Style profiles filters](tutorial/style_profiles_page_2.jpg)

### Sorting

Style profiles can be sorted by:

- Name
- Last updated date

![Style profiles sort](tutorial/style_profiles_page_4.jpg)

### Import & Export

You can:

- Export style profiles to XLSX
- Import style profiles from XLSX
- Download a XLSX template for currency import

![Style profiles import/export](tutorial/style_profiles_page_5.jpg)

## Quotes screen

The **Quotes** screen allows you to **create, read, update, and delete (CRUD)** quote records.

> 💡 **Note:** Amounts and dates are formatted based on the configuration in the [Settings screen](#settings-screen) and the currency format defined in the [Currency screen](#currencies-screen).

You can also:

- **Filter** quotes by various criteria
- **Export** quotes to XLSX
  > 💡 **Note:** XLSX export does **not** include attachments or business logo snapshots.
- **Preview** quotes live in PDF format
- **Customize** PDF appearance and layout
- **Export** quotes as PDF documents
- **Create Invoice from Quote** (generate an invoice directly from a quote, quote becomes closed, but can be manually opened again)
- **Duplicate Quote** to quickly create a similar quote

### Adding a Quote

Click the **Add** button at the bottom to open the right-hand pane, where you can enter quote details. If [Presets screen](#presets-screen) are enabled then you will have to choose either create new or from preset.

![Quote creation](tutorial/quote_page_111.jpg)

- **Required information:**
  - Currency
  - Language (Quote language for PDF labels which is independant from global application settings)
  - Business
  - Client (“Bill To”)
  - Quote information
  - At least one item

![Quote creation](tutorial/quote_page_1.jpg)

Select a currency from the dropdown. The dropdown supports **search, filter, and sort** (see [Currencies screen](#currencies-screen) for details).

> 💡 **Note:** The selected currency is saved as a snapshot. The snapshot is updated only when editing the quote and changing the currency.

![Quote currency creation](tutorial/quote_page_2.jpg)

Select a business from the dropdown. The dropdown supports **search, filter, and sort** (see [Businesses screen](#businesses-screen) for details).

> 💡 **Note:** The selected business is saved as a snapshot. The snapshot is updated only when editing the quote and changing the business.

![Quote business creation](tutorial/quote_page_3.jpg)

Select a client from the dropdown. The dropdown supports **search, filter, and sort** (see [Clients screen](#clients-screen) for details).

> 💡 **Note:** The selected client is saved as a snapshot. The snapshot is updated only when editing the quote and changing the client.

![Quote client creation](tutorial/quote_page_4.jpg)

Select a style profile from the dropdown. The dropdown supports **search, filter, and sort** (see [Style profiles screen](#style-profiles-screen) for details).

> 💡 **Note:** The selected style profile is saved as a snapshot. The snapshot is updated only when editing the quote and changing the style profile.
>
> 💡 This section can be hidden if the feature is turned off in the settings. Customization can still be adjusted in preview mode.
>
> 💡 Selecting a style profile only applies preset values. You can continue customizing everything afterward.

![Quote style profile creation](tutorial/quote_page_profile.jpg)

Select a language from the dropdown. The dropdown supports **search**.

> 💡 **Note:** The selected language applies only to the generated PDF and is independent of the application's global language setting.

![Quote style profile creation](tutorial/quote_page_language.jpg)

Enter the quote details, including:

- Quote number prefix
- Quote number suffix
- Quote number
- Issued date
- Due date

> 💡 **Note:**
>
> - The prefix and suffix are saved as a snapshot if they were configured on the [Settings screen](#settings-screen).
> - You can also change or add them here, even if they were not configured in Settings.
> - If configured, the prefix and suffix are always incorporated into the quote number automatically.

![Quote information](tutorial/quote_page_5.jpg)

Select a item from the dropdown and set quantity and unit price. The dropdown supports **search, filter, and sort** (see [Items screen](#items-screen) for details).

> 💡 **Note:** The selected item is saved as a snapshot. The snapshot is updated only when editing the quote and changing the item.
>
> 💡 When adding or editing an item in a quotation, a modal will appear requiring you to set the quantity and unit price. You can also define custom field data for the item, including a header, value, and alignment. Each unique custom header is added as a column in the PDF’s item table, and the corresponding value is placed in that column for the item. Alignment is configured per unique header. A header can be selected from the existing list or typed in as a new one (pressing Enter is required to register a new header). Both fields header and value must either be fully selected / entered or empty; otherwise, the Save button will remain disabled.

![Quote item creation](tutorial/quote_page_6.jpg)
![Quote item quantity](tutorial/quote_page_7.jpg)
![Quote item quantity](tutorial/quote_page_7.1.jpg)

> 💡 **Note:** The items order can be changed by drag and drop.

![Quote items order](tutorial/quote_page_27.jpg)

Once all required information has been filled in, the quote can be saved.

![Quote item quantity](tutorial/quote_page_8.jpg)

Information on other pages is also updated to reflect the current quote count.

![Quote count](tutorial/quote_page_10.jpg)

Additionally, you can set a **discount** (fixed amount or percentage-based).

![Quote discount none](tutorial/quote_page_14.jpg)
![Quote discount fixed](tutorial/quote_page_15.jpg)
![Quote discount percentage](tutorial/quote_page_16.jpg)
![Quote discount result](tutorial/quote_page_17.jpg)

You can also configure **taxes** for the quote:

- **Total-based taxes**: inclusive, exclusive, or deducted
- **Per-item taxes**: inclusive or exclusive

![Quote none](tutorial/quote_page_18.jpg)
![Quote on total](tutorial/quote_page_19.jpg)
![Quote deducted](tutorial/quote_page_20.jpg)
![Quote per item](tutorial/quote_page_21.jpg)

Results:

![Quote on total inclusive](tutorial/quote_page_22.jpg)
![Quote on total dedcuted](tutorial/quote_page_23.jpg)
![Quote on total exclusive](tutorial/quote_page_26.jpg)
![Quote per item inclusive](tutorial/quote_page_25.jpg)
![Quote per item exclusive](tutorial/quote_page_24.jpg)

Additionally, you can set a **shipping fees** (fixed amount).

![Quote shipping fees](tutorial/quote_page_28.jpg)

Additionally, you can set a **notes** (customer notes, thank you note, terms & conditions note).

![Quote thank you notes](tutorial/quote_page_29.jpg)
![Quote customer notes](tutorial/quote_page_30.jpg)
![Quote terms & conditions notes](tutorial/quote_page_31.jpg)

Additionally, you can set a **signature** which can be set via hand/cursor or uploaded as image.

> ⚠️ Maximum file size: 2 MB

![Quote signature](tutorial/quote_page_signature1.jpg)
![Quote signature](tutorial/quote_page_signature2.jpg)

Additionally, you can attach **images**, which will be embedded into the PDF.

> ⚠️ Maximum file size: 2 MB

![Quote attachments](tutorial/quote_page_32.jpg)

### Editing / Deleting a Quote

Once quotes are added, select one from the list to edit it on the right-hand pane. Each quote also displays:

- Quote data (Issued At)
- Quote status (Open, Closed)
- Client name
- Total amount
- Due date / Overdue information

![Quote list](tutorial/quote_page_9.jpg)
![Quote status due today](tutorial/quote_page_12.jpg)
![Quote status overdue](tutorial/quote_page_13.jpg)

You can also:

- **Search quotes by quote number**
- **Delete a quote** by clicking the vertical dots menu → **Delete**

![Quote actions](tutorial/quote_page_11.jpg)

### Filters

Quotes have filters to control what is displayed. By default:

- **Active**: shows all items except archived

The **archived flag** can be toggled during creation or editing. This flag only affects filtering and does not delete the quote.

Quotes have only **Open** and **Closed** statuses, so the status filter includes only these options.  
Client and business filters are based on **snapshot data** stored with the quote.
The **date filter** applies to the **Issued At** date.

![Quotes filters](tutorial/quote_page_33.jpg)

### Sorting

Quotes can be sorted by:

- Status
- Issued at date
- Quote number
- Last updated date

![Quotes sort](tutorial/quote_page_34.jpg)

### Export

Quotes can be exported **only to XLSX** format.

- Export all quote-related data to XLSX
  > 💡 **Note:** Attachments and business logo snapshots are **not included** in the export.

![Quotes import/export](tutorial/quote_page_35.jpg)

### PDF Preview

- Quotes can be **previewed live** and **exported as PDF**.
- PDF customization is based on **predefined configuration options**.
- The **Paid watermark** is applied **only when the status is set to Paid**.
- The watermark is applied **across all pages** of the document.
- **Page numbers** are shown **only when the document has more than one page**.
- **Attachments** are embedded into the PDF when present.
- Sections with zero values (**Discount**, **Tax**, **Shipping fees**) are **hidden** in the PDF.
- **Save as Profile** button will create style profile item with these customization presets for futher usage on other quotes.

![Quotes customized option 1](tutorial/quote_page_40_1.jpg)
![Quotes customized option 2](tutorial/quote_page_40_2.jpg)
![Quotes customized option 3](tutorial/quote_page_40_3.jpg)
![Quotes customized option 4](tutorial/quote_page_40_4.jpg)
![Quotes PDF](tutorial/quote_page_38.jpg)
![Quotes PDF attachments](tutorial/quote_page_37.jpg)
![Quotes data](tutorial/quote_page_36.jpg)
![Quotes data example](tutorial/quote_page_41.jpg)

## Invoices screen

The **Invoices** screen allows you to **create, read, update, and delete (CRUD)** invoice records.

> 💡 **Note:** Amounts and dates are formatted based on the configuration in the [Settings screen](#settings-screen) and the currency format defined in the [Currency screen](#currencies-screen).

You can also:

- **Filter** invoices by various criteria
- **Export** invoices to XLSX
  > 💡 **Note:** XLSX export does **not** include attachments or business logo snapshots.
- **Preview** invoices live in PDF format
- **Customize** PDF appearance and layout
- **Export** invoices as PDF documents
- **Duplicate Invoice** to quickly create a similar invoice

### Adding a Invoice

Click the **Add** button at the bottom to open the right-hand pane, where you can enter invoice details. If [Presets screen](#presets-screen) are enabled then you will have to choose either create new or from preset.

![Invoice creation](tutorial/invoice_page_11.jpg)

- **Required information:**
  - Currency
  - Language (Quote language for PDF labels which is independant from global application settings)
  - Business
  - Client (“Bill To”)
  - Invoice information
  - At least one item

![Invoice creation](tutorial/invoice_page_1.jpg)

Select a currency from the dropdown. The dropdown supports **search, filter, and sort** (see [Currencies screen](#currencies-screen) for details).

> 💡 **Note:** The selected currency is saved as a snapshot. The snapshot is updated only when editing the invoice and changing the currency.

![Invoice currency creation](tutorial/invoice_page_2.jpg)

Select a business from the dropdown. The dropdown supports **search, filter, and sort** (see [Businesses screen](#businesses-screen) for details).

> 💡 **Note:** The selected business is saved as a snapshot. The snapshot is updated only when editing the invoice and changing the business.

![Invoice business creation](tutorial/invoice_page_3.jpg)

Select a client from the dropdown. The dropdown supports **search, filter, and sort** (see [Clients screen](#clients-screen) for details).

> 💡 **Note:** The selected client is saved as a snapshot. The snapshot is updated only when editing the invoice and changing the client.

![Invoice client creation](tutorial/invoice_page_4.jpg)

Select a style profile from the dropdown. The dropdown supports **search, filter, and sort** (see [Style profiles screen](#style-profiles-screen) for details).

> 💡 **Note:** The selected style profile is saved as a snapshot. The snapshot is updated only when editing the quote and changing the style profile.
>
> 💡 This section can be hidden if the feature is turned off in the settings. Customization can still be adjusted in preview mode.
>
> 💡 Selecting a style profile only applies preset values. You can continue customizing everything afterward.

![Invoice style profile creation](tutorial/invoice_page_profile.jpg)

Select a language from the dropdown. The dropdown supports **search**.

> 💡 **Note:** The selected language applies only to the generated PDF and is independent of the application's global language setting.

![Invoice style profile creation](tutorial/invoice_page_language.jpg)

Enter the invoice details, including:

- Invoice number prefix
- Invoice number suffix
- Invoice number
- Issued date
- Due date

> 💡 **Note:**
>
> - The prefix and suffix are saved as a snapshot if they were configured on the [Settings screen](#settings-screen).
> - You can also change or add them here, even if they were not configured in Settings.
> - If configured, the prefix and suffix are always incorporated into the invoice number automatically.

![Invoice information](tutorial/invoice_page_5.jpg)

Select a item from the dropdown and set quantity and unit price. The dropdown supports **search, filter, and sort** (see [Items screen](#items-screen) for details).

> 💡 **Note:** The selected item is saved as a snapshot. The snapshot is updated only when editing the invoice and changing the item.
>
> 💡 When adding or editing an item in a invoice, a modal will appear requiring you to set the quantity and unit price. You can also define custom field data for the item, including a header, value, and alignment. Each unique custom header is added as a column in the PDF’s item table, and the corresponding value is placed in that column for the item. Alignment is configured per unique header. A header can be selected from the existing list or typed in as a new one (pressing Enter is required to register a new header). Both fields header and value must either be fully selected / entered or empty; otherwise, the Save button will remain disabled.

![Invoice item creation](tutorial/invoice_page_6.jpg)
![Invoice item quantity](tutorial/invoice_page_7.jpg)

> 💡 **Note:** The items order can be changed by drag and drop.

![Invoice items order](tutorial/invoice_page_27.jpg)

Once all required information has been filled in, the invoice can be saved.

![Invoice item quantity](tutorial/invoice_page_8.jpg)

Information on other pages is also updated to reflect the current invoice count.

![Invoice count](tutorial/invoice_page_10.jpg)

Additionally, you can set a **discount** (fixed amount or percentage-based).

![Invoice discount none](tutorial/invoice_page_14.jpg)
![Invoice discount fixed](tutorial/invoice_page_15.jpg)
![Invoice discount percentage](tutorial/invoice_page_16.jpg)
![Invoice discount result](tutorial/invoice_page_17.jpg)

You can also configure **taxes** for the invoice:

- **Total-based taxes**: inclusive, exclusive, or deducted
- **Per-item taxes**: inclusive or exclusive

![Invoice none](tutorial/invoice_page_18.jpg)
![Invoice on total](tutorial/invoice_page_19.jpg)
![Invoice deducted](tutorial/invoice_page_20.jpg)
![Invoice per item](tutorial/invoice_page_21.jpg)

Results:

![Invoice on total inclusive](tutorial/invoice_page_22.jpg)
![Invoice on total dedcuted](tutorial/invoice_page_23.jpg)
![Invoice on total exclusive](tutorial/invoice_page_24.jpg)
![Invoice per item inclusive](tutorial/invoice_page_25.jpg)
![Invoice per item exclusive](tutorial/invoice_page_26.jpg)

Additionally, you can set a **shipping fees** (fixed amount).

![Invoice shipping fees](tutorial/invoice_page_28.jpg)

Additionally, **partial payments are supported**, allowing you to track paid amounts and outstanding balances per invoice.

![Invoice with partial payment applied](tutorial/invoice_page_42.jpg)

Additionally, you can set a **notes** (customer notes, thank you note, terms & conditions note).

![Invoice thank you notes](tutorial/invoice_page_29.jpg)
![Invoice customer notes](tutorial/invoice_page_30.jpg)
![Invoice terms & conditions notes](tutorial/invoice_page_31.jpg)

Additionally, you can set a **signature** which can be set via hand/cursor or uploaded as image.

> ⚠️ Maximum file size: 2 MB

![Invoice signature](tutorial/invoice_page_signature1.jpg)
![Invoice signature](tutorial/invoice_page_signature2.jpg)

Additionally, you can attach **images**, which will be embedded into the PDF.

> ⚠️ Maximum file size: 2 MB

![Invoice attachments](tutorial/invoice_page_32.jpg)

### Editing / Deleting a Invoice

Once invoice are added, select one from the list to edit it on the right-hand pane. Each invoice also displays:

- Invoice data (Issued At)
- Invoice status (Unpaid, Paid, Partially, Closed)
- Client name
- Total amount
- Due date / Overdue information / Partial paid information

![Invoice list with statuses](tutorial/invoice_page_9.jpg)

You can also:

- **Search invoices by invoice number**
- **Delete a invoice** by clicking the vertical dots menu → **Delete**

![Invoice actions](tutorial/invoice_page_11.jpg)

### Filters

Invoices have filters to control what is displayed. By default:

- **Active**: shows all items except archived

The **archived flag** can be toggled during creation or editing. This flag only affects filtering and does not delete the invoice.

Invoices have **Unpaid**, **Partially**, **Paid** and **Closed** statuses, so the status filter includes only these options.  
Client and business filters are based on **snapshot data** stored with the invoice.
The **date filter** applies to the **Issued At** date.

![Invoices filters](tutorial/invoice_page_33.jpg)

### Sorting

Invoices can be sorted by:

- Status
- Issued at date
- Invoice number
- Last updated date

![Invoices sort](tutorial/invoice_page_34.jpg)

### Export

Invoices can be exported **only to XLSX** format.

- Export all invoice-related data to XLSX
  > 💡 **Note:** Attachments and business logo snapshots are **not included** in the export.

![Invoices import/export](tutorial/invoice_page_35.jpg)

### PDF Preview

- Invoices can be **previewed live** and **exported as PDF**.
- PDF customization is based on **predefined configuration options**.
- The **Paid watermark** is applied **only when the status is set to Paid**.
- The watermark is applied **across all pages** of the document.
- **Page numbers** are shown **only when the document has more than one page**.
- **Attachments** are embedded into the PDF when present.
- Sections with zero values (**Discount**, **Tax**, **Shipping fees**) are **hidden** in the PDF.
- **Save as Profile** button will create style profile item with these customization presets for futher usage on other quotes.

![Invoices customized option 1](tutorial/invoice_page_40_1.jpg)
![Invoices customized option 2](tutorial/invoice_page_40_2.jpg)
![Invoices customized option 3](tutorial/invoice_page_40_3.jpg)
![Invoices customized option 4](tutorial/invoice_page_40_4.jpg)
![Invoices PDF](tutorial/invoice_page_38.jpg)
![Invoices PDF attachments](tutorial/invoice_page_37.jpg)
![Invoices data](tutorial/invoice_page_36.jpg)
![Invoices data example](tutorial/invoice_page_41.jpg)
![Invoices paid](tutorial/invoice_page_43.jpg)

## Reports screen

The **Reports** screen provides an overview of **aggregated financial data grouped by currency** for a selected period.

![Reports currency 1](tutorial/reports_page_1.jpg)
![Reports currency 2](tutorial/reports_page_2.jpg)

### Filters

You can filter reports using:

- **Predefined periods** (e.g. this month, last year)
- **Custom date ranges**

![Reports predefined filters](tutorial/reports_page_3.jpg)
![Reports custom filters](tutorial/reports_page_4.jpg)

## e-invoices

The application supports UBL Peppol XML: you can download the XML embedded with the PDF, or as a standalone XML file. This feature is enabled by default and can be toggled in the Settings page.

![E-Invoice](tutorial/e-invoice-actions.jpg)

To generate valid UBL/Peppol XML, additional fields are available on Businesses and Clients. These fields must be properly filled to produce compliant invoices.

![E-Invoice](tutorial/e-invoice-actions1.jpg)
![E-Invoice](tutorial/e-invoice-actions2.jpg)

> **ℹ️ UBL XML may fail validation if data is misconfigured.**
> The application only checks that required fields are present. It does not guarantee that all values conform to UBL/Peppol standards.
>
> For example:
>
> - Tax names must match supported values (e.g., VAT). Arbitrary text will cause validation errors.
> - Currency codes must be standard ISO codes (e.g., EUR, USD). Random text will fail validation.
>
> Export behavior:
>
> - A regular PDF can be exported at any time.
> - The XML file and the PDF with embedded XML reflect only saved data.
> - You cannot export XML while creating a new invoice until it has been saved.
> - When editing an invoice, make sure to save changes before exporting.
>
> Use a Peppol XML validator (e.g., [https://peppolvalidator.com/](https://peppolvalidator.com/)) to ensure compliance before sending.
