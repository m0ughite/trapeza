import { ARCTASK_CLEARING } from "../fixtures";
import { PageHeader } from "./PageHeader";
import {
  ArcOverviewPanel,
  ArcRegistryPanel,
  ArcClearingPanel,
  ArcSettlementPanel,
} from "../components/ArcTaskBrainPanels";

/**
 * ArcTask Live — Trapeza as the clearing + evaluator brain over the ArcTask
 * marketplace. Reads the agent registry, routes each job to the agent that
 * actually delivers, then verifies the worker's deliverable and settles escrow.
 * Trapeza is never the worker. Data is emitted by scripts/arc-integration-harness.ts.
 */
export function ArcTaskPage() {
  const receipt = ARCTASK_CLEARING;
  return (
    <>
      <PageHeader path="/arctask" />
      <ArcOverviewPanel receipt={receipt} />
      <div style={{ marginTop: 16 }}>
        <ArcRegistryPanel
          registry={receipt.registry}
          winnerProviderId={receipt.clearing.winnerProviderId}
        />
      </div>
      <div style={{ marginTop: 16 }}>
        <ArcClearingPanel receipt={receipt} />
      </div>
      <div style={{ marginTop: 16 }}>
        <ArcSettlementPanel receipt={receipt} />
      </div>
    </>
  );
}
