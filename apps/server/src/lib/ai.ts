import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatAnthropic } from '@langchain/anthropic'
import { ChatOpenAI } from '@langchain/openai'
import OpenAI from 'openai'
import { env } from '@/config/env'

const openaiClient = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
})

const openai = new ChatOpenAI({
  apiKey: env.OPENAI_API_KEY,
})

const gemini = new ChatGoogleGenerativeAI({
  apiKey: env.GEMINI_API_KEY,
})

const anthropic = new ChatAnthropic({
  apiKey: env.ANTHROPIC_API_KEY,
})

// const SALES_AGENT_MODEL = new ChatGoogleGenerativeAI({
//   apiKey: env.GEMINI_API_KEY,
//   temperature: 0.6,
//   model: 'gemini-1.5-pro',
// })

const SALES_AGENT_MODEL = new ChatAnthropic({
  apiKey: env.ANTHROPIC_API_KEY,
  temperature: 0.6,
  model: 'claude-3-5-sonnet-latest',
})

const SPLITTER_MODEL = new ChatOpenAI({
  apiKey: env.OPENAI_API_KEY,
  temperature: 0.0,
  model: 'gpt-4o-mini',
})

const fireworks = new OpenAI({
  baseURL: 'https://api.fireworks.ai/inference/v1',
  apiKey: env.FIREWORKS_API_KEY,
})

export {
  fireworks,
  SALES_AGENT_MODEL,
  SPLITTER_MODEL,
  gemini,
  anthropic,
  openai,
  openaiClient,
}
