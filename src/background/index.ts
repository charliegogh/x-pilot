let currentVisibleTab: chrome.tabs.Tab | null = null

const updateVisibleTab = async() => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  currentVisibleTab = tab
}

// 初始化时执行一次
updateVisibleTab()

// 监听 tab 激活变化
chrome.tabs.onActivated.addListener(updateVisibleTab)

// 监听窗口焦点变化
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) updateVisibleTab()
})

// 提供访问接口：响应 popup 或其他页面发来的请求
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'get-current-visible-tab') {
    sendResponse(currentVisibleTab)
    return true
  }
})

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.setOptions({
    tabId: tab.id,
    path: '/src/tabs/sidepanel.html'
  })
  // @ts-ignore
  chrome.sidePanel?.open({
    tabId: tab.id
  })
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === '__TO_CONTENT_SCRIPT__') {
    const { innerAction, params, tabId } = message
    if (!tabId) return

    chrome.tabs.sendMessage(
      tabId,
      { action: innerAction, params },
      (response) => {
        sendResponse(response)
      }
    )

    return true
  }
})

