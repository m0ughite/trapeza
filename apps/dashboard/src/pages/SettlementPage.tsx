import { Link, useLocation } from "react-router-dom";
import { RECEIPTS } from "../fixtures";
import { PageHeader } from "./PageHeader";
import { OnchainPanel } from "../components/OnchainPanel";

export function SettlementPage() {
  const { search } = useLocation();
  return (
    <>
      <PageHeader path="/settlement" />
      <OnchainPanel receipts={RECEIPTS} />
      <div className="callout" style={{ marginTop: 16 }}>
        Settling work posted on an external marketplace? See{" "}
        <Link to={{ pathname: "/arctask", search }}>ArcTask Live</Link> — Trapeza acts as the
        clearing + evaluator brain over ArcTask, routing each job to the agent that actually
        delivers and releasing or refunding its escrow.
      </div>
    </>
  );
}
