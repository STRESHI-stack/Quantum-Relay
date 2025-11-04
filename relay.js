import express from "express";
import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();
const app = express();
app.use(express.json());

// 🧠 Load environment variables
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;

// 🔗 Connect to Polygon through QuickNode
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Minimal ERC-20 ABI
const abi = [
  "function transfer(address to, uint256 value) public returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];
const token = new ethers.Contract(TOKEN_ADDRESS, abi, wallet);

app.get("/", (req, res) =>
  res.send("⚛️ Quantum Relay Node is online and ready to sign STI transactions.")
);

// 🧩 Transfer endpoint — 1 ZEC = 0.00000000000001 STI
app.post("/transfer", async (req, res) => {
  try {
    const { to, amountZEC } = req.body;
    if (!to || amountZEC === undefined)
      throw new Error("Missing 'to' or 'amountZEC'");

    // 1 ZEC = 0.00000000000001 STI
    const stiAmount = Number(amountZEC) * 0.00000000000001;

    // Convert to fixed decimal string (no scientific notation)
    const stiAmountStr = stiAmount.toFixed(18); // up to 18 decimals for ERC-20

    // Get token decimals and convert STI → on-chain units
    const decimals = await token.decimals();
    const amountBaseUnits = ethers.parseUnits(stiAmountStr, decimals);

    console.log(
      `🔐 Signing transfer → ${amountZEC} ZEC = ${stiAmountStr} STI (${amountBaseUnits.toString()} base units)`
    );

    // Execute token transfer
    const tx = await token.transfer(to, amountBaseUnits);
    await tx.wait();

    console.log(`✅ Transfer complete! Tx hash: ${tx.hash}`);
    res.json({ status: "success", tx_hash: tx.hash });
  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🧮 Simple balance check endpoint
app.get("/balance", async (req, res) => {
  try {
    const decimals = await token.decimals();
    const balance = await token.balanceOf(PUBLIC_KEY);
    const formatted = ethers.formatUnits(balance, decimals);
    res.json({ balance: `${formatted} STI` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚀 Start server
app.listen(3000, () =>
  console.log("🚀 Quantum Relay Node active on port 3000")
);

