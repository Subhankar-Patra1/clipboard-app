import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync } from 'fs'

export interface ClipItem {
  id: number
  type: 'text' | 'image'
  content?: string
  image_data?: Buffer
  created_at: string
  pinned: boolean
  is_otp: boolean
  hash?: string
}

export class ClipDatabase {
  private db: Database.Database

  constructor() {
    const userDataPath = app.getPath('userData')
    // Ensure the directory exists
    try {
      mkdirSync(userDataPath, { recursive: true })
    } catch (e) {
      /* ignore */
    }
    
    const dbPath = join(userDataPath, 'clipboard_mvp.sqlite')
    console.log('Database path:', dbPath)
    
    this.db = new Database(dbPath)
    this.init()
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS clips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT CHECK(type IN ('text', 'image')) NOT NULL,
        content TEXT,
        image_data BLOB,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        pinned BOOLEAN DEFAULT 0,
        is_otp BOOLEAN DEFAULT 0,
        hash TEXT,
        CHECK (
            (type = 'text' AND content IS NOT NULL AND image_data IS NULL)
            OR
            (type = 'image' AND image_data IS NOT NULL AND content IS NULL)
        )
      );
    `)
    
    // Migration for existing DBs (if hash column missing)
    try {
        this.db.prepare('ALTER TABLE clips ADD COLUMN hash TEXT').run()
    } catch (e) {
        // Column likely exists
    }

    this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_clips_created_at ON clips(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_clips_hash ON clips(hash);
    `)
  }

  addClip(item: { type: 'text' | 'image'; content?: string; image_data?: Buffer; is_otp?: boolean; hash: string }): number {
    // Deduplication: Check if hash exists
    const existing = this.db.prepare('SELECT id FROM clips WHERE hash = @hash').get({ hash: item.hash }) as { id: number } | undefined
    
    if (existing) {
        // Bump to top (Update created_at)
        this.db.prepare('UPDATE clips SET created_at = CURRENT_TIMESTAMP WHERE id = @id').run({ id: existing.id })
        return existing.id
    }

    const stmt = this.db.prepare(`
      INSERT INTO clips (type, content, image_data, is_otp, hash)
      VALUES (@type, @content, @image_data, @is_otp, @hash)
    `)
    const result = stmt.run({
        type: item.type,
        content: item.content || null,
        image_data: item.image_data || null,
        is_otp: item.is_otp ? 1 : 0,
        hash: item.hash
    })
    return result.lastInsertRowid as number
  }

  getClips(limit = 50, offset = 0): ClipItem[] {
    const stmt = this.db.prepare(`
      SELECT * FROM clips
      ORDER BY pinned DESC, created_at DESC
      LIMIT @limit OFFSET @offset
    `)
    return stmt.all({ limit, offset }) as ClipItem[]
  }

  deleteClip(id: number) {
    const stmt = this.db.prepare('DELETE FROM clips WHERE id = @id AND pinned = 0') // Safety check? No, prompt says "Delete individual items" and "Clear All never deletes pinned". "Delete individual" should probably allow deleting pinned? 
    // Re-reading rules: "Delete individual items". "Clear All never deletes pinned".
    // So individual delete assumes user intent, so it CAN delete pinned.
    // "Clear: Non-pinned items".
    
    // Changing deleteClip to force delete (user action)
    const deleteStmt = this.db.prepare('DELETE FROM clips WHERE id = @id')
    return deleteStmt.run({ id })
  }

  getClip(id: number): ClipItem | undefined {
      return this.db.prepare('SELECT * FROM clips WHERE id = @id').get({ id }) as ClipItem | undefined
  }

  clearUnpinned() {
    const stmt = this.db.prepare('DELETE FROM clips WHERE pinned = 0')
    return stmt.run()
  }

  togglePin(id: number) {
    const stmt = this.db.prepare('UPDATE clips SET pinned = NOT pinned WHERE id = @id')
    return stmt.run({ id })
  }
  
  deleteExpiredOtps() {
     // OTPs are > 60s old
     const stmt = this.db.prepare(`
        DELETE FROM clips 
        WHERE is_otp = 1 
        AND datetime(created_at) < datetime('now', '-60 seconds')
     `)
     return stmt.run()
  }
}
