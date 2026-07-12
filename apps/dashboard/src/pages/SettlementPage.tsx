import { ARCTASK_ESCROW, RECEIPTS } from "../fixtures";
import { PageHeader } from "./PageHeader";
import { OnchainPanel } from "../components/OnchainPanel";
import { ArcTaskEscrowPanel } from "../components/ArcTaskEscrowPanel";

export function SettlementPage() {
  return (
    <>
      <PageHeader path="/settlement" />
      <OnchainPanel receipts={RECEIPTS} />
      <div style={{ marginTop: 16 }}>
        <ArcTaskEscrowPanel receipt={ARCTASK_ESCROW} />
      </div>
    </>
  );
}
