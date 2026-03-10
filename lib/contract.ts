// lib/contract.ts
import { ethers } from "ethers";

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;

export const CONTRACT_ABI = [
	"function createProject(string title, string requirements, uint256 timeoutDuration) payable returns (uint256)",
	"function assignFreelancer(uint256 id, address freelancer)",
	"function submitWork(uint256 id, string githubUrl)",
	"function releasePayment(uint256 id)",
	"function cancelProject(uint256 id)",
	"function getProject(uint256 id) view returns (tuple(address client, address freelancer, uint256 budget, string title, string requirements, string githubUrl, uint8 status, uint8 withdrawalState, uint256 createdAt, uint256 timeout))",
	"function projectCount() view returns (uint256)",
	"event ProjectCreated(uint256 id, address client, uint256 budget, string title)",
	"event FreelancerAssigned(uint256 id, address freelancer)",
	"event WorkSubmitted(uint256 id, string githubUrl)",
	"event PaymentReleased(uint256 id, address freelancer, uint256 amount)",
	"event ProjectCancelled(uint256 id, address client, uint256 amount)",
];

// Helper — get contract instance dengan signer dari MetaMask
async function getContract() {
	if (!window.ethereum) throw new Error("No crypto wallet found");
	const provider = new ethers.BrowserProvider(window.ethereum);
	const signer = await provider.getSigner();
	return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

// ─── Create Project ───────────────────────────────────────────────────────────
// Status setelah: Open
export async function createProjectOnChain(
	contractAddress: string,
	title: string,
	description: string,
	amountInAvax: string,
	timeoutDays: number = 30
): Promise<{ hash: string; onChainId: number }> {
	const contract = await getContract();
	const valueInWei = ethers.parseEther(amountInAvax);
	const timeoutSeconds = timeoutDays * 24 * 60 * 60;

	console.log(`createProject: ${title}, ${amountInAvax} AVAX`);

	const tx = await contract.createProject(title, description, timeoutSeconds, {
		value: valueInWei,
	});

	console.log("tx sent:", tx.hash);
	const receipt = await tx.wait();
	console.log("confirmed block:", receipt.blockNumber);

	// Parse event log untuk dapat on-chain project ID
	let onChainId = Date.now(); // fallback kalau log tidak terbaca
	for (const log of receipt.logs) {
		try {
			const parsed = contract.interface.parseLog(log);
			if (parsed && parsed.name === "ProjectCreated") {
				onChainId = Number(parsed.args.id);
				console.log("onChainId from log:", onChainId);
				break;
			}
		} catch {
			// skip log dari contract lain
		}
	}

	return { hash: tx.hash, onChainId };
}

// ─── Assign Freelancer ────────────────────────────────────────────────────────
// Requires: status Open → status Assigned
export async function assignFreelancerOnChain(
	contractAddress: string,
	projectId: number,
	freelancerAddress: string
): Promise<string> {
	const contract = await getContract();
	console.log(`assignFreelancer: project ${projectId} → ${freelancerAddress}`);

	const tx = await contract.assignFreelancer(projectId, freelancerAddress);
	await tx.wait();

	return tx.hash;
}

// ─── Submit Work ──────────────────────────────────────────────────────────────
// Requires: status Assigned → status Submitted
export async function submitWorkOnChain(
	contractAddress: string,
	projectId: number,
	githubUrl: string
): Promise<string> {
	const contract = await getContract();
	console.log(`submitWork: project ${projectId}, url: ${githubUrl}`);

	const tx = await contract.submitWork(projectId, githubUrl);
	await tx.wait();

	return tx.hash;
}

// ─── Release Payment ──────────────────────────────────────────────────────────
// Requires: status Submitted → status Completed + AVAX dikirim ke freelancer
export async function releasePaymentOnChain(
	contractAddress: string,
	projectId: number
): Promise<string> {
	const contract = await getContract();
	console.log(`releasePayment: project ${projectId}`);

	const tx = await contract.releasePayment(projectId);
	await tx.wait();

	return tx.hash;
}

// ─── Cancel Project ───────────────────────────────────────────────────────────
// Requires: status Open atau Assigned → status Cancelled + AVAX refund ke client
// Dipanggil saat employer delete contract sebelum ada freelancer yang selesai
export async function cancelProjectOnChain(
	contractAddress: string,
	projectId: number
): Promise<string> {
	const contract = await getContract();
	console.log(`cancelProject: project ${projectId} — AVAX will refund to client`);

	const tx = await contract.cancelProject(projectId);
	await tx.wait();

	return tx.hash;
}