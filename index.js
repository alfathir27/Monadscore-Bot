const fs = require('fs');
const ethers = require('ethers');
const axios = require('axios');
const readline = require('readline-sync');
const { HttpProxyAgent } = require('http-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');
const chalk = require('chalk');

// ======================
// Animation Utilities
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
// Animated Banner
// ======================
async function printBanner() {
    const bannerText = chalk.cyan(`
╔════════════════════════════════════════════════════╗
║                 MONAD SCORE BOT                    ║
║       Automate your Monad Score registrations!     ║
║    Developed by: https://t.me/Offical_Im_kazuha    ║
║    GitHub: https://github.com/Kazuha787            ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  ██╗  ██╗ █████╗ ███████╗██╗   ██╗██╗  ██╗ █████╗  ║
║  ██║ ██╔╝██╔══██╗╚══███╔╝██║   ██║██║  ██║██╔══██╗ ║
║  █████╔╝ ███████║  ███╔╝ ██║   ██║███████║███████║ ║
║  ██╔═██╗ ██╔══██║ ███╔╝  ██║   ██║██╔══██║██╔══██║ ║
║  ██║  ██╗██║  ██║███████╗╚██████╔╝██║  ██║██║  ██║ ║
║  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ║
║                                                    ║
╚════════════════════════════════════════════════════╝
`);

    console.clear();
    for (const line of bannerText.split('\n')) {
        await typeEffect(line);
    }
}

// ======================
// Core Configuration
// ======================
const BASE_URL = 'https://mscore.onrender.com';
const MAX_RETRIES = 3;
let REFERRAL_CODE = '';
let proxies = [];
const stats = { total: 0, success: 0, failed: 0 };

// ======================
// Initialization Setup
// ======================
function initialize() {
    // Load referral code
    try {
        if (fs.existsSync('code.txt')) {
            REFERRAL_CODE = fs.readFileSync('code.txt', 'utf-8').trim();
            console.log(chalk.green(`✅ Loaded referral code: ${chalk.yellow(REFERRAL_CODE)}`));
        } else {
            console.log(chalk.yellow('⚠️  code.txt not found - proceeding without referral code'));
        }
    } catch (error) {
        console.log(chalk.red(`❌ Error reading code.txt: ${error.message}`));
    }

    // Load proxies
    if (fs.existsSync('proxies.txt')) {
        proxies = fs.readFileSync('proxies.txt', 'utf-8')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(proxy => {
                try {
                    const proxyRegex = /^(http|socks4|socks5):\/\/(?:([^:]+):([^@]+)@)?([^:]+):(\d+)$/;
                    const match = proxy.match(proxyRegex);
                    if (!match) throw new Error('Invalid proxy format');

                    const [, type, username, password, host, port] = match;
                    const encodedUsername = encodeURIComponent(username || '');
                    const encodedPassword = encodeURIComponent(password || '');
                    return `${type}://${encodedUsername}:${encodedPassword}@${host}:${port}`;
                } catch (e) {
                    console.log(chalk.red(`⏭️  Skipping invalid proxy: ${proxy} - ${e.message}`));
                    return null;
                }
            })
            .filter(proxy => proxy !== null);

        console.log(chalk.green(`✅ Loaded ${chalk.yellow(proxies.length)} valid proxies`));
    } else {
        console.log(chalk.yellow('⚠️  proxies.txt not found - proceeding without proxies'));
    }
}

// ======================
// Proxy Management
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
// Core Functionality
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
                    console.log(chalk.red(`❌ Proxy ${proxyUrl} failed test - skipping`));
                    continue;
                }

                agent = proxyUrl.startsWith('http') 
                    ? new HttpProxyAgent(proxyUrl)
                    : new SocksProxyAgent(proxyUrl);
            } catch (e) {
                console.log(chalk.red(`❌ Proxy error: ${e.message}`));
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
                throw new Error(`❌ Request failed after ${MAX_RETRIES} retries: ${error.message}`);
            }
            retries++;
        }
    }
}

async function registerWallet(walletAddress) {
    if (!REFERRAL_CODE) {
        throw new Error('⚠️  No referral code available');
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
// Main Process (Fixed)
// ======================
async function main() {
    try {
        await printBanner();
        
        startSpinner('Initializing system');
        await new Promise(resolve => setTimeout(resolve, 1500));
        stopSpinner();
        initialize();

        // Fixed input handling
        const count = parseInt(readline.question('🌟 ' + chalk.yellow('Enter number of wallets to create: ')));

        if (isNaN(count) || count <= 0) {
            console.log(chalk.red('❌ Invalid input - please enter a positive number'));
            return;
        }

        let wallets = [];
        if (fs.existsSync('wallets.json')) {
            startSpinner('Loading existing wallets');
            wallets = JSON.parse(fs.readFileSync('wallets.json', 'utf-8'));
            stopSpinner();
            console.log(chalk.green(`✅ Loaded ${chalk.yellow(wallets.length)} existing wallets`));
        }

        for (let i = 0; i < count; i++) {
            startSpinner(`Creating wallet ${i + 1}/${count}`);
            const wallet = generateWallet();
            stopSpinner();
            
            const shortAddress = `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`;
            console.log(chalk.blue(`\n🔄 Processing wallet ${i + 1}/${count} (${shortAddress})`));

            try {
                startSpinner('Registering wallet');
                const regResult = await registerWallet(wallet.address);
                stopSpinner();
                console.log(chalk.green('✅ Registration successful ') + chalk.greenBright('✓'));

                startSpinner('Activating node');
                const nodeResult = await startNode(wallet.address);
                stopSpinner();
                console.log(chalk.green('✅ Node activated ') + chalk.greenBright('✓'));

                wallets.push({
                    address: wallet.address,
                    privateKey: wallet.privateKey,
                    createdAt: new Date().toISOString()
                });
                
                startSpinner('Saving wallet');
                fs.writeFileSync('wallets.json', JSON.stringify(wallets, null, 2));
                stopSpinner();
                console.log(chalk.green('✅ Wallet saved ') + chalk.greenBright('✓'));

                stats.success++;
            } catch (error) {
                stopSpinner();
                console.log(chalk.red(`❌ ${error.message} `) + chalk.redBright('✗'));
                stats.failed++;
            }

            stats.total++;
            console.log(chalk.yellow(`📊 Progress: ${stats.success} succeeded, ${stats.failed} failed\n`));
        }

        // Final animation
        console.log(chalk.hex('#FF69B4')(`
        🌟🎉🌟🎉🌟🎉🌟🎉🌟🎉🌟🎉🌟🎉🌟🎉🌟
        🎉                                 🎉
        🌟      Process Completed!         🌟
        🎉                                 🎉
        🌟🎉🌟🎉🌟🎉🌟🎉🌟🎉🌟🎉🌟🎉🌟🎉🌟
        `));
        
        console.log(chalk.blue(`📊 Final results:
        Total wallets: ${stats.total}
        ✅ Successful: ${stats.success}
        ❌ Failed: ${stats.failed}
        📁 Saved wallets: ${wallets.length}`));
    } catch (error) {
        console.log(chalk.red(`❌ Critical error: ${error.message}`));
    }
}

// ======================
// Start Application
// ======================
main();
