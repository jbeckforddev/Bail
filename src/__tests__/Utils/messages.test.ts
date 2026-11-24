import { proto } from '../../../WAProto/index.js'
import { assertMediaContent, normalizeMessageContent } from '../../Utils/messages'

describe('audioStickerMessage', () => {
	it('normalizes the FutureProof wrapper to its inner message', () => {
		const content = proto.Message.create({
			audioStickerMessage: {
				message: {
					audioMessage: {
						mimetype: 'audio/ogg; codecs=opus',
						ptt: true
					}
				}
			}
		})

		expect(normalizeMessageContent(content)?.audioMessage?.mimetype).toBe('audio/ogg; codecs=opus')
	})

	it('recognizes the inner media content', () => {
		const content = proto.Message.create({
			audioStickerMessage: {
				message: {
					stickerMessage: {
						mimetype: 'image/webp'
					}
				}
			}
		})

		expect(assertMediaContent(content)).toBe(content.audioStickerMessage?.message?.stickerMessage)
	})
})
