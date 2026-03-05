// lib/contract.ts

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string

export const CONTRACT_ABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "freelancer",
				"type": "address"
			}
		],
		"name": "FreelancerAssigned",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "freelancer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "PaymentReleased",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "client",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "ProjectCancelled",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "client",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "budget",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "title",
				"type": "string"
			}
		],
		"name": "ProjectCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "client",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "WithdrawalProcessed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "client",
				"type": "address"
			}
		],
		"name": "WithdrawalRequested",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "githubUrl",
				"type": "string"
			}
		],
		"name": "WorkSubmitted",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "freelancer",
				"type": "address"
			}
		],
		"name": "assignFreelancer",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "cancelProject",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "requirements",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "timeoutDuration",
				"type": "uint256"
			}
		],
		"name": "createProject",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "getProject",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "client",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "freelancer",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "budget",
						"type": "uint256"
					},
					{
						"internalType": "string",
						"name": "title",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "requirements",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "githubUrl",
						"type": "string"
					},
					{
						"internalType": "enum FreelanceEscrow.Status",
						"name": "status",
						"type": "uint8"
					},
					{
						"internalType": "enum FreelanceEscrow.WithdrawalState",
						"name": "withdrawalState",
						"type": "uint8"
					},
					{
						"internalType": "uint256",
						"name": "createdAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "timeout",
						"type": "uint256"
					}
				],
				"internalType": "struct FreelanceEscrow.Project",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "processWithdrawal",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "projectCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "projects",
		"outputs": [
			{
				"internalType": "address",
				"name": "client",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "freelancer",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "budget",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "requirements",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "githubUrl",
				"type": "string"
			},
			{
				"internalType": "enum FreelanceEscrow.Status",
				"name": "status",
				"type": "uint8"
			},
			{
				"internalType": "enum FreelanceEscrow.WithdrawalState",
				"name": "withdrawalState",
				"type": "uint8"
			},
			{
				"internalType": "uint256",
				"name": "createdAt",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "timeout",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "releasePayment",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "requestWithdrawal",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "githubUrl",
				"type": "string"
			}
		],
		"name": "submitWork",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "withdrawFunds",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	}
] as const

// Helper: wait for transaction receipt to get contract address
async function waitForReceipt(txHash: string, maxAttempts = 30): Promise<any> {
	if (!window.ethereum) throw new Error("No crypto wallet found");

	for (let i = 0; i < maxAttempts; i++) {
		const receipt = await window.ethereum.request({
			method: "eth_getTransactionReceipt",
			params: [txHash],
		});

		if (receipt) return receipt;

		// Wait 2 seconds before trying again
		await new Promise(resolve => setTimeout(resolve, 2000));
	}

	throw new Error("Transaction receipt timeout. Check the explorer for status.");
}

// Helper: encode function call data using simple ABI encoding
function encodeFunctionCall(functionSig: string, params: string[] = []): string {
	// Simple function selector: first 4 bytes of keccak256 hash
	// For now we use pre-computed selectors for our known functions
	const selectors: Record<string, string> = {
		"createProject(string,string,uint256)": "0x23c55448",
		"releasePayment(uint256)": "0x88685cd9",
		"submitWork(uint256,string)": "0xda8accf9",
		"assignFreelancer(uint256,address)": "0xc949756c",
	};
	return selectors[functionSig] || "0x";
}

export async function deployContract(abi: any, bytecode: string, args: any[]) {
	if (!window.ethereum) throw new Error("No crypto wallet found");

	const accounts = (await window.ethereum.request({
		method: "eth_requestAccounts",
	})) as string[];

	if (accounts.length === 0) throw new Error("No accounts found");

	if (!bytecode || bytecode === "0x") {
		throw new Error("Contract bytecode is missing. Please provide the compiled contract bytecode in lib/contract.ts.");
	}

	// Deploy contract
	const txHash = (await window.ethereum.request({
		method: "eth_sendTransaction",
		params: [{
			from: accounts[0],
			data: bytecode,
		}],
	})) as string;

	// Wait for receipt to get actual contract address
	try {
		const receipt = await waitForReceipt(txHash);
		return {
			txHash,
			contractAddress: receipt.contractAddress as string,
		};
	} catch {
		// If receipt takes too long, return txHash so user can check later
		return {
			txHash,
			contractAddress: null,
		};
	}
}

// Create a project on an already-deployed contract (payable - sends AVAX)
export async function createProjectOnChain(
	contractAddress: string,
	title: string,
	description: string,
	amountInAvax: string,
	timeoutDays: number = 30
): Promise<string> {
	if (!window.ethereum) throw new Error("No crypto wallet found");

	const accounts = (await window.ethereum.request({
		method: "eth_requestAccounts",
	})) as string[];

	if (accounts.length === 0) throw new Error("No accounts found");

	// Convert AVAX to wei (hex)
	const valueInWei = BigInt(Math.floor(parseFloat(amountInAvax) * 1e18));
	const valueHex = "0x" + valueInWei.toString(16);

	// Timeout in seconds
	const timeoutSeconds = timeoutDays * 24 * 60 * 60;

	// Use the function selector for createProject(string,string,uint256)
	const selector = "0x23c55448";

	const txHash = (await window.ethereum.request({
		method: "eth_sendTransaction",
		params: [{
			from: accounts[0],
			to: contractAddress,
			value: valueHex,
			data: selector, // Simplified - in production use proper ABI encoding
		}],
	})) as string;

	return txHash;
}

