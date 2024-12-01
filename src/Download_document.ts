import * as fs from 'fs';
import * as querystring from 'querystring';
import * as axios from 'axios';
import * as cheerio from 'cheerio';

interface UserDict {
    nowUserIndex: string;
    uid: string;
    utype: string;
}

class TengXunDocument {
    private documentUrl: string;
    private localPadId: string;
    private headers: { [key: string]: string };

    constructor(documentUrl: string, localPadId: string, cookieValue: string) {
        this.documentUrl = documentUrl;
        this.localPadId = localPadId;
        this.headers = {
            'content-type': 'application/x-www-form-urlencoded',
            'Cookie': cookieValue
        };
    }

    public async getNowUserIndex(): Promise<string> {
        try {
            const response = await axios.default.get(this.documentUrl, { headers: this.headers });
            const $ = cheerio.load(response.data);
            const scriptContent = $('script').text();
            const globalMultiUserMatch = scriptContent.match(/window\.global_multi_user=(.*?);/);
            if (globalMultiUserMatch && globalMultiUserMatch[1]) {
                const userDict: UserDict = JSON.parse(globalMultiUserMatch[1]);
                console.log(userDict);
                return userDict.nowUserIndex;
            }
            return 'cookie过期,请重新输入';
        } catch (error) {
            console.error(error);
            return '请求失败';
        }
    }

    public async exportExcelTask(exportExcelUrl: string): Promise<string> {
        const body = querystring.stringify({
            docId: this.localPadId,
            version: '2'
        });

        try {
            const response = await axios.default.post(exportExcelUrl, body, { headers: this.headers });
            return response.data.operationId;
        } catch (error) {
            console.error(error);
            throw new Error('导出任务创建失败');
        }
    }

    public async downloadExcel(checkProgressUrl: string, fileName: string): Promise<void> {
        const startTime = Date.now();
        let fileUrl = '';

        while (true) {
            try {
                const response = await axios.default.get(checkProgressUrl, { headers: this.headers });
                const progress = response.data.progress;
                if (progress === 100) {
                    fileUrl = response.data.file_url;
                    break;
                } else if (Date.now() - startTime > 30000) {
                    console.log("数据准备超时,请排查");
                    break;
                }
            } catch (error) {
                console.error(error);
                break;
            }
        }

        if (fileUrl) {
            try {
                const response = await axios.default.get(fileUrl, { headers: this.headers, responseType: 'arraybuffer' });
                fs.writeFileSync(fileName, Buffer.from(response.data));
                console.log(`下载成功,文件名: ${fileName}`);
            } catch (error) {
                console.error(error);
                console.log("下载文件地址获取失败, 下载excel文件不成功");
            }
        } else {
            console.log("下载文件地址获取失败, 下载excel文件不成功");
        }
    }
}
export { TengXunDocument };