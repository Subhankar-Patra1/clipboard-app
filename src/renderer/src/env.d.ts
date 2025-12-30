
interface IApi {
  getClips: (limit?: number, offset?: number) => Promise<any[]>
  deleteClip: (id: number) => Promise<void>
  togglePin: (id: number) => Promise<void>
  clearUnpinned: () => Promise<void>
  writeClipboard: (item: { id: number, hash?: string }) => Promise<void>
  setPrivateMode: (enabled: boolean) => void
  disableWindowsClipboard: () => Promise<{ success: boolean; hotkeyRegistered?: boolean; error?: string }>
  checkWindowsClipboardStatus: () => Promise<{ enabled: boolean }>
  onClipboardUpdated: (callback: () => void) => () => void
  setWindowWidth: (width: number) => void
}

interface Window {
  electron: any
  api: IApi
}
