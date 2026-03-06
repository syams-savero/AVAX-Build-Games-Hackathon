// lib/contract.ts
import { ethers } from "ethers";

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;

export const CONTRACT_ABI = [
	// ... (keeping the same ABI as before for consistency)
	"function createProject(string title, string requirements, uint256 timeoutDuration) payable returns (uint256)",
	"function releasePayment(uint256 id)",
	"function submitWork(uint256 id, string githubUrl)",
	"function assignFreelancer(uint256 id, address freelancer)",
	"function getProject(uint256 id) view returns (tuple(address client, address freelancer, uint256 budget, string title, string requirements, string githubUrl, uint8 status, uint8 withdrawalState, uint256 createdAt, uint256 timeout))",
	"function projectCount() view returns (uint256)",
	"event ProjectCreated(uint256 id, address client, uint256 budget, string title)",
	"event WorkSubmitted(uint256 id, string githubUrl)",
	"event PaymentReleased(uint256 id, address freelancer, uint256 amount)"
];

// Helper to get contract instance with signer
async function getContract() {
	if (!window.ethereum) throw new Error("No crypto wallet found");
	const provider = new ethers.BrowserProvider(window.ethereum);
	const signer = await provider.getSigner();
	return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

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

	console.log(`Creating project on-chain: ${title}, Budget: ${amountInAvax} AVAX`);

	const tx = await contract.createProject(title, description, timeoutSeconds, {
		value: valueInWei,
	});

	console.log("Transaction sent:", tx.hash);
	const receipt = await tx.wait();
	console.log("Transaction confirmed in block:", receipt.blockNumber);

	// Parse logs to find ProjectCreated event
	let onChainId = Date.now(); // Fallback
	for (const log of receipt.logs) {
		try {
			const parsed = contract.interface.parseLog(log);
			if (parsed && parsed.name === "ProjectCreated") {
				onChainId = Number(parsed.args.id);
				console.log("Found Project ID in logs:", onChainId);
				break;
			}
		} catch (e) {
			// Skip logs that can't be parsed by this contract's interface
		}
	}

	return { hash: tx.hash, onChainId };
}

export async function releasePaymentOnChain(
	contractAddress: string,
	projectId: number
): Promise<string> {
	const contract = await getContract();
	console.log(`Releasing payment for project ID: ${projectId}`);

	const tx = await contract.releasePayment(projectId);
	await tx.wait();

	return tx.hash;
}

export async function submitWorkOnChain(
	contractAddress: string,
	projectId: number,
	githubUrl: string
): Promise<string> {
	const contract = await getContract();
	console.log(`Submitting work for project ID: ${projectId}, URL: ${githubUrl}`);

	const tx = await contract.submitWork(projectId, githubUrl);
	await tx.wait();

	return tx.hash;
}

export async function assignFreelancerOnChain(
	contractAddress: string,
	projectId: number,
	freelancerAddress: string
): Promise<string> {
	const contract = await getContract();
	console.log(`Assigning freelancer ${freelancerAddress} to project ID: ${projectId}`);

	const tx = await contract.assignFreelancer(projectId, freelancerAddress);
	await tx.wait();

	return tx.hash;
}

// Keeping the original BYTECODE and other exports for baseline compatibility if needed
export const CONTRACT_BYTECODE = "0x..."; // Placeholder, usually not needed for interaction
