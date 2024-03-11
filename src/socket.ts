import EventEmitter from 'events'
import { getLogger } from 'log4js'
import { clearInterval } from 'timers'
import { WebSocket } from 'ws'

const logger = getLogger('websocket')

export default class Socket extends EventEmitter {
    _socket: WebSocket
    _address: string
    _alive: number = Date.now()
    _active: number = Date.now()
    _timer: NodeJS.Timeout | undefined
    constructor(public id: number, ws: WebSocket, opts: { ip: string; timeout: number }) {
        super()
        this._socket = ws
        this._socket.binaryType = 'arraybuffer'

        this._address = opts.ip

        this._socket.on('message', (chunk: ArrayBuffer) => {
            logger.trace('receive message', { bytes: chunk.byteLength, id: this.id, ip: this.address })
            if (chunk.byteLength > 0) {
                this._active = Date.now()
                this.emit('message', Buffer.from(chunk))
            } else {
                this.close()
            }
        })

        this._socket.on('close', () => {
            if (this._timer) {
                clearInterval(this._timer)
            }
            logger.trace('socket closed', { id: this.id, ip: this.address })
            this.emit('close')
        })

        this._socket.on('error', (err) => {
            logger.error('socket crashed', { id: this.id, ip: this.address, message: err.message })
            this.close()
        })

        this._timer = setInterval(() => {
            if (Date.now() - this._active > opts.timeout) {
                logger.debug('socket timeout', { id: this.id, ip: this.address })
                this.emit('timeout')
                this.close()
            }
        }, 1000)
    }

    get address() {
        return this._address
    }

    get live() {
        return Date.now() - this._alive
    }

    get state() {
        return this._socket.readyState
    }

    send(binary: Buffer) {
        if (this.state === WebSocket.OPEN) {
            this._socket.send(binary)
            logger.trace('send message', { bytes: binary.length, id: this.id, ip: this.address })
            return binary.length
        }
        logger.warn('socket not open', { id: this.id, ip: this.address, state: this.state })
        return 0
    }

    close(code: number = 1000) {
        if (this.state === WebSocket.OPEN || this.state === WebSocket.CONNECTING) {
            this._socket.close(code)
        }
    }
}
