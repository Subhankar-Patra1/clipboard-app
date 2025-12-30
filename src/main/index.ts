import { app, shell, BrowserWindow, ipcMain, nativeImage, Tray, Menu, globalShortcut, clipboard, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { ClipDatabase } from './database'
import { ClipboardMonitor } from './clipboardMonitor'
import { exec } from 'child_process'

let db: ClipDatabase
let monitor: ClipboardMonitor
let tray: Tray | null = null
let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 360,
    height: 450,
    show: false,
    autoHideMenuBar: true,
    skipTaskbar: true,
    transparent: true, // Enable transparency for CSS-based rounded corners
    backgroundColor: '#00000000',
    frame: false,
    titleBarStyle: 'hidden',
    hasShadow: true,
    roundedCorners: false, // Disable native - use CSS instead
    icon: join(__dirname, '../../build/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Disable Acrylic to prevent green corner artifacts
  // mainWindow.setBackgroundMaterial('acrylic')

  mainWindow.on('ready-to-show', () => {
    // mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
  
  // Hide on blur
  mainWindow.on('blur', () => {
    if (mainWindow) mainWindow.hide()
  })
  
  // Prevent Window Close (Quit)
  mainWindow.on('close', (event) => {
      // If we really want to quit, appId will handle it or tray
      // But for 'X' button, just hide
      if (!(app as any)['isQuitting']) {
          event.preventDefault()
          if (mainWindow) mainWindow.hide()
      }
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  // Enable auto-launch at startup only for packaged app
  if (app.isPackaged) {
    app.setLoginItemSettings({
      openAtLogin: true,
      path: app.getPath('exe')
    })
  }

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize DB
  db = new ClipDatabase()
  
  // Initialize Monitor
  monitor = new ClipboardMonitor(db)
  monitor.startMonitoring()

  // IPC Handlers
  ipcMain.handle('get-clips', async (_, { limit, offset }) => {
      const clips = db.getClips(limit, offset)
      // RAM Opt: Resize images to thumbnails
      return clips.map(clip => {
          if (clip.type === 'image' && clip.image_data) {
              try {
                  const img = nativeImage.createFromBuffer(clip.image_data)
                  // Resize to reasonable height for list
                  const thumb = img.resize({ height: 96 })
                  return { ...clip, image_data: thumb.toPNG() }
              } catch (e) {
                  return clip
              }
          }
          return clip
      })
  })
  
  ipcMain.handle('delete-clip', (_, id) => db.deleteClip(id))
  ipcMain.handle('toggle-pin', (_, id) => db.togglePin(id))
  ipcMain.handle('clear-unpinned', () => db.clearUnpinned())
  
  // Disable Windows Clipboard History and register Win+V
  ipcMain.handle('disable-windows-clipboard', async () => {
    const { exec } = require('child_process')
    return new Promise((resolve) => {
      // Disable Windows Clipboard History via registry
      exec('reg add "HKCU\\Software\\Microsoft\\Clipboard" /v EnableClipboardHistory /t REG_DWORD /d 0 /f', (error: Error | null) => {
        if (error) {
          console.error('Failed to disable Windows Clipboard:', error)
          resolve({ success: false, error: error.message })
        } else {
          console.log('Windows Clipboard History disabled successfully!')
          // Re-register the hotkey
          globalShortcut.unregisterAll()
          const registered = globalShortcut.register('Super+V', () => {
            const win = BrowserWindow.getAllWindows()[0]
            if (win) {
              if (win.isVisible()) {
                win.hide()
              } else {
                showWindowAtCursor()
              }
            }
          })
          resolve({ success: true, hotkeyRegistered: registered })
        }
      })
    })
  })
  
  ipcMain.on('set-window-width', (_, width: number) => {
    if (mainWindow) {
        const [currentWidth, currentHeight] = mainWindow.getSize()
        if (currentWidth !== width) {
            mainWindow.setSize(width, currentHeight, true)
        }
    }
  })
  
  // Check if Windows Clipboard History is enabled
  ipcMain.handle('check-windows-clipboard-status', async () => {
    const { exec } = require('child_process')
    return new Promise((resolve) => {
      exec('reg query "HKCU\\Software\\Microsoft\\Clipboard" /v EnableClipboardHistory', (error: Error | null, stdout: string) => {
        if (error) {
          // Key might not exist, assume enabled by default
          resolve({ enabled: true })
        } else {
          // Check the value (0 = disabled, 1 = enabled)
          const match = stdout.match(/EnableClipboardHistory\s+REG_DWORD\s+(0x[0-9a-fA-F]+)/i)
          const value = match ? parseInt(match[1], 16) : 1
          resolve({ enabled: value === 1 })
        }
      })
    })
  })
  
  ipcMain.handle('write-clipboard', (_, { id }) => {
      // Fetch full content from DB using ID
      const item = db.getClip(id)
      
      if (!item) {
          console.error('Clip not found for write:', id)
          return
      }

      console.log('IPC: write-clipboard called for ID:', id)
      
      if (item.hash) {
          monitor.setIgnoreHash(item.hash)
      }
      
      try {
        if (item.type === 'text' && item.content) {
            clipboard.writeText(item.content)
            console.log('Clipboard wrote text')
        } else if (item.type === 'image' && item.image_data) {
            const buffer = Buffer.from(item.image_data)
            const img = nativeImage.createFromBuffer(buffer)
            clipboard.writeImage(img)
            console.log('Clipboard wrote image')
        }

        // Auto-Paste Logic
        // 1. Force focus switch by minimizing first, then hiding
        if (mainWindow) {
            mainWindow.minimize() 
            mainWindow.hide()
        }

        // 2. Simulate Ctrl+V (Windows)
        // Delay 50ms: Minimized window switches focus almost instantly, so we can be aggressive.
        setTimeout(() => {
            exec('powershell -c "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys(\'^v\')"', (err) => {
                if (err) console.error('Auto-paste failed:', err)
                else console.log('Auto-paste signal sent')
            })
        }, 50)

      } catch (err) {
          console.error('Clipboard write failed:', err)
      }
  })
  ipcMain.on('set-private-mode', (_, enabled) => monitor.setPrivateMode(enabled))

  createWindow()
  
  function showWindowAtCursor() {
    const win = BrowserWindow.getAllWindows()[0]
    if (!win) return

    const { x, y } = screen.getCursorScreenPoint()
    const currentDisplay = screen.getDisplayNearestPoint({ x, y })
    const { workArea } = currentDisplay
    const winSize = win.getSize()
    
    // Default: Position at cursor
    let newX = x
    let newY = y

    // Check bounds (Overflows Right or Bottom?)
    const overflowsRight = (newX + winSize[0] > workArea.x + workArea.width)
    const overflowsBottom = (newY + winSize[1] > workArea.y + workArea.height)

    if (overflowsRight || overflowsBottom) {
        // Fallback: Snap to Bottom-Right of Screen (Tray Position)
        // This is more stable than flipping the window around the cursor
        newX = workArea.x + workArea.width - winSize[0]
        newY = workArea.y + workArea.height - winSize[1]
    }

    win.setPosition(newX, newY)
    win.show()
    win.focus()
  }

  // Tray
  const icon = nativeImage.createFromPath(join(__dirname, '../../build/tray.png'))
  tray = new Tray(icon)
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: () => showWindowAtCursor() },
    { label: 'Quit', click: () => {
        (app as any)['isQuitting'] = true
        app.quit()
    }}
  ])
  tray.setToolTip('SmartClip')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
      showWindowAtCursor()
  })

  // Global Shortcut - Alt+V (works immediately, not reserved by Windows)
  const registered = globalShortcut.register('Alt+V', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (mainWindow && win && !win.isFocused()) {
      mainWindow.show()
    } else {
        if (win.isVisible()) {
            win.hide()
        } else {
            showWindowAtCursor()
        }
    }
  })
  
  if (!registered) {
    console.log('Failed to register Alt+V, trying Ctrl+Shift+V as fallback')
    // Fallback to Ctrl+Shift+V
    globalShortcut.register('CommandOrControl+Shift+V', () => {
      const win = BrowserWindow.getAllWindows()[0]
      if (win) {
          if (win.isVisible()) {
              win.hide()
          } else {
              showWindowAtCursor()
          }
      }
    })
  } else {
    console.log('Alt+V registered successfully!')
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
