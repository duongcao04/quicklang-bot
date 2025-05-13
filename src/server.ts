import { envConfig } from '../config/envConfig'
import Logger from './helpers/logger'
import GoogleApiService from './lib/GoogleApiService'
import TelegramBotService from './lib/TelegramBotService'

class Main {
    constructor(
        private readonly googleApi = new GoogleApiService(
            envConfig.googleKeyFilePath
        ),
        private readonly bot = new TelegramBotService(envConfig.telegramToken),
        private readonly logger = new Logger()
    ) {}

    bootstrap() {
        this.logger.info('Server is running !')
        this.googleApi.initialize()
        this.botRegisterCommonCommand(this.bot)
        this.botLearningZoneCommand(this.bot)
    }

    private botRegisterCommonCommand(bot: TelegramBotService) {
        // Đăng ký lệnh mới
        bot.registerCommand({
            command: 'start',
            description: 'Bắt đầu bot',
            handler: (msg) => {
                bot.sendMessage(
                    msg.chat.id,
                    'Xin chào! Tôi là Quicklang Bot. Gõ /help để xem danh sách lệnh.'
                )
            },
        })

        bot.registerCommand({
            command: 'help',
            description: 'Hiển thị trợ giúp',
            handler: (msg) => {
                let helpText = '🤖 Danh sách lệnh\n'
                helpText += '/start - Bắt đầu bot\n'
                helpText += '/about - Về tôi\n'
                helpText += '/help - Hiển thị trợ giúp\n\n'
                helpText += '📚 Khu vực học tập\n'
                helpText += '/sheetlink - Liên kết Google Sheet\n'
                helpText += '/addenglishword - Thêm từ mới (tiếng Anh)\n'
                bot.sendMessage(msg.chat.id, helpText)
            },
        })

        bot.registerCommand({
            command: 'about',
            description: 'Về tôi',
            handler: (msg) => {
                let helpText = 'Xin chào, tôi là Dương 👋 \n'
                helpText +=
                    '👉 Lập trình viên với kinh nghiệm chuyên về Website, Ứng dụng di động, . . . \n\n'
                helpText += 'Liên hệ:\n'
                helpText += '👨‍🔧 Webiste: https://yangis.dev\n'
                helpText += '🧑‍💻 Github: https://github.com/duongcao04\n'
                helpText += '✉️ Gmail: caohaiduong04@gmail.com\n'
                helpText += '📖 Facebook: https://facebook.com/duongcaodev\n'
                bot.sendMessage(msg.chat.id, helpText)
            },
        })

        return this.logger.info('[ CHUNG ] - Đăng ký lệnh thành công!')
    }

    private botLearningZoneCommand(bot: TelegramBotService) {
        bot.registerCommand({
            command: 'sheetlink',
            description: 'Liên kết Google Sheet',
            handler: async (msg) => {
                const sheet = (
                    await this.googleApi.getSheetMetadata(
                        envConfig.spreadsheetId
                    )
                ).sheets
                console.log(sheet)
                let helpText = 'Google Sheet Link: '
                helpText += `https://docs.google.com/spreadsheets/d/${envConfig.spreadsheetId}`
                bot.sendMessage(msg.chat.id, helpText)
            },
        })

        bot.registerCommand({
            command: 'addenglishword',
            description: 'Thêm từ mới (tiếng Anh)',
            handler: async (msg) => {
                const sheet = (
                    await this.googleApi.getSheetMetadata(
                        envConfig.spreadsheetId
                    )
                ).sheets
                console.log(sheet)
                let helpText = 'Get'
                bot.sendMessage(msg.chat.id, helpText)
            },
        })

        return this.logger.info('[ HỌC TẬP ] - Đăng ký lệnh thành công!!')
    }
}

const app = new Main()
app.bootstrap()
