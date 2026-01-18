import { ChatClient } from './types'
export async function loadClientByModel(model:string): Promise<ChatClient> {
  switch (model) {
    case 'deepseek':
      return (await import('./deepSeek')).default
    case 'Qwen3':
      return (await import('./Qwen')).default
    default:
      throw new Error(`未支持的模型类型: ${model}`)
  }
}
