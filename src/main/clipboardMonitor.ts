import { clipboard, BrowserWindow } from 'electron'
import { createHash } from 'crypto'
import { ClipDatabase } from './database'

export class ClipboardMonitor {
  private lastHash: string = ''
  private ignoreHash: string | null = null
  private interval: NodeJS.Timeout | null = null
  private db: ClipDatabase
  private isPrivateMode: boolean = false

  constructor(db: ClipDatabase) {
    this.db = db
  }

  setIgnoreHash(hash: string) {
      this.ignoreHash = hash
      console.log('Ignore hash set:', hash)
  }

  startMonitoring(intervalMs = 500) {
    if (this.interval) return
    
    // Initial check
    this.checkClipboard()
    
    this.interval = setInterval(() => this.checkClipboard(), intervalMs)
    
    // OTP Cleanup Scheduler (every 10s)
    setInterval(() => {
        try {
            this.db.deleteExpiredOtps()
        } catch (e) {
            console.error('OTP Cleanup failed', e)
        }
    }, 10000)
  }

  stopMonitoring() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  setPrivateMode(enabled: boolean) {
    this.isPrivateMode = enabled
    console.log('Private Mode:', enabled)
  }

  private checkClipboard() {
    if (this.isPrivateMode) return

    let type: 'text' | 'image' | null = null
    let content: string | undefined
    let imageData: Buffer | undefined
    let hashInput: string | Buffer

    try {
        const text = clipboard.readText()
        const image = clipboard.readImage()

        if (text && text.trim().length > 0) {
            type = 'text'
            content = text
            hashInput = text
        } else if (!image.isEmpty()) {
            type = 'image'
            imageData = image.toPNG()
            hashInput = imageData
        } else {
            return
        }

        const currentHash = createHash('sha256').update(hashInput).digest('hex')
        
        if (currentHash === this.lastHash) return
        
        // Check if this is a self-write (ignore)
        if (this.ignoreHash && currentHash === this.ignoreHash) {
            console.log('Ignoring self-written clip:', currentHash)
            this.lastHash = currentHash
            this.ignoreHash = null
            return
        }

        this.lastHash = currentHash

        // Rules Engine
        let isOtp = false
        if (type === 'text' && content) {
            // 1. Ignore Sensitive Patterns
            // Heuristic: Very long strings without spaces (Tokens) or just "Password"
            // For MVP, we'll keep it simple as requested
            
            // 2. OTP Detection
            // 4-8 digits only, maybe whitespace
            if (content.match(/^\s*\d{4,8}\s*$/)) {
                isOtp = true
            }
        }
        
        console.log(`Detected new clip: ${type} (OTP: ${isOtp})`)
        this.db.addClip({ type, content, image_data: imageData, is_otp: isOtp, hash: currentHash })
        
        // Notify all windows
        BrowserWindow.getAllWindows().forEach(win => {
            win.webContents.send('clipboard-updated')
        })

    } catch (e) {
        console.error('Clipboard check failed', e)
    }
  }
}
