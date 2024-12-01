import { Context } from 'koishi';
import { sendGetRequest } from './Send_request';
import { tx_xlsx } from './Read_document';
function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
export function apply(ctt: Context) {
    ctt.on('message', async (session) => {
        console.log(`Message received: ${session.content}`); // 调试输出

        if (session.content.startsWith('~//') ) { // 使用 startsWith 检查消息是否以 'say' 开头
            // 获取消息内容并按空格分割
            const messageContent = session.content;
            const parts = messageContent.split(' ');

            console.log(`Message parts:`, parts); // 调试输出

            // 提取 'say' 后面的所有字符串作为命令
            const command = parts.slice(1).join(' ');
            console.log(`Command determined: ${command}`); // 调试输出

            try {
                const response = await sendGetRequest(command);
                if (response.status === 200) {
                    session.send('发送成功'); // 发送响应数据
                } else {
                    session.send(`请求失败: ${response}`); // 发送错误信息
                }
            } catch (error) {
                console.error(`Error sending request:`, error); // 调试输出
                session.send(`Error: ${error.message}`); // 发送错误信息
            }
        }
    });

    ctt.on('message', async (session) => {
        if (session.content.startsWith('~~start')) {
            session.send('正在云端获取列表\n自动添加中');
            
            const datastring = await tx_xlsx();
           
            const Unfiltereddataarray = datastring.split('\n');
            const filtereddatarray = Unfiltereddataarray.filter(line => line !== 'undefined' && line.trim() !== '');
            if (filtereddatarray.length === 0) {
                session.send('没有数据可添加');
                return;
            }
            console.log(filtereddatarray);
            const dataarray = filtereddatarray.map(item => item.split(' QQ:')[0]); // 去除 QQ: 后面的内容
            const batcsize = 1;
            session.send('开始添加'+'\n'+dataarray);
            for (let i = 0; i < dataarray.length; i += batcsize) {
                const batch = dataarray.slice(i, i + batcsize);
                for (const item of batch) {
                    await delay(1000);
                    const command = `multilogin whitelist add ${item}`;
                    try {
                        const response = await sendGetRequest(command);
                        if (response.status === 200) {
                            session.send(`玩家添加成功: ${item}`+ '\n状代码:' + response.status);
                        } else {
                            session.send(`玩家添加失败: ${item}`+ '\n状代码:' + response.status);
                        }
                    } catch (error) {
                        console.error(`Error sending request:`, error); // 调试输出
                        session.send(`Error: ${error.message}`); // 发送错误信息
                    }
                }
            }
            session.send('添加完成,请检查控制台是否添加正确\n并前往在线文档标记已添加的玩家'); // 发送响应数据
        }
    });
    ctt.on('message', async (session) => {
        if (session.content.startsWith('~~list')) {
            session.send('正在云端获取列表');
            const datastring = await tx_xlsx();
            const Unfiltereddataarray = datastring.split('\n');
            const dataarray = Unfiltereddataarray.filter(line => line !== 'undefined' && line.trim() !== '');
            if (dataarray.length === 0) {
                session.send('所有玩家已添加白名单');
                return;
            }
            session.send('待添加的玩家列表：\n'+dataarray.join('\n'));
        }
    });
}