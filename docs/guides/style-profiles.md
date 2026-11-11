---
title: Style Profiles
---

# Style profiles screen

The **Style profiles** screen allows you to **create, read, update, and delete (CRUD)** style profile data, which can later be used in [Invoices](./invoices.md) and [Quotes](./quotes.md). You can also **filter**, **import**, and **export** style profiles via XLSX.

This screen follows the shared [Common Screen Patterns](./common-patterns.md) for editing, filtering, sorting, and import/export. Only what's unique to Style profiles is covered below.

## Adding a Style profile

Click the **Add** button at the bottom to open a modal where you can:

- Enter style profile information

:::info
**Name:** must be unique. You cannot create two style profiles with the same name.

**Sort Order:** under the "Table" tab it's possible to customize the sort order of generic item table headers.

**Item descriptions:** enable **Show item descriptions** under the **Table** tab to display saved item descriptions when the profile is applied. The setting is disabled by default. Applying a profile changes visibility; it does not populate or refresh descriptions on existing document lines.
:::

![Style profile creation](images/style-profile-creation-1.jpg)
![Style profile creation](images/style-profile-creation-2.jpg)
![Style profile creation](images/style-profile-creation-3.jpg)
![Style profile creation](images/style-profile-creation-4.jpg)

## Editing / deleting a Style profile

Each style profile item also shows the number of invoices and quotes created with it (quotes count is hidden if the layout is disabled in settings).

![Style profiles list](images/style-profile-list.jpg)

## Filters

![Style profiles filters](images/style-profile-filters.jpg)

## Sorting

![Style profiles sort](images/style-profile-sort.jpg)

## Import & Export

XLSX exports include the `showItemDescriptions` column. Use boolean `TRUE` or `FALSE` values for this setting. Older files without the column, and rows with an empty cell, import with descriptions disabled.

![Style profiles import/export](images/style-profile-import-export.jpg)
