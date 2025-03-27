const fs = require('fs');
const ethers = require('ethers');
const axios = require('axios');
const readline = require('readline-sync');
const { HttpProxyAgent } = require('http-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');
const chalk = require('chalk');

// ======================
// 动画工具
// ======================
const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let spinnerInterval;

function startSpinner(text) {
    let i = 0;
    spinnerInterval = setInterval(() => {
        process.stdout.write(`\r${chalk.cyan(spinnerFrames[i])} ${text}`);
        i = (i + 1) % spinnerFrames.length;
    }, 100);
}

function stopSpinner() {
    clearInterval(spinnerInterval);
    process.stdout.write('\r');
}

async function typeEffect(text, speed = 2) {
    return new Promise(resolve => {
        let i = 0;
        const typing = setInterval(() => {
            process.stdout.write(chalk.yellow(text[i]));
            if (++i === text.length) {
                clearInterval(typing);
                console.log();
                resolve();
            }
        }, speed);
    });
}

// ======================
// 动画横幅
// ======================
async function printBanner() {
    const bannerText = chalk.cyan(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║               ╔═╗╔═╦╗─╔╦═══╦═══╦═══╦═══╗          ║
║               ╚╗╚╝╔╣║─║║╔══╣╔═╗║╔═╗║╔═╗║          ║
║               ─╚╗╔╝║║─║║╚══╣║─╚╣║─║║║─║║          ║
║               ─╔╝╚╗║║─║║╔══╣║╔═╣╚═╝║║─║║          ║
║               ╔╝╔╗╚╣╚═╝║╚══╣╚╩═║╔═╗║╚═╝║          ║
║               ╚═╝╚═╩═══╩═══╩═══╩╝─╚╩═══╝          ║
║         原作者 GitHub: https://github.com/Kazuha787║
║               关注tg频道：t.me/xuegaoz              ║
║               我的gihub：github.com/Gzgod          ║
║               我的推特：推特雪糕战神@Hy78516012       ║
║                                                    ║
╚════════════════════════════════════════════════════╝
`);

    console.clear();
    for (const line of bannerText.split('\n')) {
        await typeEffect(line);
    }
}

// ======================
// 核心配置
// ======================
const BASE_URL = 'https://mscore.onrender.com';
const MAX_RETRIES = 3;
let REFERRAL_CODE = '';
let proxies = [];
const stats = { total: 0, success: 0, failed: 0 };

// ======================
// 初始化设置
// ======================
function initialize() {
    // 加载推荐码
    try {
        if (fs.existsSync('code.txt')) {
            REFERRAL_CODE = fs.readFileSync('code.txt', 'utf-8').trim();
            console.log(chalk.green(`✅ 已加载推荐码: ${chalk.yellow(REFERRAL_CODE)}`));
        } else {
            console.log(chalk.yellow('⚠️ 未找到 code.txt - 将不使用推荐码继续运行'));
        }
    } catch (error) {
        console.log(chalk.red(`❌ 读取 code.txt 时出错: ${error.message}`));
    }

    // 加载代理
    if (fs.existsSync('proxies.txt')) {
        proxies = fs.readFileSync('proxies.txt', 'utf-8')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(proxy => {
                try {
                    const proxyRegex = /^(http|socks4|socks5):\/\/(?:([^:]+):([^@]+)@)?([^:]+):(\d+)$/;
                    const match = proxy.match(proxyRegex);
                    if (!match) throw new Error('代理格式无效');

                    const [, type, username, password, host, port] = match;
                    const encodedUsername = encodeURIComponent(username || '');
                    const encodedPassword = encodeURIComponent(password || '');
                    return `${type}://${encodedUsername}:${encodedPassword}@${host}:${port}`;
                } catch (e) {
                    console.log(chalk.red(`⏭️ 跳过无效代理: ${proxy} - ${e.message}`));
                    return null;
                }
            })
            .filter(proxy => proxy !== null);

        console.log(chalk.green(`✅ 已加载 ${chalk.yellow(proxies.length)} 个有效代理`));
    } else {
        console.log(chalk.yellow('⚠️ 未找到 proxies.txt - 将不使用代理继续运行'));
    }
}

// ======================
// 代理管理
// ======================
function getRandomProxy() {
    if (proxies.length === 0) return null;
    return proxies[Math.floor(Math.random() * proxies.length)];
}

async function testProxy(proxyUrl) {
    try {
        const agent = proxyUrl.startsWith('http') 
            ? new HttpProxyAgent(proxyUrl)
            : new SocksProxyAgent(proxyUrl);

        await axios.get('https://api.ipify.org', {
            httpAgent: agent,
            httpsAgent: agent,
            timeout: 5000
        });
        return true;
    } catch (e) {
        return false;
    }
}

// ======================
// 核心功能
// ======================
function generateWallet() {
    return ethers.Wallet.createRandom();
}

