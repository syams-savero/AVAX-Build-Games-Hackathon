# AVAX-Build-Games-Hackathon
<div align="center">

```
░█████╗░██╗░░██╗░█████╗░██╗███╗░░██╗██╗░░░░░░█████╗░███╗░░██╗░█████╗░███████╗██████╗░
██╔══██╗██║░░██║██╔══██╗██║████╗░██║██║░░░░░██╔══██╗████╗░██║██╔══██╗██╔════╝██╔══██╗
██║░░╚═╝███████║███████║██║██╔██╗██║██║░░░░░███████║██╔██╗██║██║░░╚═╝█████╗░░██████╔╝
██║░░██╗██╔══██║██╔══██║██║██║╚████║██║░░░░░██╔══██║██║╚████║██║░░██╗██╔══╝░░██╔══██╗
╚█████╔╝██║░░██║██║░░██║██║██║░╚███║███████╗██║░░██║██║░╚███║╚█████╔╝███████╗██║░░██║
░╚════╝░╚═╝░░╚═╝╚═╝░░╚═╝╚═╝╚═╝░░╚══╝╚══════╝╚═╝░░╚═╝╚═╝░░╚══╝░╚════╝░╚══════╝╚═╝░░╚═╝
```

### AI-Powered Freelance Escrow Platform on Avalanche

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-chainlancer.vercel.app-black?style=for-the-badge)](https://chainlancer.vercel.app)
[![Smart Contract](https://img.shields.io/badge/📄_Contract-Fuji_Testnet-E84142?style=for-the-badge)](https://testnet.snowtrace.io/address/[CONTRACT_ADDRESS])
[![Video Demo](https://img.shields.io/badge/▶️_Watch_Demo-YouTube-FF0000?style=for-the-badge)](https://youtu.be/[VIDEO_ID])
[![GitHub](https://img.shields.io/badge/⭐_Star_on-GitHub-181717?style=for-the-badge)](https://github.com/[USERNAME]/chainlancer)

</div>

---

## 🚨 The Problem

| Platform | Fee | Payment | Review |
|----------|-----|---------|--------|
| Upwork | **20%** | Slow (7-14 days) | Manual |
| Fiverr | **20%** | Slow (14 days) | Manual |
| **ChainLancer** | **~0.1%** | **Instant** | **AI Automated** |

> Traditional freelance platforms charge massive fees, require manual payment approval, and offer zero trustless guarantees. Clients and freelancers are forced to trust a centralized middleman.

---

## ⚡ The Solution

**ChainLancer** combines AI agents with smart contract escrow to eliminate the middleman entirely.

```
Client types a prompt → AI defines project → Smart contract locks funds
     → Freelancers apply → AI screens candidates
          → Freelancer submits GitHub → AI reviews code
               → APPROVED → Payment releases automatically
```

**No manual intervention. No middleman. No 20% fees.**

---

## 🎬 Demo

<div align="center">

[![Demo Video](https://img.shields.io/badge/▶️_Watch_Full_Demo_(5_mins)-FF0000?style=for-the-badge&logo=youtube)](https://youtu.be/[VIDEO_ID])

</div>

### Demo Flow
1. 🤖 Client chats with AI → defines project requirements
2. 📄 Smart contract auto-deployed → funds locked in escrow  
3. 👀 Job posted publicly → freelancers apply
4. 🔍 AI screens all applicants automatically
5. 💻 Freelancer submits GitHub repository
6. ✅ AI reviews code → payment releases if approved
7. 🎉 Freelancer paid instantly, on-chain

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                    │
│         AI Chat │ Job Board │ Dashboard │ Contracts      │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
           ▼                          ▼
┌──────────────────┐        ┌─────────────────────┐
│   GROQ AI AGENT  │        │   window.ethereum   │
│  llama-3.3-70b   │        │   (MetaMask)        │
│                  │        └──────────┬──────────┘
│ • Project intake │                   │
│ • Risk analysis  │                   ▼
│ • Code review    │        ┌─────────────────────┐
│ • Function calls │        │  AVALANCHE FUJI     │
└──────────┬───────┘        │  TESTNET            │
           │                │                     │
           └────────────────►  FreelanceEscrow    │
                            │  Smart Contract     │
                            │                     │
                            │  • createProject()  │
                            │  • assignFreelancer()│
                            │  • submitWork()     │
                            │  • releasePayment() │
                            └─────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14, TailwindCSS, shadcn/ui | UI & routing |
| **Blockchain** | Avalanche Fuji Testnet | Fast, cheap transactions |
| **Smart Contract** | Solidity | Trustless escrow logic |
| **AI Agent** | Groq API (llama-3.3-70b) | Project intake & code review |
| **Code Analysis** | GitHub API | Fetch & analyze submissions |
| **Wallet** | MetaMask (window.ethereum) | User authentication |

---

## 📄 Smart Contract

> **Network:** Avalanche Fuji Testnet  
> **Address:** `[CONTRACT_ADDRESS]`  
> **Explorer:** [View on Snowtrace ↗](https://testnet.snowtrace.io/address/[CONTRACT_ADDRESS])

### Contract Functions

```solidity
createProject(title, requirements, timeout)  // Lock funds in escrow
assignFreelancer(projectId, freelancerAddress) // AI assigns best candidate  
submitWork(projectId, githubUrl)              // Freelancer submits work
releasePayment(projectId)                    // AI triggers → funds released
cancelProject(projectId)                     // Refund if cancelled
```

---

## 🚀 How to Run Locally

```bash
# Clone the repository
git clone https://github.com/[USERNAME]/chainlancer
cd chainlancer

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Fill in your GROQ_API_KEY and CONTRACT_ADDRESS

# Run development server
npm run dev
```

### Environment Variables

```bash
# .env.example
GROQ_API_KEY=                        # Get from console.groq.com (free)
NEXT_PUBLIC_CONTRACT_ADDRESS=        # Your deployed contract address
NEXT_PUBLIC_CHAIN_ID=43113           # Avalanche Fuji
```

---

## 📋 MoSCoW Analysis

### ✅ Must Have (Implemented)
- AI conversational agent for project intake
- Smart contract escrow on Avalanche
- Automated code review via GitHub API + Groq
- Payment auto-release on AI approval
- Public job board

### 🔜 Should Have (Next Sprint)
- Account abstraction — email login for non-Web3 users
- USDC stablecoin payments instead of AVAX
- Dispute resolution mechanism

### 💡 Could Have (Future)
- Multi-milestone payment splits
- On-chain reputation system
- Mobile app

### ❌ Won't Have (Out of Scope)
- Fiat on/off ramp
- Non-coding job types (design, writing)
- Full KYC system

---

## 🗺️ Roadmap

```
Phase 1 (Now)     → MVP: AI + Escrow for coding projects
Phase 2 (Q2 2026) → Account abstraction, USDC, Kite AI integration  
Phase 3 (Q3 2026) → Multi-chain, reputation system, mobile app
Phase 4 (Q4 2026) → Mainnet launch, DAO governance
```

---

## 👥 Team

| Role | Contribution |
|------|-------------|
| **Muhammad Syams Savero** | Backend, Smart Contract, AI Integration |
| **[Nama Teman]** | Frontend, UI/UX Design |

---

## 🏆 Built for Avalanche Build Games 2026

<div align="center">

Built with ❤️ on Avalanche — *trustless, automated, unstoppable.*

</div>
