/**
 * Live on-chain settlement snapshot for State-Twins preflight.
 */

import { createPublicClient, http, parseAbi } from "viem";
import type { SettlementState, StateSnapshotSource } from "@trapeza/core";
import { parseUsdcToMicro } from "@trapeza/core";
import { GatewaySettlementAdapter } from "./settlement.js";
import {
  arcTestnet,
  ARC_TESTNET_RPC_URL,
  ARC_TESTNET_USDC,
} from "./constants.js";

const balanceOfAbi = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
]);

export interface LiveSnapshotConfig {
  buyerPrivateKey: `0x${string}`;
  rpcUrl?: string;
  escrowAddress?: `0x${string}`;
}

export class LiveStateSnapshotSource implements StateSnapshotSource {
  private readonly gateway: GatewaySettlementAdapter;
  private readonly publicClient;
  private readonly escrowAddress?: `0x${string}`;

  constructor(cfg: LiveSnapshotConfig) {
    this.gateway = new GatewaySettlementAdapter({
      privateKey: cfg.buyerPrivateKey,
    });
    this.escrowAddress =
      cfg.escrowAddress ??
      (process.env.TRAPEZA_ESCROW_ADDRESS as `0x${string}` | undefined);
    this.publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(cfg.rpcUrl ?? ARC_TESTNET_RPC_URL),
    });
  }

  async getSettlementState(): Promise<SettlementState> {
    const balances = await this.gateway.getBalances();
    const requesterBalanceMicro = parseUsdcToMicro(
      balances.gateway.formattedAvailable,
    );

    const providerBondMicro: Record<string, bigint> = {};
    if (this.escrowAddress) {
      const escrowBal = (await this.publicClient.readContract({
        address: ARC_TESTNET_USDC,
        abi: balanceOfAbi,
        functionName: "balanceOf",
        args: [this.escrowAddress],
      })) as bigint;
      providerBondMicro.escrow_pool = escrowBal;
    }

    return {
      requesterBalanceMicro,
      providerBondMicro,
      escrowLockedMicro: {},
      nodeFeeMicro: {},
    };
  }
}
