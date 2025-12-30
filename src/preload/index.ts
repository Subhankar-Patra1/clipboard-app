import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getClips: (limit = 50, offset = 0) => ipcRenderer.invoke('get-clips', { limit, offset }),
  deleteClip: (id: number) => ipcRenderer.invoke('delete-clip', id),
  togglePin: (id: number) => ipcRenderer.invoke('toggle-pin', id),
  clearUnpinned: () => ipcRenderer.invoke('clear-unpinned'),
  writeClipboard: (item: {id: number, hash?: string}) => ipcRenderer.invoke('write-clipboard', item),
  setPrivateMode: (enabled: boolean) => ipcRenderer.send('set-private-mode', enabled),
  disableWindowsClipboard: () => ipcRenderer.invoke('disable-windows-clipboard'),
  checkWindowsClipboardStatus: () => ipcRenderer.invoke('check-windows-clipboard-status'),
  onClipboardUpdated: (callback: () => void) => {
    ipcRenderer.on('clipboard-updated', callback)
    return () => ipcRenderer.removeListener('clipboard-updated', callback)
  },
  setWindowWidth: (width: number) => ipcRenderer.send('set-window-width', width)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in d.ts)
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
