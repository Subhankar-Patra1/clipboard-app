import React, { useEffect, useState, useRef } from 'react'
import './App.css'

interface Clip {
  id: number
  type: 'text' | 'image'
  content?: string
  image_data?: Uint8Array
  created_at: string
  pinned: boolean
  hash?: string
}

// Helper to convert Buffer/Uint8Array to Base64 for Image
function bufferToBase64(buffer: Uint8Array | undefined) {
    if (!buffer) return '';
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

const Icons = {
  Pin: ({ filled }: { filled: boolean }) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  ),
  Eye: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  EyeOff: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  ),
  Clipboard: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
    </svg>
  ),
  Lock: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  ),
  Keyboard: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
      <path d="M6 8h.001"></path>
      <path d="M10 8h.001"></path>
      <path d="M14 8h.001"></path>
      <path d="M18 8h.001"></path>
      <path d="M8 12h.001"></path>
      <path d="M12 12h.001"></path>
      <path d="M16 12h.001"></path>
      <path d="M7 16h10"></path>
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  Drag: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.5 }}>
      <circle cx="9" cy="5" r="1.5" />
      <circle cx="15" cy="5" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="15" cy="19" r="1.5" />
    </svg>
  )
}

function App(): JSX.Element {
  const [clips, setClips] = useState<Clip[]>([])
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all')
  const [privateMode, setPrivateMode] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [focusedIndex, setFocusedIndex] = useState<number>(0)
  const [queueMode, setQueueMode] = useState(false)
  const [queue, setQueue] = useState<number[]>([]) // Array of clip IDs in paste order
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  const loadClips = async () => {
    if (!window.api) return
    try {
        const items = await window.api.getClips(50, 0)
        setClips(items)
    } catch (e) {
        console.error("Failed to load clips", e)
    }
  }

  useEffect(() => {
    if (!window.api) {
        console.warn('Electron API not found. Running in browser mode?')
        setClips([{id: 0, type: 'text', content: 'Electron API not detected.\nPlease run via "npm run dev" and check the Electron window.', created_at: new Date().toISOString(), pinned: true}])
        return
    }

    loadClips()
    
    // Subscribe to updates
    const removeListener = window.api.onClipboardUpdated(() => {
        loadClips()
    })
    
    return () => {
        removeListener()
    }
  }, [])

  // Dynamic window resizing based on Paste button visibility
  useEffect(() => {
    if (window.api && window.api.setWindowWidth) {
        const hasPasteButton = queueMode && queue.length > 0
        window.api.setWindowWidth(hasPasteButton ? 440 : 360)
    }
  }, [queueMode, queue.length])

  // Fuzzy match function
  const fuzzyMatch = (text: string, pattern: string): boolean => {
    const textLower = text.toLowerCase()
    const patternLower = pattern.toLowerCase()
    let patternIdx = 0
    for (let i = 0; i < textLower.length && patternIdx < patternLower.length; i++) {
      if (textLower[i] === patternLower[patternIdx]) {
        patternIdx++
      }
    }
    return patternIdx === patternLower.length
  }

  // Date filter helper
  const isWithinDateRange = (dateStr: string, range: 'all' | 'today' | 'week'): boolean => {
    if (range === 'all') return true
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    if (range === 'today') return diffDays < 1
    if (range === 'week') return diffDays < 7
    return true
  }

  // Filter clips with smart search (auto-detect mode from input)
  const filteredClips = clips.filter(c => {
    // Date filter
    if (!isWithinDateRange(c.created_at, dateFilter)) return false
    
    // No search query
    if (!search) return true
    
    // Image type - no text search
    if (c.type === 'image') return false
    
    const content = c.content || ''
    
    // Auto-detect search mode from input
    // ~query = fuzzy search
    // /query/ = regex search
    // otherwise = normal search
    if (search.startsWith('~') && search.length > 1) {
      return fuzzyMatch(content, search.slice(1))
    } else if (search.startsWith('/') && search.endsWith('/') && search.length > 2) {
      try {
        const regex = new RegExp(search.slice(1, -1), 'i')
        return regex.test(content)
      } catch {
        return content.toLowerCase().includes(search.toLowerCase())
      }
    } else {
      return content.toLowerCase().includes(search.toLowerCase())
    }
  })

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if search input is focused and typing
      if (document.activeElement === searchInputRef.current && e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter' && e.key !== 'Escape') {
        return
      }

      if (filteredClips.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setFocusedIndex(prev => Math.min(prev + 1, filteredClips.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocusedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredClips[focusedIndex]) {
            handleSelect(filteredClips[focusedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          searchInputRef.current?.blur()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredClips, focusedIndex])

  // Reset focus when search changes
  useEffect(() => {
    setFocusedIndex(0)
  }, [search])

  // Scroll focused item into view
  useEffect(() => {
    if (listRef.current) {
      const focusedItem = listRef.current.querySelector('.clip-item.focused')
      if (focusedItem) {
        focusedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [focusedIndex])

  // Toggle clip in queue
  const toggleQueue = (id: number) => {
    setQueue(prev => {
      if (prev.includes(id)) {
        return prev.filter(qId => qId !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  // Paste next item from queue
  const pasteNextFromQueue = async () => {
    if (queue.length === 0 || !window.api) return
    const nextId = queue[0]
    const clip = clips.find(c => c.id === nextId)
    if (clip) {
      await window.api.writeClipboard({ id: clip.id, hash: clip.hash })
      setQueue(prev => prev.slice(1)) // Remove pasted item from queue
    }
  }
  
  const handlePin = async (id: number) => {
      if (!window.api) return
      await window.api.togglePin(id)
      loadClips()
  }
  
  const handleDelete = async (id: number) => {
      if (!window.api) return
      await window.api.deleteClip(id)
      loadClips()
  }
  
  const handleClear = async () => {
      if (!window.api) return
      setIsClearing(true)
      setQueue([]) // Clear the queue
      setQueueMode(false) // Disable queue mode
      setTimeout(async () => {
          await window.api.clearUnpinned()
          await loadClips()
          setIsClearing(false)
      }, 300)
  }

  const togglePrivate = () => {
      const newVal = !privateMode;
      setPrivateMode(newVal);
      if (window.api) {
        window.api.setPrivateMode(newVal);
      }
  }

  const handleSelect = async (clip: Clip) => {
      if (!window.api) return
      setSelectedId(clip.id)
      await window.api.writeClipboard({ id: clip.id, hash: clip.hash })
  }

  return (
    <div className="panel">
      <header>
        <input 
            ref={searchInputRef}
            className="search" 
            placeholder="Search clips..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
        />
        <button 
            className={`secondary private-toggle ${privateMode ? 'active' : ''}`} 
            onClick={togglePrivate}
            title="Private Mode (Pause Capture)"
        >
            {privateMode ? <Icons.EyeOff /> : <Icons.Eye />}
        </button>
      </header>
      
      <div className="sub-header">
        <div className="tab-switcher" style={{ '--active-index': dateFilter === 'all' ? 0 : dateFilter === 'today' ? 1 : 2 } as React.CSSProperties}>
          <div className="tab-slider" />
          <button 
            className={`tab-btn ${dateFilter === 'all' ? 'active' : ''}`}
            onClick={() => setDateFilter('all')}
          >All</button>
          <button 
            className={`tab-btn ${dateFilter === 'today' ? 'active' : ''}`}
            onClick={() => setDateFilter('today')}
          >Today</button>
          <button 
            className={`tab-btn ${dateFilter === 'week' ? 'active' : ''}`}
            onClick={() => setDateFilter('week')}
          >Week</button>
        </div>
        <div className="queue-controls">
          <button 
            className={`filter-btn ${queueMode ? 'active' : ''}`}
            onClick={() => setQueueMode(!queueMode)}
            title="Toggle queue mode - click clips to add to paste queue"
          >
            Queue {queueMode && queue.length > 0 ? `(${queue.length})` : ''}
          </button>
          {queueMode && queue.length > 0 && (
            <button 
              className="paste-queue-btn"
              onClick={pasteNextFromQueue}
              title="Paste next item from queue"
            >
              Paste
            </button>
          )}
        </div>
        <button className="clear-all-btn" onClick={handleClear} title="Clear all unpinned clips">
          Clear All
        </button>
      </div>
      
      <div className={`scroll-area ${isClearing ? 'clearing' : ''}`} ref={listRef}>
        {filteredClips.map((clip, index) => (
            <div 
                key={clip.id} 
                className={`clip-item ${clip.pinned ? 'pinned' : ''} ${clip.id === selectedId ? 'selected' : ''} ${index === focusedIndex ? 'focused' : ''} ${isClearing && !clip.pinned ? 'removing' : ''} ${queue.includes(clip.id) ? 'queued' : ''}`}
                style={isClearing && !clip.pinned ? { animationDelay: `${index * 50}ms` } : {}}
                ref={el => itemRefs.current[index] = el}
            >
                <div 
                    className="drag-handle"
                    draggable={true}
                    onDragStart={(e) => {
                        if (clip.type === 'text' && clip.content) {
                            e.dataTransfer.setData('text/plain', clip.content)
                            e.dataTransfer.effectAllowed = 'copy'
                        } else if (clip.type === 'image' && clip.image_data) {
                            const dataUrl = `data:image/png;base64,${bufferToBase64(clip.image_data)}`
                            e.dataTransfer.setData('text/uri-list', dataUrl)
                            e.dataTransfer.setData('text/plain', dataUrl)
                            e.dataTransfer.effectAllowed = 'copy'
                        }
                    }}
                    title="Drag to drop"
                >
                    <Icons.Drag />
                </div>
                {queue.includes(clip.id) && (
                  <div className="queue-badge">{queue.indexOf(clip.id) + 1}</div>
                )}
                <div 
                  className="clip-content" 
                  onClick={() => queueMode ? toggleQueue(clip.id) : handleSelect(clip)} 
                  title={queueMode ? "Click to add/remove from queue" : "Click to copy or drag to drop"}
                >
                    {clip.type === 'text' ? (
                        <div className="clip-text" title={clip.content?.slice(0, 1000)}>
                            {clip.content && clip.content.length > 300 
                                ? clip.content.slice(0, 300) + '...' 
                                : clip.content}
                        </div>
                    ) : (
                        clip.image_data ? (
                            <img 
                                src={`data:image/png;base64,${bufferToBase64(clip.image_data)}`} 
                                className="clip-image" 
                                alt="SmartClip Image" 
                            />
                        ) : <div>[Image Error]</div>
                    )}
                </div>
                <div className="clip-actions">
                    <button onClick={() => handlePin(clip.id)} title={clip.pinned ? "Unpin" : "Pin"}>
                        <Icons.Pin filled={clip.pinned} />
                    </button>
                    <button onClick={() => handleDelete(clip.id)} title="Delete" className="secondary icon-btn">
                        <Icons.Trash />
                    </button>
                </div>
            </div>
        ))}
        {filteredClips.length === 0 && (
            <div className="empty-state">
                <div className="empty-icon"><Icons.Clipboard /></div>
                <div className="empty-text">No clips yet</div>
                <div className="empty-hint">Copy something to get started</div>
            </div>
        )}
      </div>
      
      <div className="footer">
        <div style={{display: 'flex', alignItems: 'center', gap: 6}}><Icons.Lock /> Stored Locally</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <span style={{display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 11}}>
              <Icons.Keyboard /> Alt+V
            </span>
            <span>{filteredClips.length} items</span>
        </div>
      </div>
    </div>
  )
}
export default App
