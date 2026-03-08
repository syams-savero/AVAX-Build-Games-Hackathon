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
[![Smart Contract](https://img.shields.io/badge/📄_Contract-Fuji_Testnet-E84142?style=for-the-badge)](https://testnet.snowtrace.io/address/0x7C253082f315744096eE262ed74fAc851e31DE28)
[![Video Demo](https://img.shields.io/badge/▶️_Watch_Demo-YouTube-FF0000?style=for-the-badge)](https://youtu.be/TbH-7S6BuEs)
[![GitHub](https://img.shields.io/badge/⭐_Star_on-GitHub-181717?style=for-the-badge)](https://github.com/syams-savero/AVAX-Build-Games-Hackathon)

</div>

---

## The Problem

| Platform | Fee | Payment | Review |
|----------|-----|---------|--------|
| Upwork | **20%** | Slow (7-14 days) | Manual |
| Fiverr | **20%** | Slow (14 days) | Manual |
| **ChainLancer** | **~0.1%** | **Instant** | **AI Automated** |

> Traditional freelance platforms charge massive fees, require manual payment approval, and offer zero trustless guarantees. Clients and freelancers are forced to trust a centralized middleman.

---

## The Solution

**ChainLancer** combines AI agents with smart contract escrow to eliminate the middleman entirely.

```
Client types a prompt → AI defines project → Smart contract locks funds
     → Freelancers apply → AI screens candidates
          → Freelancer submits GitHub → AI reviews code
               → APPROVED → Payment releases
```

**No manual intervention. No middleman. No 20% fees.**

---

## Demo

<div align="center">

[![Demo Video](https://img.shields.io/badge/▶️_Watch_Full_Demo_(5_mins)-FF0000?style=for-the-badge&logo=youtube)](https://youtu.be/TbH-7S6BuEs)

</div>

### Demo Flow
1. Client chats with AI → defines project requirements
2. Smart contract auto-deployed → funds locked in escrow  
3. Job posted publicly → freelancers apply
4. AI screens all applicants automatically
5. Freelancer submits GitHub repository
6. AI reviews code → payment releases if approved
7. Freelancer paid instantly, on-chain

---

## Architecture

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

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14, TailwindCSS, shadcn/ui | UI & routing |
| **Blockchain** | Avalanche Fuji Testnet | Fast, cheap transactions |
| **Smart Contract** | Solidity | Trustless escrow logic |
| **AI Agent** | Groq API (llama-3.3-70b) | Project intake & code review |
| **Code Analysis** | GitHub API | Fetch & analyze submissions |
| **Wallet** | MetaMask (window.ethereum) | User authentication |

---

## Smart Contract

> **Network:** Avalanche Fuji Testnet  
> **Address:** `0x7C253082f315744096eE262ed74fAc851e31DE28`  
> **Explorer:** [View on Snowtrace ↗](https://testnet.snowtrace.io/address/0x7C253082f315744096eE262ed74fAc851e31DE28)

### Contract Functions

```solidity
createProject(title, requirements, timeout)  // Lock funds in escrow
assignFreelancer(projectId, freelancerAddress) // AI assigns best candidate  
submitWork(projectId, githubUrl)              // Freelancer submits work
releasePayment(projectId)                    // AI triggers → funds released
cancelProject(projectId)                     // Refund if cancelled
```

---

## How to Run Locally

```bash
# Clone the repository
git clone https://github.com/syams-savero/AVAX-Build-Games-Hackathon
cd AVAX-Build-Games-Hackathon

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


## Team

| Role | Contribution |
|------|-------------|
| **Muhammad Syams Savero** | Backend, Smart Contract, AI Integration |
| **Aji Saputra** | Fullstack |
| **Ashari Dzaky** | UI / UX |

---

## Built for Avalanche Build Games 2026

<div align="center">

Built with ❤️ on Avalanche

</div>
