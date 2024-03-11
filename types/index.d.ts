declare interface Socket {
    readonly address: string
    readonly live: number
    readonly state: number

    send(binary: Buffer): number
    close(code: number): void

    on(event: 'message', listener: (binary: Buffer) => void): this
    on(event: 'close', listener: () => void): this
    on(event: 'timeout', listener: () => void): this
}

declare interface Connector {
    on(event: 'connection', listener: (socket: Socket) => void): this
    listen(port?: string): void
    shoutdown(): void
}

export declare interface Options {
    listen?: string
    ssl?: { cert: string; key: string }
    timeout?: number
}

export function createConnector(opts: Options): Connector
