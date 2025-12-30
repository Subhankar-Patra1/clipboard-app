# Privacy Policy for Clipboard Manager

**Last Updated: December 30, 2025**

## Introduction

Clipboard Manager ("we", "our", or "the App") is a desktop application developed by Subhankar Patra. This Privacy Policy explains how we handle your data when you use our application.

**The short version: Your data never leaves your computer. We don't collect, transmit, or have access to any of your clipboard content.**

---

## Data Collection and Storage

### What Data is Captured

The App monitors your system clipboard and stores:
- **Text content** that you copy to your clipboard
- **Image content** that you copy to your clipboard
- **Timestamps** of when items were copied
- **Metadata** such as content type and hash values for deduplication

### Where Data is Stored

All data is stored **locally on your computer** in a SQLite database file located in your user application data folder:
```
%APPDATA%/clipboard/clipboard.db
```

**No data is ever transmitted to external servers, cloud services, or third parties.**

---

## Data We Do NOT Collect

We want to be absolutely clear about what we **do not** do:

- ❌ We do NOT send your clipboard data to any server
- ❌ We do NOT use analytics or tracking services
- ❌ We do NOT collect personal information
- ❌ We do NOT share data with third parties
- ❌ We do NOT have access to your clipboard history
- ❌ We do NOT use cookies or web tracking
- ❌ We do NOT require an internet connection to function

---

## Privacy Features

### Private Mode

The App includes a "Private Mode" feature that, when enabled:
- Temporarily pauses clipboard monitoring
- Prevents sensitive content from being stored
- Can be toggled on/off at any time from the system tray

### OTP Auto-Delete

One-Time Passwords (4-8 digit codes) are automatically detected and deleted after 60 seconds for your security.

### Data Deletion

You can delete your clipboard history at any time:
- **Individual items**: Click the delete button on any clip
- **All unpinned items**: Use the "Clear All" button
- **Complete deletion**: Delete the database file from your AppData folder

---

## Data Retention

- Clipboard data is retained indefinitely until you delete it
- Pinned items are preserved even when using "Clear All"
- OTP codes are automatically deleted after 60 seconds
- Uninstalling the App does not automatically delete the database file

To completely remove all data, delete:
```
%APPDATA%/clipboard/
```

---

## Security

### Local Security
- All data is stored locally using SQLite encryption-at-rest capabilities
- The database file is protected by your Windows user account permissions
- No network connections are made by the application

### What We Recommend
- Use Windows login password/PIN to protect your account
- Enable Private Mode when copying sensitive information
- Regularly clear clipboard history of sensitive items

---

## Children's Privacy

The App does not knowingly collect any data from children. Since all data is stored locally and we have no access to it, we cannot identify the age of users.

---

## Third-Party Services

The App does not integrate with any third-party services. It operates entirely offline and locally.

---

## Open Source

Clipboard Manager is open source software. You can review the complete source code at:
https://github.com/Subhankar-Patra1/clipboard-app

This allows you to verify our privacy claims independently.

---

## Changes to This Policy

We may update this Privacy Policy from time to time. Any changes will be:
- Posted in this document with an updated "Last Updated" date
- Included in the App's release notes

---

## Your Rights

You have the right to:
- **Access**: View all your stored clipboard data within the App
- **Delete**: Remove any or all clipboard entries at any time
- **Export**: Copy your data from the SQLite database
- **Opt-out**: Use Private Mode to stop data collection temporarily

---

## Contact

If you have questions about this Privacy Policy, please contact:

**Developer**: Subhankar Patra  
**GitHub**: https://github.com/Subhankar-Patra1  
**Repository**: https://github.com/Subhankar-Patra1/clipboard-app

---

## Summary

| Aspect | Our Approach |
|--------|--------------|
| Data Storage | 100% Local (SQLite) |
| Cloud Sync | None |
| Analytics | None |
| Tracking | None |
| Internet Required | No |
| Data Access | Only You |
| Open Source | Yes |

**Your clipboard data belongs to you and stays with you.**
