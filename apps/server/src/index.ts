import { app } from './app'
import { serve } from '@hono/node-server'
import { env } from '@env'

serve({ ...app, port: +(env.PORT as string) }, info => {
  console.log(`Listening on http://localhost:${info.port}`)
})
