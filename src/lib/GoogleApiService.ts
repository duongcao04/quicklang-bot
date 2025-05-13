import { GoogleAuth, JWT } from 'google-auth-library'
import { calendar_v3, drive_v3, gmail_v1, google, sheets_v4 } from 'googleapis'

export type GoogleApiServices = 'sheets' | 'drive' | 'gmail' | 'calendar'

export type SheetAppendOptions = {
    spreadsheetId: string
    range: string
    valueInputOption?: 'RAW' | 'USER_ENTERED'
    values: any[][]
}

export type SheetUpdateOptions = {
    spreadsheetId: string
    range: string
    valueInputOption?: 'RAW' | 'USER_ENTERED'
    values: any[][]
}

export type SheetReadOptions = {
    spreadsheetId: string
    range: string
    valueRenderOption?: 'FORMATTED_VALUE' | 'UNFORMATTED_VALUE' | 'FORMULA'
}

export type SheetDeleteOptions = {
    spreadsheetId: string
    range: string
}

export type SheetBatchUpdateOptions = {
    spreadsheetId: string
    ranges: string[]
    valueInputOption?: 'RAW' | 'USER_ENTERED'
    data: any[][][]
}

export type DriveFileOptions = {
    name: string
    mimeType?: string
    parents?: string[]
    fields?: string
}

export default class GoogleApiService {
    private auth: GoogleAuth
    private client!: JWT
    private services: Map<GoogleApiServices, any> = new Map()

