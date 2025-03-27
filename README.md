# **Monadscrore Auto Reff & Node Updater**  

A fully automated bot designed to update Monadscorenode start times for multiple wallets using proxies. This bot ensures daily updates while logging execution details to prevent redundant requests.  

## 📢 Join Our Community  

- # Telegram Channel: .[Channel](https://t.me/Offical_Im_kazuha)
# GitHub Repository: [Monadscrore](https://github.com/Kazuha787/Monardscore-Bot.git)
## **🔹 Overview**  

MSCORE Auto Node Updater is a powerful tool for automating the process of updating wallet start times on the MSCORE network. By integrating proxy support, random delays, and logging mechanisms, it ensures efficient and secure operations without unnecessary duplicate updates.  

The bot reads wallet addresses from `wallets.json`, picks a random proxy (if available), and updates the node start time via API. It also maintains a `log.json` file to track updates and avoid repeating the same action within a single day.  

## **🚀 Features**  

✅ **Automated Updates** – Runs daily at **7 AM**, ensuring wallets stay active.  
✅ **Proxy Support** – Uses proxies from `proxy.txt` to enhance anonymity.  
✅ **Wallet Management** – Reads and processes wallet addresses from `wallets.json`.  
✅ **Logging System** – Prevents redundant updates by tracking execution history.  
✅ **Retry & Delay Mechanism** – Implements randomized delays and retries to handle API failures smoothly.  
✅ **Customizable Execution** – Allows modification of update timings, proxies, and retry settings.  

---

## **📌 Installation**  

### **Step 1: Clone the Repository**  

```bash
git clone https://github.com/Kazuha787/Monadscore-Bot.git
cd Monadscore-Bot
```
## Step 2: Install Dependencies
```
npm install
```
## Step 3: Setup Wallet Addresses

Create or modify the wallets.json file and enter your wallet addresses in this format:
```
[
  { "address": "0xYourWalletAddress1" },
  { "address": "0xYourWalletAddress2" },
  { "address": "0xYourWalletAddress3" }
]
```

Step 4: (Optional) Add Proxy Support
## Edit The Code 
```
nano code.txt
```

If you want to use proxies, add them to proxy.txt (one per line). Example:

```
http://username:password@proxy1.com:port
http://proxy2.com:port
```

---

## 💻 Usage

Run the Bot for Auto Reff
```
node index.js
```

Automated Execution for Active Referals to start Node 
```
node start.js
```
The bot is configured to run every day at 7 AM automatically.

It ensures each wallet is updated only once per day to avoid redundant API requests.



---

⚙️ Configuration Options


---

📦 Dependencies

The bot utilizes the following libraries to function smoothly:

axios – Handles HTTP requests to the API.

fs – Reads/writes JSON and text files for wallet and log management.

https-proxy-agent – Enables proxy support for API requests.

colors – Enhances console output with colors.


To install all dependencies, simply run:

npm install


---

📜 License

This project is open-source and licensed under the ISC License.


---

❓ FAQ (Frequently Asked Questions)

1️⃣ What does this bot do?

It updates the node start time for your wallets on the Monadscore network, ensuring they stay active and functional.

2️⃣ Do I need to run this manually every day?

No, the bot is designed to execute automatically at 7 AM each day. However, you can also run it manually if needed.

3️⃣ Can I use this bot without proxies?

Yes! The bot will work even if no proxies are specified in proxy.txt.

4️⃣ Where can I modify the execution time?

You can change the timing inside the script where the scheduled execution is set.


---

💡 Contribution & Support

Want to improve this project? Feel free to fork the repository and submit a pull request!

For any questions or support, join our Telegram Community:
