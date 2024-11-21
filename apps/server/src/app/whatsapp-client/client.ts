import {
  DisconnectReason,
  makeWASocket,
  useMultiFileAuthState,
  type ConnectionState,
  type WAMessage,
  type MessageUpsertType,
  type proto,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import lodash from 'lodash'
import { env } from '@/config/env'
import { logger } from '@/config/logger'
import { type Logger } from 'pino'

const debounce = lodash.debounce

export class Client {
  id: string
  sock: ReturnType<typeof makeWASocket> = {} as ReturnType<typeof makeWASocket>
  logger: Logger

  handleText: (m: proto.IWebMessageInfo) => void
  handleAudio: (m: proto.IWebMessageInfo) => void
  handleImage: (m: proto.IWebMessageInfo) => void

  messages = new Map<string, string[]>()
  debounceMessages = debounce(
    async (id: string, callback: (text: string) => void) => {
      const messages = this.messages.get(id)
      if (!messages) return

      const message = messages.join('\n')
      this.messages.delete(id)
      if (env.NODE_ENV === 'development') {
        this.logger.info(`debounced message: ${message}`)
      }
      callback(message)
    },
    3000 * 1,
  )

  constructor(
    id: string,
    {
      handleText,
      handleAudio,
      handleImage,
    }: {
      handleText: (m: proto.IWebMessageInfo) => void
      handleAudio: (m: proto.IWebMessageInfo) => void
      handleImage: (m: proto.IWebMessageInfo) => void
    },
  ) {
    this.id = id
    this.logger = logger(this.id)
    this.handleText = handleText.bind(this)
    this.handleAudio = handleAudio.bind(this)
    this.handleImage = handleImage.bind(this)
  }

  async init(callback?: (qr: string) => void) {
    const { state, saveCreds } = await useMultiFileAuthState(this.id)
    this.sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      // @ts-expect-error because lib is not updated
      logger: this.logger,
    })

    this.sock.ev.on('creds.update', saveCreds)
    this.sock.ev.on('connection.update', update =>
      this.handleConnnectionUpdate.bind(this)(update, callback),
    )
    this.sock.ev.on('messages.upsert', msg =>
      this.handleMessagesUpsert.bind(this)(msg),
    )
  }

  handleConnnectionUpdate(
    update: Partial<ConnectionState>,
    callback?: (qr: string) => void,
  ) {
    const { connection, lastDisconnect } = update

    if (update.qr && callback) callback(update.qr)

    if (!lastDisconnect) return

    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut
      console.log(
        'connection closed due to ',
        lastDisconnect.error,
        ', reconnecting ',
        shouldReconnect,
      )
      if (shouldReconnect) {
        this.init()
      }
    } else if (connection === 'open') {
      console.log('opened connection')
    }
  }

  async handleMessagesUpsert(msg: {
    messages: WAMessage[]
    type: MessageUpsertType
    requestId?: string
  }) {
    const m = msg.messages[0]

    if (!m.message) return
    const messageType = Object.keys(m.message)[0]

    if (env.NODE_ENV === 'development') {
      this.logger.info(msg)
      if (m.key.remoteJid !== env.LOCAL_SESSION) return
    }
    // if (msg.type !== 'notify') return // Ignore sync messages

    if (!m.pushName?.length) return // do not answer to self

    if (messageType === 'conversation') return this.handleText(m)
    if (messageType === 'audioMessage') return this.handleAudio(m)
    if (messageType === 'imageMessage') return this.handleImage(m)
  }
}
