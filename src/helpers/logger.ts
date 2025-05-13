import chalk from 'chalk'
import fs from 'fs'
import path from 'path'

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export default class Logger {
    private prefix: string
    private logFile: string

    constructor(prefix: string = '', logFile: string = 'app.log') {
        this.prefix = prefix
        this.logFile = path.join(__dirname, logFile)
    }

    private log(level: LogLevel, message: string): void {
        const timestamp = new Date().toISOString()
        const logMessage = `[${timestamp}]${this.prefix.length > 0 ? `${this.prefix} ` : ''}: ${message}`

        // Thêm màu cho các cấp độ
        const coloredMessage = this.getColoredMessage(level, logMessage)

        // Ghi log ra console
        console.log(coloredMessage)

        // Ghi log vào file
        try {
            fs.appendFileSync(this.logFile, logMessage + '\n')
        } catch (error) {
            console.error(
                chalk.red(`[LOGGER ERROR]: Unable to write to file - ${error}`)
            )
        }
    }

    private getColoredMessage(level: LogLevel, message: string): string {
        switch (level) {
            case 'info':
                return chalk.green(message) // Màu xanh
            case 'warn':
                return chalk.yellow(message) // Màu vàng
            case 'error':
                return chalk.red(message) // Màu đỏ
            case 'debug':
                return chalk.gray(message) // Màu xám
            default:
                return message
        }
    }

    public info(message: string): void {
        this.log('info', message)
    }

    public warn(message: string): void {
        this.log('warn', message)
    }

    public error(message: string): void {
        this.log('error', message)
    }

    public debug(message: string): void {
        this.log('debug', message)
    }
}
