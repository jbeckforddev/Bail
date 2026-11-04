import type { IncomingMessage } from 'http'
import WebSocket from 'ws'
import { DEFAULT_ORIGIN } from '../../Defaults'
import { AbstractSocketClient } from './types'

export class WebSocketClient extends AbstractSocketClient {
	protected socket: WebSocket | null = null

	get isOpen(): boolean {
		return this.socket?.readyState === WebSocket.OPEN
	}
	get isClosed(): boolean {
		return this.socket === null || this.socket?.readyState === WebSocket.CLOSED
	}
	get isClosing(): boolean {
		return this.socket === null || this.socket?.readyState === WebSocket.CLOSING
	}
	get isConnecting(): boolean {
		return this.socket?.readyState === WebSocket.CONNECTING
	}

	connect() {
		if (this.socket) {
			return
		}

		this.socket = new WebSocket(this.url, {
			origin: DEFAULT_ORIGIN,
			headers: this.config.options?.headers as {},
			handshakeTimeout: this.config.connectTimeoutMs,
			timeout: this.config.connectTimeoutMs,
			agent: this.config.agent,
			// Noise frames are already encrypted, so deflate burns CPU per frame and a zlib context per
			// socket to save nothing. ws offers the extension by default; this stops the offer.
			perMessageDeflate: false
		})

		this.socket.setMaxListeners(0)

		// Every WA frame is a complete message, so there is nothing for Nagle to coalesce: without
		// TCP_NODELAY a small ack or receipt can sit in the kernel for up to a round trip waiting for
		// company. Node's default https agent already disables Nagle, but a caller-supplied proxy
		// agent may not, so it is set explicitly once the upgraded socket is available. TCP keep-alive
		// lets the OS notice a dead link during idle stretches instead of waiting for the app ping.
		this.socket.once('upgrade', (response: IncomingMessage) => {
			const raw = response.socket
			raw?.setNoDelay?.(true)
			raw?.setKeepAlive?.(true, 30_000)
		})

		const events = ['close', 'error', 'upgrade', 'message', 'open', 'ping', 'pong', 'unexpected-response']

		for (const event of events) {
			this.socket?.on(event, (...args: any[]) => this.emit(event, ...args))
		}
	}

	async close() {
		if (!this.socket) {
			return
		}

		const closePromise = new Promise<void>(resolve => {
			this.socket?.once('close', resolve)
		})

		this.socket.close()

		await closePromise

		this.socket = null
	}
	send(str: string | Uint8Array, cb?: (err?: Error) => void): boolean {
		this.socket?.send(str, cb)

		return Boolean(this.socket)
	}
}