chrome.runtime.onInstalled.addListener(() => {
  // Open side panel when the toolbar action icon is clicked
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {})
})

// Optional: forward messages or coordinate between side panel and content scripts in future 