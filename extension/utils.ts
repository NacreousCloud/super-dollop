export function isRestrictedUrl(u: URL) {
  const host = u.hostname
  if (u.protocol === 'chrome:' || u.protocol === 'edge:' || u.protocol === 'about:') return true
  if (host === 'chrome.google.com' && u.pathname.startsWith('/webstore')) return true
  if (host === 'chromewebstore.google.com') return true
  return false
}

export async function ensureContentScript(tabId: number): Promise<boolean> {
  const ping = (): Promise<boolean> =>
    new Promise((resolve) => {
      try {
        chrome.tabs.sendMessage(tabId, { type: 'PING' }, (resp) => {
          const ok = !chrome.runtime.lastError && !!resp?.ok
          resolve(ok)
        })
      } catch {
        resolve(false)
      }
    })

  if (await ping()) return true

  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] })
  } catch {
    // ignore
  }
  return ping()
} 