    /**
     * Khởi tạo GoogleApiService
     * @param keyFilePath Đường dẫn đến file credentials JSON
     * @param scopes Các quyền truy cập API
     */
    constructor(
        keyFilePath: string,
        scopes: string[] = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/calendar',
        ]
    ) {
        this.auth = new google.auth.GoogleAuth({
            keyFile: keyFilePath,
            scopes: scopes,
        })
    }

    /**
     * Khởi tạo client authentication
     */
    public async initialize(): Promise<void> {
        try {
            this.client = (await this.auth.getClient()) as JWT
            console.log('Google API client được khởi tạo thành công')
        } catch (error) {
            console.error('Lỗi khi khởi tạo Google API client:', error)
            throw new Error('Không thể xác thực với Google API')
        }
    }

    /**
     * Lấy instance của service Google API
     * @param service Tên service cần sử dụng
     * @returns Instance của service
     */
    public getService<T>(service: GoogleApiServices): T {
        if (!this.client) {
            throw new Error(
                'Client chưa được khởi tạo. Hãy gọi initialize() trước.'
            )
        }

        if (this.services.has(service)) {
            return this.services.get(service) as T
        }

        let serviceInstance: any

        switch (service) {
            case 'sheets':
                serviceInstance = google.sheets({
                    version: 'v4',
                    auth: this.client,
                })
                break
            case 'drive':
                serviceInstance = google.drive({
                    version: 'v3',
                    auth: this.client,
                })
                break
            case 'gmail':
                serviceInstance = google.gmail({
                    version: 'v1',
                    auth: this.client,
                })
                break
            case 'calendar':
                serviceInstance = google.calendar({
                    version: 'v3',
                    auth: this.client,
                })
                break
            default:
                throw new Error(`Service không được hỗ trợ: ${service}`)
        }

        this.services.set(service, serviceInstance)
        return serviceInstance as T
    }

    /**
     * Lấy thông tin về Google Spreadsheet
     * @param spreadsheetId ID của spreadsheet
     * @returns Metadata của spreadsheet
     */
    public async getSheetMetadata(
        spreadsheetId: string
    ): Promise<sheets_v4.Schema$Spreadsheet> {
        try {
            const sheets = this.getService<sheets_v4.Sheets>('sheets')
            const response = await sheets.spreadsheets.get({
                spreadsheetId,
            })
            return response.data
        } catch (error) {
            console.error('Lỗi khi lấy metadata của spreadsheet:', error)
            throw error
        }
    }

    /**
     * Đọc dữ liệu từ spreadsheet
     * @param options Thông tin về spreadsheet và range cần đọc
     * @returns Dữ liệu từ spreadsheet
     */
    public async readSheetData(options: SheetReadOptions): Promise<any[][]> {
        try {
            const sheets = this.getService<sheets_v4.Sheets>('sheets')
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: options.spreadsheetId,
                range: options.range,
                valueRenderOption:
                    options.valueRenderOption || 'FORMATTED_VALUE',
            })
            return response.data.values || []
        } catch (error) {
            console.error('Lỗi khi đọc dữ liệu từ spreadsheet:', error)
            throw error
        }
    }

    /**
     * Đọc dữ liệu từ spreadsheet và chuyển đổi thành mảng đối tượng
     * @param options Thông tin về spreadsheet và range cần đọc
     * @returns Mảng đối tượng với keys từ hàng đầu tiên
     */
    public async readSheetDataAsObjects<T>(
        options: SheetReadOptions
    ): Promise<T[]> {
        try {
            const data = await this.readSheetData(options)
            if (data.length < 2) {
                return []
            }

            const headers = data[0]
            const rows = data.slice(1)

            return rows.map((row) => {
                const obj: any = {}
                headers.forEach((header, index) => {
                    obj[header] = row[index] !== undefined ? row[index] : null
                })
                return obj as T
            })
        } catch (error) {
            console.error(
                'Lỗi khi đọc dữ liệu dạng đối tượng từ spreadsheet:',
                error
            )
            throw error
        }
    }

    /**
     * Thêm dữ liệu vào spreadsheet
     * @param options Thông tin về spreadsheet và dữ liệu cần thêm
     * @returns Kết quả thêm dữ liệu
     */
    public async appendSheetData(
        options: SheetAppendOptions
    ): Promise<sheets_v4.Schema$AppendValuesResponse> {
        try {
            const sheets = this.getService<sheets_v4.Sheets>('sheets')
            const response = await sheets.spreadsheets.values.append({
                spreadsheetId: options.spreadsheetId,
                range: options.range,
                valueInputOption: options.valueInputOption || 'USER_ENTERED',
                requestBody: {
                    values: options.values,
                },
            })
            return response.data
        } catch (error) {
            console.error('Lỗi khi thêm dữ liệu vào spreadsheet:', error)
            throw error
        }
    }

    /**
     * Cập nhật dữ liệu trong spreadsheet
     * @param options Thông tin về spreadsheet và dữ liệu cần cập nhật
     * @returns Kết quả cập nhật dữ liệu
     */
    public async updateSheetData(
        options: SheetUpdateOptions
    ): Promise<sheets_v4.Schema$UpdateValuesResponse> {
        try {
            const sheets = this.getService<sheets_v4.Sheets>('sheets')
            const response = await sheets.spreadsheets.values.update({
                spreadsheetId: options.spreadsheetId,
                range: options.range,
                valueInputOption: options.valueInputOption || 'USER_ENTERED',
                requestBody: {
                    values: options.values,
                },
            })
            return response.data
        } catch (error) {
            console.error('Lỗi khi cập nhật dữ liệu trong spreadsheet:', error)
            throw error
        }
    }

    /**
     * Xóa dữ liệu trong spreadsheet
     * @param options Thông tin về spreadsheet và range cần xóa
     * @returns Kết quả xóa dữ liệu
     */
    public async clearSheetData(
        options: SheetDeleteOptions
    ): Promise<sheets_v4.Schema$ClearValuesResponse> {
        try {
            const sheets = this.getService<sheets_v4.Sheets>('sheets')
            const response = await sheets.spreadsheets.values.clear({
                spreadsheetId: options.spreadsheetId,
                range: options.range,
            })
            return response.data
        } catch (error) {
            console.error('Lỗi khi xóa dữ liệu trong spreadsheet:', error)
            throw error
        }
    }

    /**
     * Cập nhật hàng loạt dữ liệu trong spreadsheet
     * @param options Thông tin về spreadsheet và dữ liệu cần cập nhật
     * @returns Kết quả cập nhật dữ liệu
     */
    public async batchUpdateSheetData(
        options: SheetBatchUpdateOptions
    ): Promise<sheets_v4.Schema$BatchUpdateValuesResponse> {
        try {
            const sheets = this.getService<sheets_v4.Sheets>('sheets')

            const data = options.ranges.map((range, index) => {
                return {
                    range: range,
                    values: options.data[index],
                }
            })

            const response = await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId: options.spreadsheetId,
                requestBody: {
                    valueInputOption:
                        options.valueInputOption || 'USER_ENTERED',
                    data: data,
                },
            })
            return response.data
        } catch (error) {
            console.error('Lỗi khi cập nhật hàng loạt dữ liệu:', error)
            throw error
        }
    }

    /**
     * Tạo spreadsheet mới
     * @param title Tiêu đề của spreadsheet
     * @param sheets Danh sách các sheet cần tạo
     * @returns Spreadsheet đã tạo
     */
    public async createSpreadsheet(
        title: string,
        sheets?: string[]
    ): Promise<sheets_v4.Schema$Spreadsheet> {
        try {
            const sheetsService = this.getService<sheets_v4.Sheets>('sheets')

            const sheetObjects = sheets
                ? sheets.map((sheetTitle) => ({
                      properties: { title: sheetTitle },
                  }))
                : [{ properties: { title: 'Sheet1' } }]

            const response = await sheetsService.spreadsheets.create({
                requestBody: {
                    properties: {
                        title: title,
                    },
                    sheets: sheetObjects,
                },
            })
            return response.data
        } catch (error) {
            console.error('Lỗi khi tạo spreadsheet mới:', error)
            throw error
        }
    }

    /**
     * Liệt kê các file trên Google Drive
     * @param query Query tìm kiếm
     * @param pageSize Số lượng kết quả trên mỗi trang
     * @param pageToken Token cho trang tiếp theo
     * @returns Danh sách các file
     */
    public async listDriveFiles(
        query?: string,
        pageSize: number = 100,
        pageToken?: string
    ): Promise<drive_v3.Schema$FileList> {
        try {
            const drive = this.getService<drive_v3.Drive>('drive')
            const response = await drive.files.list({
                q: query,
                pageSize: pageSize,
                pageToken: pageToken,
                fields: 'nextPageToken, files(id, name, mimeType, createdTime, modifiedTime, webViewLink)',
            })
            return response.data
        } catch (error) {
            console.error('Lỗi khi liệt kê files từ Drive:', error)
            throw error
        }
    }

    /**
     * Tạo folder mới trên Google Drive
     * @param folderName Tên folder
     * @param parentFolderId ID của folder cha (không bắt buộc)
     * @returns Thông tin folder đã tạo
     */
    public async createDriveFolder(
        folderName: string,
        parentFolderId?: string
    ): Promise<drive_v3.Schema$File> {
        try {
            const drive = this.getService<drive_v3.Drive>('drive')

            const fileMetadata: DriveFileOptions = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
            }

            if (parentFolderId) {
                fileMetadata.parents = [parentFolderId]
            }

            const response = await drive.files.create({
                requestBody: fileMetadata,
                fields: 'id, name, webViewLink',
            })

            return response.data
        } catch (error) {
            console.error('Lỗi khi tạo folder mới trên Drive:', error)
            throw error
        }
    }

    /**
     * Tải file lên Google Drive
     * @param filePath Đường dẫn đến file cần tải lên
     * @param fileName Tên file trên Drive
     * @param mimeType MIME type của file
     * @param parentFolderId ID của folder cha (không bắt buộc)
     * @returns Thông tin file đã tải lên
     */
    public async uploadFileToDrive(
        fileContent: any,
        fileName: string,
        mimeType: string,
        parentFolderId?: string
    ): Promise<drive_v3.Schema$File> {
        try {
            const drive = this.getService<drive_v3.Drive>('drive')

            const fileMetadata: DriveFileOptions = {
                name: fileName,
            }

            if (parentFolderId) {
                fileMetadata.parents = [parentFolderId]
            }

            const media = {
                mimeType: mimeType,
                body: fileContent,
            }

            const response = await drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id, name, webViewLink',
            })

            return response.data
        } catch (error) {
            console.error('Lỗi khi tải file lên Drive:', error)
            throw error
        }
    }

    /**
     * Lấy danh sách các sự kiện trong Google Calendar
     * @param calendarId ID của calendar (mặc định là primary)
     * @param timeMin Thời gian bắt đầu
     * @param timeMax Thời gian kết thúc
     * @param maxResults Số lượng kết quả tối đa
     * @returns Danh sách các sự kiện
     */
    public async listCalendarEvents(
        calendarId: string = 'primary',
        timeMin?: Date,
        timeMax?: Date,
        maxResults: number = 10
    ): Promise<calendar_v3.Schema$Events> {
        try {
            const calendar = this.getService<calendar_v3.Calendar>('calendar')

            const response = await calendar.events.list({
                calendarId: calendarId,
                timeMin: timeMin ? timeMin.toISOString() : undefined,
                timeMax: timeMax ? timeMax.toISOString() : undefined,
                maxResults: maxResults,
                singleEvents: true,
                orderBy: 'startTime',
            })

            return response.data
        } catch (error) {
            console.error('Lỗi khi lấy danh sách sự kiện từ Calendar:', error)
            throw error
        }
    }

    /**
     * Tạo sự kiện mới trong Google Calendar
     * @param calendarId ID của calendar (mặc định là primary)
     * @param summary Tiêu đề sự kiện
     * @param description Mô tả sự kiện
     * @param start Thời gian bắt đầu
     * @param end Thời gian kết thúc
     * @param location Địa điểm
     * @returns Sự kiện đã tạo
     */
    public async createCalendarEvent(
        calendarId: string = 'primary',
        summary: string,
        description: string,
        start: Date,
        end: Date,
        location?: string
    ): Promise<calendar_v3.Schema$Event> {
        try {
            const calendar = this.getService<calendar_v3.Calendar>('calendar')

            const event = {
                summary: summary,
                description: description,
                location: location,
                start: {
                    dateTime: start.toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
                end: {
                    dateTime: end.toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
            }

            const response = await calendar.events.insert({
                calendarId: calendarId,
                requestBody: event,
            })

            return response.data
        } catch (error) {
            console.error('Lỗi khi tạo sự kiện mới trong Calendar:', error)
            throw error
        }
    }

    /**
     * Lấy danh sách các tin nhắn trong Gmail
     * @param query Query tìm kiếm
     * @param maxResults Số lượng kết quả tối đa
     * @returns Danh sách các tin nhắn
     */
    public async listGmailMessages(
        query?: string,
        maxResults: number = 10
    ): Promise<gmail_v1.Schema$ListMessagesResponse> {
        try {
            const gmail = this.getService<gmail_v1.Gmail>('gmail')

            const response = await gmail.users.messages.list({
                userId: 'me',
                q: query,
                maxResults: maxResults,
            })

            return response.data
        } catch (error) {
            console.error('Lỗi khi lấy danh sách tin nhắn từ Gmail:', error)
            throw error
        }
    }

    /**
     * Lấy thông tin chi tiết của tin nhắn trong Gmail
     * @param messageId ID của tin nhắn
     * @returns Thông tin chi tiết tin nhắn
     */
    public async getGmailMessage(
        messageId: string
    ): Promise<gmail_v1.Schema$Message> {
        try {
            const gmail = this.getService<gmail_v1.Gmail>('gmail')

            const response = await gmail.users.messages.get({
                userId: 'me',
                id: messageId,
            })

            return response.data
        } catch (error) {
            console.error(
                'Lỗi khi lấy thông tin chi tiết tin nhắn Gmail:',
                error
            )
            throw error
        }
    }
}
