# **Monadscrore 自动推荐和节点更新器**  

一个全自动机器人，旨在使用代理更新多个钱包的 Monadscorenode 启动时间。该机器人确保每日更新，同时记录执行细节以防止冗余请求。  

## 📢 加入我的社区  

- # Telegram 频道: .[频道](https://t.me/xuegaoz)

## **🔹 概述**  

MSCORE 自动节点更新器是一个强大的工具，用于自动化更新 MSCORE 网络上钱包启动时间的过程。通过集成代理支持、随机延迟和日志机制，它确保高效和安全的操作，避免不必要的重复更新。  

该机器人从 `wallets.json` 中读取钱包地址，随机选择一个代理（如果可用），并通过 API 更新节点启动时间。它还维护一个 `log.json` 文件，以跟踪更新并避免在同一天内重复执行相同操作。  

## **🚀 功能**  

✅ **自动更新** – 每天早上 **7 点** 运行，确保钱包保持活跃。  
✅ **代理支持** – 使用 `proxy.txt` 中的代理来增强匿名性。  
✅ **钱包管理** – 从 `wallets.json` 中读取和处理钱包地址。  
✅ **日志系统** – 通过跟踪执行历史防止冗余更新。  
✅ **重试和延迟机制** – 实施随机延迟和重试以平滑处理 API 故障。  
✅ **可定制执行** – 允许修改更新时间、代理和重试设置。  

---

## **📌 安装**  

### **步骤 1: 克隆仓库**  

```bash
git clone https://github.com/Gzgod/Monadscore-Bot.git
cd Monadscore-Bot
```

## 步骤 2: 安装依赖

```bash
npm install
```

## 步骤 3: 设置钱包地址

创建或修改 `wallets.json` 文件并按以下格式输入您的钱包地址：

```json
[
  { "address": "0xYourWalletAddress1" },
  { "address": "0xYourWalletAddress2" },
  { "address": "0xYourWalletAddress3" }
]
```

步骤 4: （可选）添加代理支持
## 编辑邀请代码

```bash
nano code.txt
```

如果您想使用代理，请将它们添加到 `proxy.txt`（每行一个）。示例：

```
http://username:password@proxy1.com:port
http://proxy2.com:port
```

---

## 💻 使用

运行自动推荐机器人

```bash
node index.js
```

自动执行以激活推荐节点

```bash
node start.js
```

该机器人配置为每天早上 7 点自动运行。

它确保每个钱包每天只更新一次，以避免冗余的 API 请求。

---

⚙️ 配置选项

---

📦 依赖

该机器人使用以下库来平稳运行：

- axios – 处理对 API 的 HTTP 请求。
- fs – 读取/写入 JSON 和文本文件以进行钱包和日志管理。
- https-proxy-agent – 启用 API 请求的代理支持。
- colors – 增强控制台输出的颜色。

要安装所有依赖项，只需运行：

```bash
npm install
```

---

📜 许可证

该项目是开源的，并根据 ISC 许可证授权。

---

❓ 常见问题 (FAQ)

1️⃣ 这个机器人有什么作用？

它更新 Monadscore 网络上钱包的节点启动时间，确保它们保持活跃和功能正常。

2️⃣ 我需要每天手动运行这个机器人吗？

不，该机器人设计为每天早上 7 点自动执行。不过，如果需要，您也可以手动运行它。

3️⃣ 我可以不用代理运行这个机器人吗？

可以！即使 `proxy.txt` 中没有指定代理，该机器人也能正常工作。

4️⃣ 我可以在哪里修改执行时间？

您可以在脚本中设置计划执行的地方更改时间。

---

💡 贡献与支持

想改进这个项目？欢迎 fork 仓库并提交 pull request！
