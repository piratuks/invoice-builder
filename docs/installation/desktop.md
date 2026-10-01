---
title: Desktop Installation
---

# Desktop Installation

Download the latest release from the **GitHub Releases** page:

[Download Latest Release](https://github.com/piratuks/invoice-builder/releases)

No account required.

## Browser / Windows

:::warning[Browser download warning]

When downloading the app, your browser may show a message like:

- "This file is from an unknown source"
- "This file is rarely downloaded"

This is normal for newly published apps and does **not** indicate a security issue.
Simply choose **Keep anyway / Save anyway** to proceed with the download.

:::

## Linux AppImage

Make the AppImage executable and launch it:

```bash
chmod +x Invoice-Builder-*.AppImage
./Invoice-Builder-*.AppImage
```

:::warning[Linux package warning]

On some Linux distributions (Ubuntu, Linux Mint, etc.), you may see messages such as:

- "This package is provided by a third party"
- "Installing software from outside the official repositories may be unsafe"

This warning appears because the app is not distributed via the default system repositories.
If you downloaded the package directly from the official GitHub Releases page, it is safe to proceed.

:::

## MacOS

:::warning[macOS Gatekeeper warning]

Because this app is **unsigned**, macOS may display a message like:

- "App is damaged and can't be opened. Move to Trash"
- "App is from an unidentified developer"

This happens because macOS Gatekeeper treats all unsigned apps downloaded from the internet as potentially unsafe.
It adds a special **quarantine flag** to the app bundle, which prevents it from launching.

To fix this, after downloading and installing it:

1. Open **Terminal**.
2. Run the following command:

   ```bash
   sudo xattr -rd com.apple.quarantine "/Applications/Invoice Builder.app"
   ```

:::
