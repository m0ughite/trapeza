/**
 * Stage B — typed ArcTask marketplace client.
 * Re-exports the committed ABI surface (ERC8183Escrow + ERC8004AgentRegistry).
 */
export {
  ArcTaskClient,
  SimulatedArcTaskClient,
  decodeJobPayloadUri,
  encodeJobPayloadUri,
  jobToTaskSpec,
  makeWallet,
  parseUsdcToWei,
  formatNativeUsdc,
  formatErc20Usdc,
  taskIdToJobId,
  type ArcTaskJob,
  type ArcTaskAgent,
  type CreateJobParams,
} from "./arctask.js";

export {
  arctaskEscrowAbi,
  arctaskAgentRegistryAbi,
  erc20Abi,
  ArcTaskJobStatus,
} from "./arctask-abis.js";
