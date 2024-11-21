import { v4 as uuidv4 } from 'uuid'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { promises as fs } from 'fs'
import { openaiClient as openai } from '@/lib/ai'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

const converter = {
  audio: {
    opusToMp3: async (buffer: Buffer) => {
      const tempOpusFile = `temp-${uuidv4()}.opus`
      const tempMp3File = `temp-${uuidv4()}.mp3`

      try {
        await fs.writeFile(tempOpusFile, buffer)

        await new Promise((resolve, reject) => {
          ffmpeg()
            .input(tempOpusFile)
            .toFormat('mp3')
            .on('error', reject)
            .on('end', resolve)
            .save(tempMp3File)
        })

        const mp3Buffer = await fs.readFile(tempMp3File)

        await fs.unlink(tempOpusFile)
        await fs.unlink(tempMp3File)

        return mp3Buffer
      } catch (error) {
        try {
          await fs.unlink(tempOpusFile)
          await fs.unlink(tempMp3File)
        } catch (err) {
          console.error(err)
        }
        throw error
      }
    },
    toText: async (buffer: Buffer) => {
      const mp3Buffer = await converter.audio.opusToMp3(buffer)

      const file = new File([mp3Buffer], 'audio.mp3', { type: 'audio/mp3' })

      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
      })

      return transcription.text
    },
  },
  image: {
    toText: async (image_url: string) => {
      const systemPrompt = `
Você é um fotografo responsável por descrever o que você vê em imagens.
Seu trabalho é descrever com riqueza e detalhe o que você vê em uma imagem.
Você não deve mencionar que está vendo uma imagem, mas apenas descrever a imagem em sí, sem fazer menção a "vejo", "estou vendo" ou "estou lendo", "uma imagem de".
`
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'O que você vê na imagem?' },
              {
                type: 'image_url',
                image_url: {
                  url: image_url,
                },
              },
            ],
          },
        ],
      })
      return response.choices[0].message.content
    },
  },
  text: {
    toOpus: async (text: string) => {
      // const opus = await openai.audio.speech.create({
      //   model: "tts-1-hd",
      //   voice: "echo",
      //   response_format: "opus",
      //   input: response,
      // })
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-audio-preview-2024-10-01',
        modalities: ['text', 'audio'],
        audio: { voice: 'shimmer', format: 'opus' },
        messages: [
          {
            role: 'system',
            content: `
Você é um assistente que repete exatamente as palavras que o usuário fala.
Não troque nem adicione palavras, apenas repita.
Você deve responder em português e em uma voz animada.
`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
      })

      if (res.choices[0].message.audio) {
        const opus = res.choices[0].message.audio.data
        return opus
      }

      throw new Error('Opus not found')
    },
  },
}

export { converter }
