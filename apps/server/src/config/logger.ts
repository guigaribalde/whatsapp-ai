import { pino } from 'pino'
import cj from 'color-json'

const logger = (id: string) =>
  pino({
    timestamp: () => `,"time":"${new Date().toJSON()}"`,
    name: `wpp-${id}`,
    hooks: {
      logMethod(inputArgs, methodName) {
        if (typeof inputArgs[0] === 'string') methodName.apply(this, inputArgs)
        else {
          try {
            const json = inputArgs.shift()
            methodName.apply(this, [
              cj(json, {
                separator: 'black',
                string: 'yellow',
                number: 'blue',
                boolean: 'red',
                null: 'magenta',
                key: 'cyan',
              }),
              ...inputArgs,
            ])
          } catch {
            methodName.apply(this, inputArgs)
          }
        }
      },
    },
  })

export { logger }
