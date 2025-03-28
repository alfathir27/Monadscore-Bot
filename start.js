const fs = require('fs');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const colors = require('colors');

const BASE_URL = 'https://mscore.onrender.com';

// 从 `wallets.json` 加载钱包
let wallets = [];
if (fs.existsSync('wallets.json')) {
    try {
        const walletData = JSON.parse(fs.readFileSync('wallets.json', 'utf-8'));
        wallets = walletData.map(wallet => wallet.address.trim()).filter(address => address.length > 0);
    } catch (error) {
        console.log(colors.red(`❌ 读取 wallets.json 时出错: ${error.message}`));
        process.exit(1);
    }
} else {
    console.log(colors.red('❌ 未找到 wallets.json！请添加钱包数据。'));
    process.exit(1);
}

// 从 `proxy.txt` 加载代理
let proxies = [];
if (fs.existsSync('proxy.txt')) {
    const proxyLines = fs.readFileSync('proxy.txt', 'utf-8')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    proxies = proxyLines.map(proxy => {
        try {
            return new HttpsProxyAgent(proxy);
        } catch (e) {
            console.log(colors.red(`⚠️ 无效代理: ${proxy} - ${e.message}`));
            return null;
        }
    }).filter(proxy => proxy !== null);
}

// 清理字符串中的控制字符
function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[\n\r\t\f\b]/g, ''); // 移除换行符、回车符、制表符、换页符、退格符
}

// 从 `log.json` 加载日志
let logs = [];
if (fs.existsSync('log.json')) {
    try {
        const rawData = fs.readFileSync('log.json', 'utf-8');
        logs = JSON.parse(rawData);
        // 清理 logs 中的字符串字段
        logs = logs.map(log => ({
            wallet: sanitizeString(log.wallet),
            success: log.success,
            timestamp: sanitizeString(log.timestamp)
        }));
    } catch (error) {
        console.log(colors.red(`❌ 读取 log.json 时出错: ${error.message}`));
        console.log(colors.yellow('📄 log.json 内容:'));
        console.log(rawData);
        console.log(colors.yellow('⚠️ 将重置 log.json 文件...'));
        logs = [];
        fs.writeFileSync('log.json', JSON.stringify(logs, null, 2));
    }
}

// 启动节点的功能
async function startNode(walletAddress, proxy) {
    const sanitizedAddress = sanitizeString(walletAddress);
    const data = {
        wallet: sanitizedAddress,
        startTime: Date.now()
    };

    try {
        const config = {
            method: 'put',
            url: `${BASE_URL}/user/update-start-time`,
            data,
            httpAgent: proxy,
            httpsAgent: proxy,
            timeout: 15000
        };

        const res = await axios(config);
        return res.data;
    } catch (error) {
        console.log(colors.red(`❌ 更新 ${sanitizedAddress} 的 startTime 时出错: ${error.message}`));
        return null;
    }
}

// 检查节点今天是否已更新
function isNodeUpdated(walletAddress) {
    const sanitizedAddress = sanitizeString(walletAddress);
    const today = new Date().toISOString().slice(0, 10); 
    return logs.some(log => log.wallet === sanitizedAddress && log.success && log.timestamp.startsWith(today));
}

// 处理钱包
async function processWallets() {
    let hasUpdated = false;

    for (const walletAddress of wallets) {
        const sanitizedAddress = sanitizeString(walletAddress);
        if (isNodeUpdated(sanitizedAddress)) {
            console.log(colors.yellow(`⏭️ ${sanitizedAddress} 的节点今天已更新，跳过。`));
            continue;
        }

        const proxy = proxies[Math.floor(Math.random() * proxies.length)];
        const result = await startNode(sanitizedAddress, proxy);
        if (result?.success) {
            console.log(colors.green(`✔️ 成功更新 ${sanitizedAddress} 的 startTime！`));

            logs.push({
                wallet: sanitizedAddress,
                success: true,
                timestamp: new Date().toISOString()
            });

            // 备份 log.json
            if (fs.existsSync('log.json')) {
                fs.copyFileSync('log.json', 'log.json.bak');
            }
            fs.writeFileSync('log.json', JSON.stringify(logs, null, 2));
            hasUpdated = true;
        } else {
            console.log(colors.red(`❌ 无法更新 ${sanitizedAddress} 的 startTime。`));

            logs.push({
                wallet: sanitizedAddress,
                success: false,
                timestamp: new Date().toISOString()
            });

            // 备份 log.json
            if (fs.existsSync('log.json')) {
                fs.copyFileSync('log.json', 'log.json.bak');
            }
            fs.writeFileSync('log.json', JSON.stringify(logs, null, 2));
            hasUpdated = true;
        }

        await new Promise(resolve => setTimeout(resolve, 10000));
    }

    return hasUpdated;
}

// 安排每天早上7点运行
async function startNodeDaily() {
    const now = new Date();
    let targetTime = new Date(now.setHours(7, 0, 0, 0)); 
    if (now.getHours() >= 7) {
        targetTime.setDate(targetTime.getDate() + 1);
    }

    const delay = targetTime - Date.now();
    console.log(colors.cyan(`⏳ 等待至 ${targetTime.toLocaleTimeString()} 以重新启动...`));

    setTimeout(async () => {
        const hasUpdated = await processWallets();

        if (hasUpdated) {
            const extraDelay = getRandomDelay() * 60 * 1000;
            console.log(colors.cyan(`⏳ 在重新启动前额外等待 ${extraDelay / 60000} 分钟...`));

            setTimeout(startNodeDaily, extraDelay);
        }
    }, delay);
}

// 获取2-10分钟的随机延迟
function getRandomDelay() {
    return Math.floor(Math.random() * (10 - 2 + 1)) + 2;
}

// 先运行一次脚本，然后进行调度
async function runOnce() {
    const hasUpdated = await processWallets();

    if (hasUpdated) {
        await startNodeDaily();
    } else {
        console.log(colors.cyan("⏳ 没有需要处理的钱包。等待下一个周期..."));
        await startNodeDaily();
    }
}

// 启动脚本
runOnce();
