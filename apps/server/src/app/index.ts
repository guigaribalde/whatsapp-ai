import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { Client } from './whatsapp-client/client'
import { converter } from '@/utils/media-converter'
import { agent } from './agents/sales'
import { logger as baseLogger } from '@/config/logger'

// function delay(t: number) {
//   return new Promise(resolve => setTimeout(resolve, t))
// }

export async function whatsappSalesAssistant(id: string) {
  const logger = baseLogger(id)
  const whatsapp = new Client(id, {
    handleText: async m => {
      const senderId = m.key.remoteJid
      if (!senderId) return
      if (!m.message) return
      const content =
        m.message.conversation || m.message.extendedTextMessage?.text || ''

      if (!whatsapp.messages.has(senderId)) whatsapp.messages.set(senderId, [])
      whatsapp.messages.get(senderId)?.push(content)

      // const autoResponse = await agent.handle(content, [])
      // const typing_speed = autoResponse.length / 1.7 // a person types at 1.6 cps
      //
      // console.log(autoResponse)
      // console.log('debounce time: ', typing_speed / 10)
      //
      // debounce(async (id: string) => {
      //   const messages = whatsapp.messages.get(id)
      //   if (!messages) return
      //   if (messages.length === 1) {
      //     const { messages: responses } = await splitter(String(autoResponse))
      //     for (let i = 0; i < responses.length; i++) {
      //       const wait = autoResponse.length / 1.7 // a person types at 1.6 cps
      //       if (i !== 0) await delay(wait * 100)
      //       await whatsapp.sock.sendMessage(senderId, {
      //         text: String(responses[i]),
      //       })
      //     }
      //     return
      //   }
      //
      //   const message = messages.join('\n')
      //   whatsapp.messages.delete(id)
      //   if (env.NODE_ENV === 'development') {
      //     whatsapp.logger.info(`debounced message: ${message}`)
      //   }
      //
      //   const response = await agent.handle(message, [])
      //   console.log('final response:: ', response)
      //   const { messages: responses } = await splitter(String(response))
      //   for (let i = 0; i < responses.length; i++) {
      //     const wait = response.length / 1.7 // a person types at 1.6 cps
      //     if (i !== 0) await delay(wait * 100)
      //     await whatsapp.sock.sendMessage(senderId, {
      //       text: String(responses[i]),
      //     })
      //   }
      // }, 100 * typing_speed)(senderId)

      whatsapp.sock.sendPresenceUpdate('composing', senderId)
      whatsapp.debounceMessages(senderId, async text => {
        const response = await agent.handle(text, [])
        await whatsapp.sock.sendMessage(senderId, {
          text: String(response),
        })
      })
    },

    handleAudio: async m => {
      const senderId = m.key.remoteJid
      if (!senderId) return
      const buffer = await downloadMediaMessage(
        m,
        'buffer',
        {},
        {
          // @ts-expect-error because lib is not updated
          logger,
          reuploadRequest: whatsapp.sock.updateMediaMessage,
        },
      )

      const text = await converter.audio.toText(buffer)
      await whatsapp.sock.sendMessage(senderId, {
        text,
      })
    },

    handleImage: async m => {
      const senderId = m.key.remoteJid
      if (!senderId) return

      const buffer = await downloadMediaMessage(
        m,
        'buffer',
        {},
        {
          // @ts-expect-error because lib is not updated
          logger,
          reuploadRequest: whatsapp.sock.updateMediaMessage,
        },
      )

      const base64 = `data:${m.message?.imageMessage?.mimetype};base64,${buffer.toString('base64')}`
      const text = await converter.image.toText(base64)

      if (!text) return

      await whatsapp.sock.sendMessage(senderId, {
        text,
      })
    },
  })

  await whatsapp.init(qr => {
    console.log('here', { qr })
  })
}
