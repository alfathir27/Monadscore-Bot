import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import fs from 'fs';
import axios from 'axios';
import pkg from 'https-proxy-agent';
const { HttpsProxyAgent } = pkg;
import { ethers } from 'ethers';

// 函数：显示 MonadScore 横幅
function printBanner() {
  console.clear();
  console.log(chalk.cyan(`
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
║               我的推特：推特雪糕战神@Xuegaogx       ║
║                                                    ║
╚════════════════════════════════════════════════════╝
`));
}

// 函数：创建视觉上吸引人的分隔线
function divider(text, color = "yellowBright") {
  console.log(chalk[color](`\n⚡━━━━━━━━━━ ${text} ━━━━━━━━━━⚡\n`));
}

// 函数：动态居中文本
function centerText(text, color = "cyanBright") {
  const width = process.stdout.columns || 80;
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return " ".repeat(padding) + chalk[color](text);
}

// 函数：模拟打字效果
async function typeEffect(text, color = "magentaBright") {
  for (const char of text) {
    process.stdout.write(chalk[color](char));
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  console.log();
}

printBanner();
console.log(centerText("=== 📢 在 GitHub 上关注我: @Gzgod 📢 ===\n", "blueBright"));
divider("MONADSCORE 自动注册");

// 函数：生成随机请求头
function generateRandomHeaders() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/14.0.3 Safari/605.1.15',
    'Mozilla/5.0 (Linux; Android 10; SM-G970F) AppleWebKit/537.36 Chrome/115.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0'
  ];
  return {
    'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9'
  };
}

// 函数：延迟
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 倒计时动画
async function countdown(ms) {
  const seconds = Math.floor(ms / 1000);
  for (let i = seconds; i > 0; i--) {
    process.stdout.write(chalk.grey(`\r⏳ 等待 ${i} 秒... `));
    await delay(1000);
  }
  process.stdout.write('\r' + ' '.repeat(50) + '\r');
}

async function main() {
  const { useProxy } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useProxy',
      message: chalk.magenta('🌐 是否使用代理？'),
      default: false,
    }
  ]);

  let proxyList = [];
  let proxyMode = null;
  if (useProxy) {
    const proxyAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'proxyType',
        message: chalk.magenta('🔄 选择代理类型：'),
        choices: ['轮换', '静态'],
      }
    ]);
    proxyMode = proxyAnswer.proxyType === '轮换' ? 'Rotating' : 'Static';
    try {
      const proxyData = fs.readFileSync('proxy.txt', 'utf8');
      proxyList = proxyData.split('\n').map(line => line.trim()).filter(Boolean);
      console.log(chalk.greenBright(`✅ 已加载 ${proxyList.length} 个代理。\n`));
    } catch (err) {
      console.log(chalk.yellow('⚠️ 未找到 proxy.txt 文件，将不使用代理继续。\n'));
    }
  }

  const { count } = await inquirer.prompt([
    {
      type: 'input',
      name: 'count',
      message: chalk.magenta('🔢 输入你想要的推荐数量：'),
      validate: value => (isNaN(value) || value <= 0) ? '❌ 输入一个大于0的有效数字！' : true
    }
  ]);

  const { ref } = await inquirer.prompt([
    {
      type: 'input',
      name: 'ref',
      message: chalk.magenta('🔗 输入推荐码：'),
    }
  ]);

  divider("账户创建开始");

  const fileName = 'accounts.json';
  let accounts = fs.existsSync(fileName) ? JSON.parse(fs.readFileSync(fileName, 'utf8')) : [];

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < count; i++) {
    console.log(chalk.cyanBright(`\n🔥 账户 ${i + 1}/${count} 🔥`));

    let accountAxiosConfig = {
      timeout: 50000,
      headers: generateRandomHeaders(),
      proxy: false
    };

    if (useProxy && proxyList.length > 0) {
      let selectedProxy = (proxyMode === 'Rotating') ? proxyList[0] : proxyList.shift();
      if (!selectedProxy) {
        console.error(chalk.red("❌ 静态模式下代理已用尽。"));
        process.exit(1);
      }
      console.log(chalk.green(`🌍 使用代理: ${selectedProxy}`));
      const agent = new HttpsProxyAgent(selectedProxy);
      accountAxiosConfig.httpAgent = agent;
      accountAxiosConfig.httpsAgent = agent;
    }

    let wallet = ethers.Wallet.createRandom();
    let walletAddress = wallet.address;
    console.log(chalk.greenBright(`✅ 以太坊钱包已创建: ${walletAddress}`));

    const payload = { wallet: walletAddress, invite: ref };
    const regSpinner = ora('🚀 正在发送数据到API...').start();

    try {
      await axios.post('https://mscore.onrender.com/user', payload, accountAxiosConfig);
      regSpinner.succeed(chalk.greenBright('✅ 账户注册成功'));
      successCount++;
      accounts.push({ walletAddress, privateKey: wallet.privateKey });
      fs.writeFileSync(fileName, JSON.stringify(accounts, null, 2));
      console.log(chalk.greenBright('💾 账户数据已保存。'));
    } catch (error) {
      regSpinner.fail(chalk.red(`❌ ${walletAddress} 注册失败: ${error.message}`));
      failCount++;
    }

    console.log(chalk.yellow(`\n📊 进度: ${i + 1}/${count} 个账户已注册。 (✅ 成功: ${successCount}, ❌ 失败: ${failCount})`));

    if (i < count - 1) {
      await countdown(Math.floor(Math.random() * (60000 - 30000 + 1)) + 30000);
    }
  }
  divider("注册完成");
}

main();
