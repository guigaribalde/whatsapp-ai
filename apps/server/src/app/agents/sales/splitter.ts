import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'
import { openaiClient } from '@/lib/ai'

const splitter_prompt = `
You are an API that receives text and is capable of splitting it into multiple messages, returning with a JSON format.
You will be given a text in portuguese, and your job is to split into multiple messages if necessary.

Follow the rules and guidelines below.

<GUIDELINES>
  - You must split the text into multiple messages if it is too long.
  - Split the messages by context.
</GUIDELINES>

<RULES>
  - The answer must be in JSON format.
  - The json must be an array of strings, like the schema below:
  {
    "messages": [
      "message 1",
      "message 2",
      "message 3"
    ]
  }
  - Answer with the JSON only, nothing else.
  - Every message must be in portuguese.
</RULES>
`

const splitter_schema = z.object({
  messages: z.array(z.string()),
})

async function splitter(
  prompt: string,
): Promise<z.infer<typeof splitter_schema>> {
  const completion = await openaiClient.beta.chat.completions.parse({
    model: 'gpt-4o-2024-08-06',
    messages: [
      { role: 'system', content: splitter_prompt },
      { role: 'user', content: prompt },
    ],
    response_format: zodResponseFormat(splitter_schema, 'event'),
  })

  const res = completion.choices[0].message.parsed
  if (!res) throw new Error('Invalid response')

  return res
}

export { splitter }
