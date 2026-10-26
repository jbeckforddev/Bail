import type { MessageContentGenerationOptions } from '../../Types'
import { generateWAMessageContent } from '../../Utils/messages'

const options: MessageContentGenerationOptions = {
	upload: async () => ({
		mediaUrl: 'https://media.example/image',
		directPath: '/media/image'
	})
}

describe('group status message generation', () => {
	it('wraps text as a group status and keeps its background color', async () => {
		const message = await generateWAMessageContent(
			{ text: 'Group update', groupStatus: true },
			{ ...options, backgroundColor: '#123456' }
		)

		const textMessage = message.groupStatusMessageV2?.message?.extendedTextMessage
		expect(textMessage?.text).toBe('Group update')
		expect(textMessage?.backgroundArgb).toBe(0xff123456)
		expect(textMessage?.contextInfo?.isGroupStatus).toBe(true)
	})

	it('wraps prepared image media as a group status', async () => {
		const message = await generateWAMessageContent(
			{
				image: Buffer.from('test image'),
				jpegThumbnail: '',
				caption: 'Group photo',
				groupStatus: true
			},
			options
		)

		const imageMessage = message.groupStatusMessageV2?.message?.imageMessage
		expect(imageMessage?.caption).toBe('Group photo')
		expect(imageMessage?.url).toBe('https://media.example/image')
		expect(imageMessage?.contextInfo?.isGroupStatus).toBe(true)
	})

	it.each([
		{
			name: 'video',
			content: {
				video: Buffer.from('test video'),
				caption: 'Group video',
				seconds: 2,
				width: 640,
				height: 480,
				jpegThumbnail: ''
			},
			messageKey: 'videoMessage'
		},
		{
			name: 'video note',
			content: {
				video: Buffer.from('test video note'),
				ptv: true,
				seconds: 2,
				width: 640,
				height: 480,
				jpegThumbnail: ''
			},
			messageKey: 'ptvMessage'
		},
		{
			name: 'audio',
			content: {
				audio: Buffer.from('test audio'),
				seconds: 2
			},
			messageKey: 'audioMessage'
		},
		{
			name: 'voice note',
			content: {
				audio: Buffer.from('test voice note'),
				ptt: true,
				seconds: 2,
				waveform: new Uint8Array([1, 2, 3])
			},
			messageKey: 'audioMessage'
		},
		{
			name: 'sticker',
			content: {
				sticker: Buffer.from('test sticker'),
				width: 512,
				height: 512
			},
			messageKey: 'stickerMessage'
		},
		{
			name: 'document',
			content: {
				document: Buffer.from('test document'),
				mimetype: 'text/plain',
				fileName: 'group-status.txt',
				caption: 'Group document'
			},
			messageKey: 'documentMessage'
		}
	])('wraps $name media as a group status', async ({ content, messageKey }) => {
		const message = await generateWAMessageContent({ ...content, groupStatus: true }, options)

		const innerMessage = message.groupStatusMessageV2?.message
		expect(innerMessage).toHaveProperty(`${messageKey}.contextInfo.isGroupStatus`, true)
	})
})
