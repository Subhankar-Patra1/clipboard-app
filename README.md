<p align="center">
  <img src="build/icon.png" alt="Clipboard Logo" width="120" height="120">
</p>

<h1 align="center">Clipboard</h1>

<p align="center">
  <strong>A persistent, privacy-first clipboard manager for Windows</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows-blue?style=flat-square" alt="Platform">
  <img src="https://img.shields.io/badge/Framework-Electron-47848F?style=flat-square&logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/UI-React-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Database-SQLite-003B57?style=flat-square&logo=sqlite" alt="SQLite">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">
</p>

---

## ✨ Features

### 🔒 Privacy-First Design
- **100% Local Storage** – All clipboard data is stored in a local SQLite database. Nothing is sent to the cloud.
- **Private Mode** – Pause clipboard monitoring anytime. Sensitive data won't be captured.
- **OTP Auto-Delete** – One-Time Passwords (4-8 digit codes) are automatically deleted after 60 seconds.

### 📋 Clipboard Management
- **Text & Image Support** – Captures both text and image content from your clipboard.
- **Deduplication** – Smart hash-based deduplication bumps repeated copies to the top instead of creating duplicates.
- **Pinning** – Pin important clips to prevent them from being cleared.
- **Drag & Drop** – Drag clips directly into other applications.

### 🔍 Powerful Search
- **Instant Search** – Filter clips as you type.
- **Fuzzy Search** – Use `~query` for fuzzy matching (e.g., `~hlo` matches "hello").
- **Regex Search** – Use `/pattern/` for regular expression matching (e.g., `/\d{4}/` matches 4-digit numbers).
- **Date Filters** – Quickly filter by Today, This Week, or All Time.

### 📦 Paste Queue
- **Queue Mode** – Select multiple clips to paste in sequence.
- **One-Click Paste** – Paste the next queued item with a single click.

### ⚡ Performance Optimized
- **Thumbnail Generation** – Images are resized to thumbnails for the list view, reducing memory usage.
- **Fast Polling** – Clipboard is monitored every 500ms for near-instant capture.
- **Indexed Database** – SQLite indexes ensure fast searches and retrievals.

### 🎨 Modern UI
- **Frameless Window** – Sleek, borderless design with custom CSS styling.
- **Keyboard Navigation** – Navigate clips with `↑`/`↓` arrows, select with `Enter`.
- **System Tray** – Lives in your system tray for quick access.
- **Auto-Hide** – Window hides when it loses focus.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Subhankar-Patr1/clipboard-app.git
   cd clipboard-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run dist
   ```
   The installer will be created in the `dist/` folder.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + V` | Toggle Clipboard window |
| `↑` / `↓` | Navigate clips |
| `Enter` | Copy & paste selected clip |
| `Escape` | Unfocus search input |

> **Note:** You can optionally disable Windows' built-in clipboard history to use `Win + V` instead of `Alt + V`. A button in the app allows you to do this with one click.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Electron** | Cross-platform desktop framework |
| **React** | User interface |
| **TypeScript** | Type-safe codebase |
| **better-sqlite3** | Local SQLite database |
| **electron-builder** | Packaging & distribution |
| **electron-vite** | Fast development & build tool |

---

## 📁 Project Structure

```
clipboard-app/
├── build/                  # App icons and installer assets
│   ├── icon.png            # Application icon
│   ├── tray.png            # System tray icon
│   └── installer.nsh       # NSIS installer script (DPI fix)
├── src/
│   ├── main/               # Electron main process
│   │   ├── index.ts        # Main entry, window, tray, IPC handlers
│   │   ├── database.ts     # SQLite database class
│   │   └── clipboardMonitor.ts  # Clipboard polling & detection
│   ├── preload/            # Electron preload scripts
│   └── renderer/           # React frontend
│       └── src/
│           ├── App.tsx     # Main React component
│           └── App.css     # Styling
├── package.json            # Dependencies & scripts
└── README.md               # This file
```

---

## 🔧 Configuration

The app starts automatically with Windows. To disable this:
1. Open Windows Settings → Apps → Startup
2. Toggle off "Clipboard"

---

## 📦 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start in development mode with hot-reload |
| `npm run build` | Build the app (without packaging) |
| `npm run dist` | Build and create Windows installer |
| `npm run preview` | Preview the built app |

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgements

- [Electron](https://www.electronjs.org/)
- [React](https://reactjs.org/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [electron-vite](https://electron-vite.org/)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/Subhankar-Patra1">Subhankar</a>
</p>