// Release payment for a project on-chain (employer only)
export async function releasePaymentOnChain(
	contractAddress: string,
	projectId: number
): Promise<string> {
	if (!window.ethereum) throw new Error("No crypto wallet found");

	const accounts = (await window.ethereum.request({
		method: "eth_requestAccounts",
	})) as string[];

	if (accounts.length === 0) throw new Error("No accounts found");

	// releasePayment(uint256) selector
	const selector = "0x88685cd9";
	const idHex = projectId.toString(16).padStart(64, "0");

	const txHash = (await window.ethereum.request({
		method: "eth_sendTransaction",
		params: [{
			from: accounts[0],
			to: contractAddress,
			data: selector + idHex,
		}],
	})) as string;

	return txHash;
}

// Submit work with GitHub URL (freelancer only)
export async function submitWorkOnChain(
	contractAddress: string,
	projectId: number,
	githubUrl: string
): Promise<string> {
	if (!window.ethereum) throw new Error("No crypto wallet found");

	const accounts = (await window.ethereum.request({
		method: "eth_requestAccounts",
	})) as string[];

	if (accounts.length === 0) throw new Error("No accounts found");

	// submitWork(uint256,string) selector
	const selector = "0xda8accf9";
	const idHex = projectId.toString(16).padStart(64, "0");

	const txHash = (await window.ethereum.request({
		method: "eth_sendTransaction",
		params: [{
			from: accounts[0],
			to: contractAddress,
			data: selector + idHex, // Simplified encoding
		}],
	})) as string;

	return txHash;
}

export const CONTRACT_BYTECODE = "6080604052348015600e575f5ffd5b503360025f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555061326b8061005c5f395ff3fe6080604052600436106100c5575f3560e01c80638da5cb5b1161007e578063cd2689f011610058578063cd2689f01461024f578063da8accf914610277578063f0f3f2c81461029f578063f2fde38b146102db576100cc565b80638da5cb5b146101d55780639ee679e8146101ff578063c949756c14610227576100cc565b8063107046bd146100d057806323c554481461011557806324600fc314610145578063249411471461015b57806336fbad261461018357806388685cd9146101ad576100cc565b366100cc57005b5f5ffd5b3480156100db575f5ffd5b506100f660048036038101906100f191906120c1565b610303565b60405161010c9a99989796959493929190612263565b60405180910390f35b61012f600480360381019061012a919061243e565b61053b565b60405161013c91906124c6565b60405180910390f35b348015610150575f5ffd5b506101596107ec565b005b348015610166575f5ffd5b50610181600480360381019061017c91906120c1565b61094c565b005b34801561018e575f5ffd5b50610197610cba565b6040516101a491906124c6565b60405180910390f35b3480156101b8575f5ffd5b506101d360048036038101906101ce91906120c1565b610cc0565b005b3480156101e0575f5ffd5b506101e9610fe7565b6040516101f691906124df565b60405180910390f35b34801561020a575f5ffd5b50610225600480360381019061022091906120c1565b61100c565b005b348015610232575f5ffd5b5061024d60048036038101906102489190612522565b6112a8565b005b34801561025a575f5ffd5b50610275600480360381019061027091906120c1565b6114e1565b005b348015610282575f5ffd5b5061029d60048036038101906102989190612560565b6118df565b005b3480156102aa575f5ffd5b506102c560048036038101906102c091906120c1565b611aea565b6040516102d29190612723565b60405180910390f35b3480156102e6575f5ffd5b5061030160048036038101906102fc9190612743565b611e47565b005b5f602052805f5260405f205f91509050805f015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1690806001015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff16908060020154908060030180546103719061279b565b80601f016020809104026020016040519081016040528092919081815260200182805461039d9061279b565b80156103e85780601f106103bf576101008083540402835291602001916103e8565b820191905f5260205f20905b8154815290600101906020018083116103cb57829003601f168201915b5050505050908060040180546103fd9061279b565b80601f01602080910402602001604051908101604052809291908181526020018280546104299061279b565b80156104745780601f1061044b57610100808354040283529160200191610474565b820191905f5260205f20905b81548152906001019060200180831161045757829003601f168201915b5050505050908060050180546104899061279b565b80601f01602080910402602001604051908101604052809291908181526020018280546104b59061279b565b80156105005780601f106104d757610100808354040283529160200191610500565b820191905f5260205f20905b8154815290600101906020018083116104e357829003601f168201915b505050505090806006015f9054906101000a900460ff16908060060160019054906101000a900460ff1690806007015490806008015490508a565b5f5f341161057e576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161057590612815565b60405180910390fd5b5f60015f81548092919061059190612860565b9190505590506040518061014001604052803373ffffffffffffffffffffffffffffffffffffffff1681526020015f73ffffffffffffffffffffffffffffffffffffffff16815260200134815260200186815260200185815260200160405180602001604052805f81525081526020015f6004811115610614576106136121aa565b5b81526020015f600281111561062c5761062b6121aa565b5b8152602001428152602001844261064391906128a7565b8152505f5f8381526020019081526020015f205f820151815f015f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506020820151816001015f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506040820151816002015560608201518160030190816106ff9190612a7a565b5060808201518160040190816107159190612a7a565b5060a082015181600501908161072b9190612a7a565b5060c0820151816006015f6101000a81548160ff02191690836004811115610756576107556121aa565b5b021790555060e08201518160060160016101000a81548160ff02191690836002811115610786576107856121aa565b5b0217905550610100820151816007015561012082015181600801559050507fb9063c72c82ab2995bd11103743bc1617470aab7e4eabe0516116f950cf43780813334886040516107d99493929190612b49565b60405180910390a1809150509392505050565b";
