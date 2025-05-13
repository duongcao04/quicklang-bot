import * as TelegramBot from 'node-telegram-bot-api'
import { Stream } from 'stream'

export interface CommandHandler {
    command: string
    description: string
    handler: (msg: TelegramBot.Message, match: RegExpExecArray | null) => void
}

export interface MessageHandler {
    trigger: string | RegExp
    handler: (msg: TelegramBot.Message) => void
}

export default class TelegramBotService {
    private bot: TelegramBot
    private commands: CommandHandler[] = []
    private messageHandlers: MessageHandler[] = []

    constructor(
        token: string,
        options: TelegramBot.ConstructorOptions = { polling: true }
    ) {
        this.bot = new TelegramBot.default(token, options)
        this.initializeEventListeners()
    }

    /**
     * Khởi tạo các event listeners
     */
    private initializeEventListeners(): void {
        // Xử lý lỗi
        this.bot.on('polling_error', (error) => {
            console.error('Lỗi polling:', error)
        })

        // Xử lý tin nhắn
        this.bot.on('message', (msg) => {
            this.handleMessage(msg)
        })

        // Xử lý callback query (cho inline keyboards)
        this.bot.on('callback_query', (query) => {
            this.handleCallbackQuery(query)
        })
    }

    /**
     * Xử lý tin nhắn đến
     */
    private handleMessage(msg: TelegramBot.Message): void {
        if (!msg.text) return

        // Kiểm tra các message handlers
        for (const handler of this.messageHandlers) {
            if (typeof handler.trigger === 'string') {
                if (
                    msg.text
                        .toLowerCase()
                        .includes(handler.trigger.toLowerCase())
                ) {
                    handler.handler(msg)
                    return
                }
            } else if (handler.trigger instanceof RegExp) {
                if (handler.trigger.test(msg.text)) {
                    handler.handler(msg)
                    return
                }
            }
        }
    }

    /**
     * Xử lý callback query (cho inline keyboards)
     */
    private handleCallbackQuery(query: TelegramBot.CallbackQuery): void {
        if (!query.data) return

        // Bạn có thể thêm xử lý callback query tại đây
        this.bot.answerCallbackQuery(query.id)
    }

    /**
     * Đăng ký một lệnh mới
     */
    public registerCommand(command: CommandHandler): void {
        this.commands.push(command)
        this.bot.onText(new RegExp(`^/${command.command}`), (msg, match) => {
            command.handler(msg, match)
        })
    }

    /**
     * Đăng ký một message handler mới
     */
    public registerMessageHandler(handler: MessageHandler): void {
        this.messageHandlers.push(handler)
    }

    /**
     * Thiết lập menu lệnh cho bot
     */
    public setCommands(): void {
        const botCommands = this.commands.map((cmd) => ({
            command: cmd.command,
            description: cmd.description,
        }))

        this.bot.setMyCommands(botCommands)
    }

    /**
     * Gửi tin nhắn văn bản
     */
    public sendMessage(
        chatId: number | string,
        text: string,
        options?: TelegramBot.SendMessageOptions
    ): Promise<TelegramBot.Message> {
        return this.bot.sendMessage(chatId, text, options)
    }

    /**
     * Gửi hình ảnh
     */
    public sendPhoto(
        chatId: number | string,
        photo: string | Buffer | Stream,
        options?: TelegramBot.SendPhotoOptions
    ): Promise<TelegramBot.Message> {
        return this.bot.sendPhoto(chatId, photo, options)
    }

    /**
     * Gửi tài liệu/file
     */
    public sendDocument(
        chatId: number | string,
        doc: string | Buffer | Stream,
        options?: TelegramBot.SendDocumentOptions
    ): Promise<TelegramBot.Message> {
        return this.bot.sendDocument(chatId, doc, options)
    }

    /**
     * Gửi vị trí
     */
    public sendLocation(
        chatId: number | string,
        latitude: number,
        longitude: number,
        options?: TelegramBot.SendLocationOptions
    ): Promise<TelegramBot.Message> {
        return this.bot.sendLocation(chatId, latitude, longitude, options)
    }

    /**
     * Tạo bàn phím inline
     */
    public createInlineKeyboard(
        buttons: TelegramBot.InlineKeyboardButton[][]
    ): TelegramBot.InlineKeyboardMarkup {
        return {
            inline_keyboard: buttons,
        }
    }

    /**
     * Chỉnh sửa tin nhắn
     */
    public editMessageText(
        text: string,
        options: TelegramBot.EditMessageTextOptions
    ): Promise<TelegramBot.Message | boolean> {
        return this.bot.editMessageText(text, options)
    }

    /**
     * Lấy thông tin về bot
     */
    public getMe(): Promise<TelegramBot.User> {
        return this.bot.getMe()
    }

    /**
     * Dừng polling
     */
    public stopPolling(): Promise<void> {
        return this.bot.stopPolling()
    }
}
