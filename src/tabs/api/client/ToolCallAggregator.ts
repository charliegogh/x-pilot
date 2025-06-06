type ToolCallPart = {
  id: string;
  name: string;
  arguments: string;
};

export class ToolCallAggregator {
  private calls: Record<string, ToolCallPart> = {}

  public append(toolCalls: { id: string; index: number; function: { name?: string; arguments: string } }[]) {
    for (const call of toolCalls) {
      const id = call.id ?? `call_${call.index}`
      if (!this.calls[id]) {
        this.calls[id] = {
          id,
          name: call.function.name || '', // ✅ 初始 name 存储
          arguments: ''
        }
      }
      this.calls[id].arguments += call.function.arguments
    }
  }

  public getFinalToolCalls(): {
    id: string;
    type: 'function';
    function: { name: string; arguments: any };
  }[] {
    const calls = Object.values(this.calls)

    const grouped: Record<string, {
      finalId: string; // ✅ 用于最终输出的长 ID
      name: string;
      arguments: string;
    }> = {}

    for (const call of calls) {
      const baseId = call.id.split('_')[0] + '_' + call.id.split('_')[1] // e.g. call_0

      if (!grouped[baseId]) {
        grouped[baseId] = { finalId: call.id, name: '', arguments: '' }
      }

      if (call.name) {
        grouped[baseId].name = call.name
        grouped[baseId].finalId = call.id
      }

      if (call.arguments) {
        grouped[baseId].arguments = call.arguments
      }
    }

    return Object.values(grouped).map(({ finalId, name, arguments: args }) => {
      let parsedArgs = {}
      try {
        parsedArgs = typeof args === 'string' ? JSON.parse(args) : args
      } catch {
        parsedArgs = {}
      }

      return {
        id: finalId,
        type: 'function',
        function: {
          name,
          arguments: parsedArgs
        }
      }
    })
  }

  public reset() {
    this.calls = {}
  }
}
