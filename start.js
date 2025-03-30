import fs from "fs/promises";
import axios from "axios";
import cfonts from "cfonts";
import chalk from "chalk";
import ora from "ora";
import readline from "readline";
import { Wallet } from "ethers";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";

function print_banner() {
  console.clear();
  console.log(
    chalk.cyan(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║               ╔═╗╔═╦╗─╔╦═══╦═══╦═══╦═══╗          ║
║               ╚╗╚╝╔╣║─║║╔══╣╔═╗║╔═╗║╔═╗║          ║
║               ─╚╗╔╝║║─║║╚══╣║─╚╣║─║║║─║║          ║
║               ─╔╝╚╗║║─║║╔══╣║╔═╣╚═╝║║─║║          ║
║               ╔╝╔╗╚╣╚═╝║╚══╣╚╩═║╔═╗║╚═╝║          ║
║               ╚═╝╚═╩═══╩═══╩═══╩╝─╚╩═══╝          ║
║          Penulis Asli GitHub: https://github.com/Kazuha787║
║                Ikuti channel tg: t.me/xuegaoz              ║
║                GitHub saya: github.com/Gzgod          ║
║                Twitter saya: @Xuegaogx       ║
║                                                    ║
╚════════════════════════════════════════════════════╝
`)
  );
}

function delay(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

function centerText(text, color = "greenBright") {
  const terminalWidth = process.stdout.columns || 80;
  const textLength = text.length;
  const padding = Math.max(0, Math.floor((terminalWidth - textLength) / 2));
  return " ".repeat(padding) + chalk[color](text);
}

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/102.0",
];

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function getHeaders() {
  return {
    "User-Agent": getRandomUserAgent(),
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    origin: "https://monadscore.xyz",
    referer: "https://monadscore.xyz/",
  };
}

function getAxiosConfig(proxy) {
  const config = {
    headers: getHeaders(),
    timeout: 60000,
  };
  if (proxy) {
    config.httpsAgent = newAgent(proxy);
  }
  return config;
}

function newAgent(proxy) {
  if (proxy.startsWith("http://")) {
    return new HttpsProxyAgent(proxy);
  } else if (proxy.startsWith("socks4://") || proxy.startsWith("socks5://")) {
    return new SocksProxyAgent(proxy);
  } else {
    console.log(chalk.red(`❌ Tipe proxy tidak didukung: ${proxy}`));
    return null;
  }
}

async function readAccounts() {
  try {
    const data = await fs.readFile("accounts.json", "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(
      chalk.red(`⚠️ Error saat membaca accounts.json: ${error.message}`)
    );
    return [];
  }
}

async function claimTask(walletAddress, taskId, proxy) {
  const url = "https://mscore.onrender.com/user/claim-task";
  const payload = { wallet: walletAddress, taskId };

  try {
    const response = await axios.post(url, payload, getAxiosConfig(proxy));
    return response.data && response.data.message
      ? response.data.message
      : "✅ Tugas berhasil diambil, tetapi server tidak mengembalikan pesan.";
  } catch (error) {
    return `❌ Tugas ${taskId} gagal: ${
      error.response?.data?.message || error.message
    }`;
  }
}

async function processAccount(account, index, total, proxy) {
  const { walletAddress, privateKey } = account;
  console.log(`\n`);
  console.log(chalk.cyanBright("╔" + "═".repeat(78) + "╗"));
  console.log(
    chalk.cyanBright(
      `║ ${chalk.bold.whiteBright(
        `Memproses Akun ${index + 1}/${total}`
      )} ${" ".repeat(
        42 - (index + 1).toString().length - total.toString().length
      )}║`
    )
  );
  console.log(
    chalk.cyanBright(
      `║ Dompet: ${chalk.yellowBright(walletAddress)} ${" ".repeat(
        42 - walletAddress.length
      )}║`
    )
  );
  console.log(chalk.cyanBright("╚" + "═".repeat(78) + "╝"));

  let wallet;
  try {
    wallet = new Wallet(privateKey);
  } catch (error) {
    console.error(chalk.red(`❌ Error saat membuat dompet: ${error.message}`));
    return;
  }

  const tasks = ["task003", "task002", "task001"];
  for (let i = 0; i < tasks.length; i++) {
    const spinnerTask = ora({
      text: `⏳ Mengambil tugas ${i + 1}/3 ...`,
      spinner: "dots2",
      color: "cyan",
    }).start();
    const msg = await claimTask(walletAddress, tasks[i], proxy);
    if (
      msg.toLowerCase().includes("successfully") ||
      msg.toLowerCase().includes("berhasil")
    ) {
      spinnerTask.succeed(
        chalk.greenBright(` ✅ Tugas ${i + 1}/3 berhasil diambil: ${msg}`)
      );
    } else {
      spinnerTask.fail(chalk.red(` ❌ Tugas ${i + 1}/3 gagal: ${msg}`));
    }
  }
}

async function run() {
  print_banner();
  console.log(
    centerText("=== 🔥 Ikuti saya di GitHub: @Gzgod 🔥 ===\n", "cyanBright")
  );

  const accounts = await readAccounts();
  if (accounts.length === 0) {
    console.log(chalk.red("⚠️ Tidak ada akun ditemukan di accounts.json."));
    return;
  }

  for (let i = 0; i < accounts.length; i++) {
    try {
      await processAccount(accounts[i], i, accounts.length, null);
    } catch (error) {
      console.error(
        chalk.red(`⚠️ Error saat memproses akun ${i + 1}: ${error.message}`)
      );
    }
  }

  console.log(
    chalk.magentaBright(
      "\n🚀 Semua tugas selesai! Menunggu 24 jam sebelum mencoba lagi... ⏳"
    )
  );
  await delay(86400);
  run();
}

run();
