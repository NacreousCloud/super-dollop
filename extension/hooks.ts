import { useEffect, useState } from 'react'

export function useActiveTab() {
  const [tab, setTab] = useState<{ id: number; url?: string } | undefined>(
    undefined
  )
  useEffect(() => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const t = tabs[0]
      if (t?.id != null) setTab({ id: t.id, url: t.url })
    })
  }, [])
  return tab
} 