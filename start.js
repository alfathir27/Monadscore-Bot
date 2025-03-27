const fs = require('fs');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const colors = require('colors');

const BASE_URL = 'https://mscore.onrender.com';

// Load wallets from `wallets.json`
let wallets = [];
if (fs.existsSync('wallets.json')) {
    try {
        const walletData = JSON.parse(fs.readFileSync('wallets.json', 'utf-8'));
        wallets = walletData.map(wallet => wallet.address.trim()).filter(address => address.length > 0);
    } catch (error) {
        console.log(colors.red(`❌ Error reading wallets.json: ${error.message}`));
        process.exit(1);
    }
} else {
    console.log(colors.red('❌ wallets.json not found! Please add wallet data.'));
    process.exit(1);
}

// Load proxies from `proxy.txt`
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
            console.log(colors.red(`⚠️ Invalid proxy: ${proxy} - ${e.message}`));
            return null;
        }
    }).filter(proxy => proxy !== null);
}

// Load logs from `log.json`
let logs = [];
if (fs.existsSync('log.json')) {
    logs = JSON.parse(fs.readFileSync('log.json', 'utf-8'));
}

// Function to start the node
async function startNode(walletAddress, proxy) {
    const data = {
        wallet: walletAddress,
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
        console.log(colors.red(`❌ Error updating startTime for ${walletAddress}: ${error.message}`));
        return null;
    }
}

// Check if node has already been updated today
function isNodeUpdated(walletAddress) {
    const today = new Date().toISOString().slice(0, 10); 
    return logs.some(log => log.wallet === walletAddress && log.success && log.timestamp.startsWith(today));
}

// Process wallets
async function processWallets() {
    let hasUpdated = false;

    for (const walletAddress of wallets) {
        if (isNodeUpdated(walletAddress)) {
            console.log(colors.yellow(`⏭️ Node already updated for ${walletAddress} today, skipping.`));
            continue;
        }

        const proxy = proxies[Math.floor(Math.random() * proxies.length)];
        const result = await startNode(walletAddress, proxy);
        if (result?.success) {
            console.log(colors.green(`✔️ Successfully updated startTime for ${walletAddress}!`));

            logs.push({
                wallet: walletAddress,
                success: true,
                timestamp: new Date().toISOString()
            });

            fs.writeFileSync('log.json', JSON.stringify(logs, null, 2));
            hasUpdated = true;
        } else {
            console.log(colors.red(`❌ Failed to update startTime for ${walletAddress}.`));

            logs.push({
                wallet: walletAddress,
                success: false,
                timestamp: new Date().toISOString()
            });

            fs.writeFileSync('log.json', JSON.stringify(logs, null, 2));
            hasUpdated = true;
        }

        await new Promise(resolve => setTimeout(resolve, 10000));
    }

    return hasUpdated;
}

// Schedule to run daily at 7 AM
async function startNodeDaily() {
    const now = new Date();
    let targetTime = new Date(now.setHours(7, 0, 0, 0)); 
    if (now.getHours() >= 7) {
        targetTime.setDate(targetTime.getDate() + 1);
    }

    const delay = targetTime - Date.now();
    console.log(colors.cyan(`⏳ Waiting until ${targetTime.toLocaleTimeString()} to restart...`));

    setTimeout(async () => {
        const hasUpdated = await processWallets();

        if (hasUpdated) {
            const extraDelay = getRandomDelay() * 60 * 1000;
            console.log(colors.cyan(`⏳ Waiting an extra ${extraDelay / 60000} minutes before restarting...`));

            setTimeout(startNodeDaily, extraDelay);
        }
    }, delay);
}

// Random delay between 2-10 minutes
function getRandomDelay() {
    return Math.floor(Math.random() * (10 - 2 + 1)) + 2;
}

// Run script once and then schedule
async function runOnce() {
    const hasUpdated = await processWallets();

    if (hasUpdated) {
        await startNodeDaily();
    } else {
        console.log(colors.cyan("⏳ No wallets to process. Waiting for the next cycle..."));
        await startNodeDaily();
    }
}

// Start the script
runOnce();
