import axios from 'axios';

// 定义接口
interface ApiParams {
    apikey: string;
    uuid: string;
    daemonId: string;
    command: string;
}
const config = require('../config.yml');
// 发送 GET 请求的函数
export async function sendGetRequest(command: string): Promise<void> {
    console.log(`sendGetRequest called with command: ${command}`); // 调试输出

    const params: ApiParams = {
        apikey: config.apikey,
        uuid: config.uuid,
        daemonId: config.daemonid,
        command: command
    };

    console.log(`Sending GET request with params:`, params); // 调试输出

    try {
        const response = await axios.get(config.mcsm_url+'/api/protected_instance/command/', { params });
        console.log('Response:', response.data); // 调试输出
        return response.data; // 返回响应数据
    } catch (error) {
        console.error('Error:', error); // 调试输出
    }
}