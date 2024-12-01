import xlsx from 'xlsx';
import { TengXunDocument } from './Download_document'; // 根据实际路径调整
import fs from 'fs';
const config = require('../config.yml'); // 导入配置文件
export async function tx_xlsx() {
  // excel文档地址
  const documentUrl = config.documentUrl;
  // 此值每一份腾讯文档有一个,需要手动获取
  const localPadId = config.PadId;
  // 打开腾讯文档后,从抓到的接口中获取cookie信息
  const cookieValue = config.cookie;

  const tx = new TengXunDocument(documentUrl, localPadId, cookieValue);
  const nowUserIndex = await tx.getNowUserIndex();
  // 导出文件任务url
  const exportExcelUrl = `https://docs.qq.com/v1/export/export_office?u=${nowUserIndex}`;
  // 获取导出任务的操作id
  const operationId = await tx.exportExcelTask(exportExcelUrl);
  const checkProgressUrl = `https://docs.qq.com/v1/export/query_progress?u=${nowUserIndex}&operationId=${operationId}`;
  const fileName = `data.xlsx`;

  // 下载Excel文件
  await tx.downloadExcel(checkProgressUrl, fileName);

  // 构造文件路径
  const filepath = config.filepath + fileName;
  // 输出文件路径日志
  console.log(`文件路径: ${filepath}`);

  // 等待文件下载完成
  const maxRetries = 30; // 最大重试次数
  const retryInterval = 2000; // 重试间隔时间（毫秒）
  let retries = 0;

  while (!fs.existsSync(filepath) && retries < maxRetries) {
    console.log(`等待文件下载... (${retries + 1}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, retryInterval));
    retries++;
  }

  if (!fs.existsSync(filepath)) {
    console.error(`文件下载超时或失败: ${filepath}`);
    return;
  }

  try {
    // 读取Excel文件
    const workbook = xlsx.readFile(filepath);
    // 输出成功读取工作簿的日志
    console.log(`读取成功`);

    // 检查工作簿中是否有工作表
    if (workbook.SheetNames.length === 0) {
      // 如果没有找到工作表，输出错误日志
      console.error(`No sheets found in the workbook`);
      return;
    }

    // 获取第一个工作表的名称
    const sheetName = workbook.SheetNames[0];
    // 输出工作表名称日志
    console.log(`Sheet name: ${sheetName}`);

    // 根据名称获取工作表对象
    const sheet = workbook.Sheets[sheetName];
    // 如果工作表对象不存在，输出错误日志
    if (!sheet) {
      console.error(`Sheet not found: ${sheetName}`);
      return;
    }

    // 将工作表转换为JSON格式
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // 初始化输出内容字符串
    let output = '';
    // 遍历数据行
    data.forEach((row, index) => {
      // 跳过第一行（标题行）
      if (index === 0) return;
      // 获取第五列和第三列的值
      const fifthColumn = row[4];
      const thirdColumn = row[2];
      const qq = row[1];

      // 如果第五列为空，则构造输出内容
      if (!fifthColumn) {
        output += `${thirdColumn} QQ:${qq} \n`
        console.log(output);
      }
    });

    // 发送合并后的消息内容
    return output;
  } catch (error) {
    // 捕获异常并输出错误日志
    console.error(`Error reading file or processing data:`, error);
  }
}