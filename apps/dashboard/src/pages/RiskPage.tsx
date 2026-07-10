import { useScenario } from "../scenario/ScenarioContext";
import { PageHeader } from "./PageHeader";
import { TwinRiskPanel } from "../components/TwinRiskPanel";

export function RiskPage() {
  const { run } = useScenario();
  return (
    <>
      <PageHeader path="/risk" />
      <TwinRiskPanel twin={run.twin} />
    </>
  );
}
