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
})
