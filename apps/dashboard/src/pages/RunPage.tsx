import { useScenario } from "../scenario/ScenarioContext";
import { PageHeader } from "./PageHeader";
import { LiveRunPanel } from "../components/LiveRunPanel";
import { TractionStrip } from "../components/TractionStrip";
import { Panel } from "../components/ui";

export function RunPage() {
  const { runs, run } = useScenario();
  return (
    <>
      <PageHeader path="/run" />
      <LiveRunPanel runs={runs} />
      <Panel
        title="What the market moved"
        hint="from the cleared plan"
        sub="Cleared volume, value delivered per USDC, settlement latency, how deep the payment chain runs and how connected the workflow is."
      >
        <TractionStrip traction={run.traction} />
      </Panel>
    </>
  );
}