async function makeRequest(method, endpoint, data) {
    let retries = 0;
    let usedProxies = new Set();

    while (retries <= MAX_RETRIES) {
        const proxyUrl = getRandomProxy();
        let agent = null;

        if (proxyUrl) {
            if (usedProxies.has(proxyUrl)) continue;
            usedProxies.add(proxyUrl);

            try {
                if (!await testProxy(proxyUrl)) {
                    console.log(chalk.red(`❌ 代理 ${proxyUrl} 测试失败 - 跳过`));
                    continue;
                }

                agent = proxyUrl.startsWith('http') 
                    ? new HttpProxyAgent(proxyUrl)
                    : new SocksProxyAgent(proxyUrl);
            } catch (e) {
                console.log(chalk.red(`❌ 代理错误: ${e.message}`));
                continue;
            }
        }

        try {
            const response = await axios({
                method,
                url: `${BASE_URL}${endpoint}`,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                    'origin': 'https://monadscore.xyz',
                    'referer': 'https://monadscore.xyz/'
                },
                data,
                httpAgent: agent,
                httpsAgent: agent,
                timeout: 15000
            });

            return response.data;
        } catch (error) {
            if (retries === MAX_RETRIES) {
                throw new Error(`❌ 请求在 ${MAX_RETRIES} 次重试后失败: ${error.message}`);
            }
            retries++;
        }
    }
}

async function registerWallet(walletAddress) {
    if (!REFERRAL_CODE) {
        throw new Error('⚠️ 无可用推荐码');
    }

    return makeRequest('POST', '/user', {
        wallet: walletAddress,
        invite: REFERRAL_CODE
    });
}

async function startNode(walletAddress) {
    return makeRequest('PUT', '/user/update-start-time', {
        wallet: walletAddress,
        startTime: Date.now()
    });
}

// ======================
// 主流程（已修复）
// ======================
async function main() {
    try {
        await printBanner();
        
        startSpinner('初始化系统');
        await new Promise(resolve => setTimeout(resolve, 1500));
        stopSpinner();
        initialize();

        // 修复输入处理
        const count = parseInt(readline.question('🌟 ' + chalk.yellow('请输入要创建的钱包数量: ')));

        if (isNaN(count) || count <= 0) {
            console.log(chalk.red('❌ 输入无效 - 请输入一个正数'));
            return;
        }

        let wallets = [];
        if (fs.existsSync('wallets.json')) {
            startSpinner('加载已有钱包');
            wallets = JSON.parse(fs.readFileSync('wallets.json', 'utf-8'));
            stopSpinner();
            console.log(chalk.green(`✅ 已加载 ${chalk.yellow(wallets.length)} 个已有钱包`));
        }

        for (let i = 0; i < count; i++) {
            startSpinner(`创建钱包 ${i + 1}/${count}`);
            const wallet = generateWallet();
            stopSpinner();
            
            const shortAddress = `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`;
            console.log(chalk.blue(`\n🔄 处理钱包 ${i + 1}/${count} (${shortAddress})`));

            try {
                startSpinner('注册钱包');
                const regResult = await registerWallet(wallet.address);
                stopSpinner();
                console.log(chalk.green('✅ 注册成功 ') + chalk.greenBright('✓'));

                startSpinner('激活节点');
                const nodeResult = await startNode(wallet.address);
                stopSpinner();
                console.log(chalk.green('✅ 节点已激活 ') + chalk.greenBright('✓'));

                wallets.push({
                    address: wallet.address,
                    privateKey: wallet.privateKey,
                    createdAt: new Date().toISOString()
                });
                
                startSpinner('保存钱包');
                fs.writeFileSync('wallets.json', JSON.stringify(wallets, null, 2));
                stopSpinner();
                console.log(chalk.green('✅ 钱包已保存 ') + chalk.greenBright('✓'));

                stats.success++;
            } catch (error) {
                stopSpinner();
                console.log(chalk.red(`❌ ${error.message} `) + chalk.redBright('✗'));
                stats.failed++;
            }

            stats.total++;
            console.log(chalk.yellow(`📊 进度: ${stats.success} 个成功, ${stats.failed} 个失败\n`));
        }

        // 最终动画
        console.log(chalk.hex('#FF69B4')(`
        🌟🎉🌟🎉🌟🎉🌟🎉🌟🎉🌟🎉🌟🎉🌟🎉🌟
        🎉                                 🎉
        🌟         进程完成！             🌟
        🎉                                 🎉
        🌟🎉🌟🎉🌟🎉🌟🎉🌟🎉🌟🎉🌟🎉🌟🎉🌟
        `));
        
        console.log(chalk.blue(`📊 最终结果:
        总钱包数: ${stats.total}
        ✅ 成功: ${stats.success}
        ❌ 失败: ${stats.failed}
        📁 已保存钱包: ${wallets.length}`));
    } catch (error) {
        console.log(chalk.red(`❌ 严重错误: ${error.message}`));
    }
}

// ======================
// 启动应用程序
// ======================
main();
