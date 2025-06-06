import { createRoot } from 'react-dom/client'
import App from './App'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/es/locale/zh_CN'

const rootElement = document.getElementById('root') as HTMLElement
const root = createRoot(rootElement)

import '../styles/index.less'

root.render(
  <ConfigProvider
    theme={{
      algorithm: theme.defaultAlgorithm
    }}
    locale={zhCN}>
    <App/>
  </ConfigProvider>
)
