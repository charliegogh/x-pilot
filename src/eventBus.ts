type EventCallback = (params: any, sendResponse: (data: any) => void) => void

// 获取当前活动标签页
const getCurrentTab = async() => {
  return new Promise<chrome.tabs.Tab>((resolve) => {
    chrome.runtime.sendMessage({ action: 'get-current-visible-tab' }, (tab) => {
      resolve(tab)
    })
  })
}

const eventBus = {
  emit(event: string, params: any): void {
    chrome.runtime.sendMessage({ action: event, params })
  },

  // popup → content-script（通过 background 中转）
  async emitContentScript(event: string, params: any): Promise<any> {
    const tab = await getCurrentTab()
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: '__TO_CONTENT_SCRIPT__',
          innerAction: event,
          params,
          tabId: tab.id
        },
        (response) => {
          resolve(response)
        }
      )
    })
  },

  // content-script 监听消息
  on(event: string, callback: EventCallback) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === event) {
        callback(message.params, sendResponse)
        return true
      }
    })
  }
}

export default eventBus
