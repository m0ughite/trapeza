import { RECEIPTS } from "../fixtures";
import { PageHeader } from "./PageHeader";
import { OnchainPanel } from "../components/OnchainPanel";

export function SettlementPage() {
  return (
    <>
      <PageHeader path="/settlement" />
      <OnchainPanel receipts={RECEIPTS} />
    </>
  );
}
