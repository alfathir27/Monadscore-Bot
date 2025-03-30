import inquirer from "inquirer";
import ora from "ora";
import chalk from "chalk";
import fs from "fs";
import axios from "axios";
import pkg from "https-proxy-agent";
const { HttpsProxyAgent } = pkg;
import { ethers } from "ethers";

// Fungsi: Menampilkan banner MonadScore
function printBanner() {
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

// Fungsi: Membuat garis pemisah yang menarik secara visual
function divider(text, color = "yellowBright") {
  console.log(chalk[color](`\n⚡━━━━━━━━━━ ${text} ━━━━━━━━━━⚡\n`));
}

// Fungsi: Teks tengah dinamis
function centerText(text, color = "cyanBright") {
  const width = process.stdout.columns || 80;
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return " ".repeat(padding) + chalk[color](text);
}

// Fungsi: Efek mengetik
async function typeEffect(text, color = "magentaBright") {
  for (const char of text) {
    process.stdout.write(chalk[color](char));
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  console.log();
}

printBanner();
console.log(
  centerText("=== 📢 Ikuti saya di GitHub: @Gzgod 📢 ===\n", "blueBright")
);
divider("PENDAFTARAN MONADSCORE OTOMATIS");

// Fungsi: Menghasilkan header permintaan acak
function generateRandomHeaders() {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/14.0.3 Safari/605.1.15",
    "Mozilla/5.0 (Linux; Android 10; SM-G970F) AppleWebKit/537.36 Chrome/115.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0",
  ];
  return {
    "User-Agent": userAgents[Math.floor(Math.random() * userAgents.length)],
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "id-ID,id;q=0.9",
  };
}

// Fungsi: Menunda eksekusi
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Animasi hitung mundur
async function countdown(ms) {
  const seconds = Math.floor(ms / 1000);
  for (let i = seconds; i > 0; i--) {
    process.stdout.write(chalk.grey(`\r⏳ Menunggu ${i} detik... `));
    await delay(1000);
  }
  process.stdout.write("\r" + " ".repeat(50) + "\r");
}

async function main() {
  const { useProxy } = await inquirer.prompt([
    {
      type: "confirm",
      name: "useProxy",
      message: chalk.magenta("🌐 Apakah Anda ingin menggunakan proxy?"),
      default: false,
    },
  ]);

  let proxyList = [];
  let proxyMode = null;
  if (useProxy) {
    const proxyAnswer = await inquirer.prompt([
      {
        type: "list",
        name: "proxyType",
        message: chalk.magenta("🔄 Pilih tipe proxy:"),
        choices: ["Rotasi", "Statis"],
      },
    ]);
    proxyMode = proxyAnswer.proxyType === "Rotasi" ? "Rotating" : "Static";
    try {
      const proxyData = fs.readFileSync("proxy.txt", "utf8");
      proxyList = proxyData
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      console.log(
        chalk.greenBright(`✅ Berhasil memuat ${proxyList.length} proxy.\n`)
      );
    } catch (err) {
      console.log(
        chalk.yellow(
          "⚠️ File proxy.txt tidak ditemukan, melanjutkan tanpa proxy.\n"
        )
      );
    }
  }

  const { count } = await inquirer.prompt([
    {
      type: "input",
      name: "count",
      message: chalk.magenta("🔢 Masukkan jumlah rekomendasi yang diinginkan:"),
      validate: (value) =>
        isNaN(value) || value <= 0
          ? "❌ Masukkan angka valid yang lebih besar dari 0!"
          : true,
    },
  ]);

  const { ref } = await inquirer.prompt([
    {
      type: "input",
      name: "ref",
      message: chalk.magenta("🔗 Masukkan kode referensi:"),
    },
  ]);

  divider("Memulai Pembuatan Akun");

  const fileName = "accounts.json";
  let accounts = fs.existsSync(fileName)
    ? JSON.parse(fs.readFileSync(fileName, "utf8"))
    : [];

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < count; i++) {
    console.log(chalk.cyanBright(`\n🔥 Akun ${i + 1}/${count} 🔥`));

    let accountAxiosConfig = {
      timeout: 50000,
      headers: generateRandomHeaders(),
      proxy: false,
    };

    if (useProxy && proxyList.length > 0) {
      let selectedProxy =
        proxyMode === "Rotating" ? proxyList[0] : proxyList.shift();
      if (!selectedProxy) {
        console.error(chalk.red("❌ Mode statis: proxy telah habis."));
        process.exit(1);
      }
      console.log(chalk.green(`🌍 Menggunakan proxy: ${selectedProxy}`));
      const agent = new HttpsProxyAgent(selectedProxy);
      accountAxiosConfig.httpAgent = agent;
      accountAxiosConfig.httpsAgent = agent;
    }

    let wallet = ethers.Wallet.createRandom();
    let walletAddress = wallet.address;
    console.log(
      chalk.greenBright(`✅ Dompet Ethereum telah dibuat: ${walletAddress}`)
    );

    const payload = { wallet: walletAddress, invite: ref };
    const regSpinner = ora("🚀 Mengirim data ke API...").start();

    try {
      await axios.post(
        "https://mscore.onrender.com/user",
        payload,
        accountAxiosConfig
      );
      regSpinner.succeed(chalk.greenBright("✅ Pendaftaran akun berhasil"));
      successCount++;
      accounts.push({ walletAddress, privateKey: wallet.privateKey });
      fs.writeFileSync(fileName, JSON.stringify(accounts, null, 2));
      console.log(chalk.greenBright("💾 Data akun telah disimpan."));
    } catch (error) {
      regSpinner.fail(
        chalk.red(`❌ ${walletAddress} gagal mendaftar: ${error.message}`)
      );
      failCount++;
    }

    console.log(
      chalk.yellow(
        `\n📊 Progres: ${
          i + 1
        }/${count} akun telah didaftarkan. (✅ Berhasil: ${successCount}, ❌ Gagal: ${failCount})`
      )
    );

    if (i < count - 1) {
      await countdown(Math.floor(Math.random() * (60000 - 30000 + 1)) + 30000);
    }
  }
  divider("Pendaftaran Selesai");
}

main();
