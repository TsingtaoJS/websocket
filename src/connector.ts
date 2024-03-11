import EventEmitter from 'events'
import { readFileSync } from 'fs'
import http from 'http'
import https from 'https'
import { getLogger } from 'log4js'
import { Server } from 'ws'
import { Options } from '../types'
import Socket from './socket'

const logger = getLogger('connector')
let socketId = 0

export default class Connector extends EventEmitter {
    server: Server
    listening: boolean = false
    constructor(public opts: Options) {
        super()

        this.server = new Server({ noServer: true })
        this.server.on('connection', (ws, req) => {
            logger.debug('new connection', { ip: req.socket.remoteAddress })
            const socket = new Socket(++socketId, ws, {
                timeout: opts.timeout || 60000,
                ip: (req.headers['x-real-ip'] as string) || (req.socket.remoteAddress as string),
            })
            this.emit('connection', socket)
        })
    }

    listen(port?: string) {
        if (this.listening) return

        let server = this.opts.ssl
            ? https.createServer({
                  cert: readFileSync(this.opts.ssl.cert),
                  key: readFileSync(this.opts.ssl.key),
              })
            : http.createServer()

        server.on('upgrade', (req, socket, head) => {
            this.server.handleUpgrade(req, socket, head, (ws) => {
                this.server.emit('connection', ws, req)
            })
        })
        server.listen(port || this.opts.listen || '10081')
        this.listening = true
        logger.trace('listening on websocket')
    }

    shoutdown() {
        if (this.listening) {
            this.server.close()
            this.listening = false
            logger.trace('shoutdown websocket')
        }
    }
}
