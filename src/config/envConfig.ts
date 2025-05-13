import 'dotenv'

export const envConfig = {
    telegramToken: process.env.TELEGRAM_TOKEN || '',
    googleKeyFilePath: process.env.GOOGLE_KEY_FILE_PATH || '',
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID || '',
}
