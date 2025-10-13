export function parseStreamChunk(
  chunk: Uint8Array,
  buffer = ''
): {
  contents: string[];
  isDone: boolean;
  buffer: string;
  toolCallStream?: Record<string, { name: string; arguments: string }>;
  toolCallFinish?: boolean;
} {
  const decoder = new TextDecoder('utf-8')
  const text = buffer + decoder.decode(chunk, { stream: true })

  const lines = text.split('\n')
  const contents: string[] = []
  let remainingBuffer = ''
  let isDone = false
  const toolCallStream: Record<string, { name: string; arguments: string }> = {}
  let toolCallFinish = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    if (line === 'data: [DONE]') {
      isDone = true
      continue
    }

    if (!line.startsWith('data:')) continue

    const jsonStr = line.replace('data: ', '')
    const isLastLine = i === lines.length - 1

    if (isLastLine && !jsonStr.endsWith('}') && !jsonStr.endsWith(']')) {
      remainingBuffer = line
      continue
    }

    try {
      const json = JSON.parse(jsonStr)
      const choice = json.choices?.[0]
      const content = choice?.delta?.content
      const finishReason = choice?.finish_reason

      if (typeof content === 'string') contents.push(content)

      if (choice?.delta?.tool_calls) {
        for (const toolCall of choice.delta.tool_calls) {
          const id = toolCall.id ?? `call_${toolCall.index}`
          const name = toolCall.function?.name ?? ''
          const argChunk = toolCall.function?.arguments ?? ''

          if (!toolCallStream[id]) {
            toolCallStream[id] = { name, arguments: '' }
          }

          toolCallStream[id].arguments += argChunk
        }
      }

      if (finishReason === 'tool_calls') {
        toolCallFinish = true
      }

      if (finishReason === 'stop') {
        isDone = true
      }
    } catch (err) {
      console.warn('JSON 解析失败，跳过:', jsonStr)
    }
  }

  return {
    contents,
    isDone,
    buffer: remainingBuffer,
    toolCallStream,
    toolCallFinish
  }
}
