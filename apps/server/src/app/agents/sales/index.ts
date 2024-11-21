import { fireworks } from '@/lib/ai'
import { system_prompt } from './system-prompt'
import { logger as baseLogger } from '@/config/logger'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

const logger = baseLogger('sales-agent')

const agent = {
  handle: async (message: string, history: Message[]) => {
    const completion = await fireworks.chat.completions.create({
      temperature: 0.6,
      model: 'accounts/fireworks/models/llama-v3p1-405b-instruct',
      messages: [
        {
          role: 'system',
          content: system_prompt,
        },
        ...history,
        { role: 'user', content: message },
      ],
    })

    const inputTokens = completion.usage?.prompt_tokens || 0
    const outputTokens = completion.usage?.completion_tokens || 0
    const tokenPrice = (3 * 6) / 1_000_000
    const totalCost = (inputTokens + outputTokens) * tokenPrice
    logger.info(completion)
    logger.info(`Total cost: R$${totalCost} BRL`)

    return completion.choices[0].message.content || ''
  },
}

export { agent }
