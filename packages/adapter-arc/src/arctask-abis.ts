/**
 * ArcTask marketplace ABIs — transcribed from VadymManiuk/ArcTask
 * lib/contracts/abis/ERC8183Escrow.json and ERC8004AgentRegistry.json.
 * Minimal surface Trapeza calls.
 */

export const arctaskEscrowAbi = [
  {
    type: "constructor",
    inputs: [{ name: "registryAddress", type: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "nextJobId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "registry",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "createJob",
    stateMutability: "payable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "rewardAmount", type: "uint256" },
      { name: "deadline", type: "uint64" },
      { name: "evaluator", type: "address" },
      { name: "jobURI", type: "string" },
    ],
    outputs: [{ name: "jobId", type: "uint256" }],
  },
  {
    type: "function",
    name: "submitDeliverable",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "deliverableHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "acceptWork",
    stateMutability: "nonpayable",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "rejectWork",
    stateMutability: "nonpayable",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "refundExpired",
    stateMutability: "nonpayable",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "jobs",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "client", type: "address" },
      { name: "agentId", type: "uint256" },
      { name: "agentOwner", type: "address" },
      { name: "evaluator", type: "address" },
      { name: "rewardAmount", type: "uint256" },
      { name: "deadline", type: "uint64" },
      { name: "jobURI", type: "string" },
      { name: "deliverableHash", type: "bytes32" },
      { name: "status", type: "uint8" },
      { name: "createdAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "JobCreated",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "agentId", type: "uint256", indexed: true },
      { name: "client", type: "address", indexed: true },
      { name: "evaluator", type: "address", indexed: false },
      { name: "rewardAmount", type: "uint256", indexed: false },
      { name: "deadline", type: "uint64", indexed: false },
      { name: "jobURI", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "DeliverableSubmitted",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "deliverableHash", type: "bytes32", indexed: false },
    ],
  },
  {
    type: "event",
    name: "WorkAccepted",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "agentOwner", type: "address", indexed: true },
      { name: "rewardAmount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "WorkRejected",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "client", type: "address", indexed: true },
      { name: "rewardAmount", type: "uint256", indexed: false },
    ],
  },
] as const;

export const arctaskAgentRegistryAbi = [
  {
    type: "function",
    name: "nextAgentId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "registerAgent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "owner", type: "address" },
      { name: "metadataURI", type: "string" },
    ],
    outputs: [{ name: "agentId", type: "uint256" }],
  },
  {
    type: "function",
    name: "updateMetadata",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "metadataURI", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getAgentOwner",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "agents",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "owner", type: "address" },
      { name: "metadataURI", type: "string" },
      { name: "createdAt", type: "uint256" },
      { name: "active", type: "bool" },
    ],
  },
  {
    type: "event",
    name: "AgentRegistered",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "metadataURI", type: "string", indexed: false },
    ],
  },
] as const;

/** Minimal ERC-20 ABI for USDC approve/transferFrom on Arc testnet. */
export const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "transferFrom",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

/** ArcTask JobStatus enum values from ArcTaskEscrow.sol */
export const ArcTaskJobStatus = {
  Funded: 0,
  Submitted: 1,
  Accepted: 2,
  Rejected: 3,
  Refunded: 4,
} as const;
