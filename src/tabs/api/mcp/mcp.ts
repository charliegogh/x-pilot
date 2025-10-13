// mcp-weather.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
// ToolHandler 类型定义（简化后）
interface ToolHandler {
    name: string
    description?: string
    parameters?: Record<string, any> // JSON Schema
    execute: (args: any) => Promise<any>
}
// 工具定义（get_weather）
const getWeatherTool: ToolHandler = {
  name: 'get_weather',
  description: '根据用户提供的位置查询天气信息',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: '要查询天气的城市，例如 "Beijing"、"Shanghai"'
      }
    },
    required: ['location']
  },
  execute: async({ location }: { location: string }) => {
    const result = `当前 ${location} 天气晴朗，气温 25°C，湿度 60%`
    return {
      result
    }
  }
}

// 创建 MCP 服务
const server = new McpServer({
  name: 'weather-mcp-service',
  version: '1.0.0',
  capabilities: {
    resources: {}, // 可为空
    tools: {
      get_weather: getWeatherTool
    }
  }
})

