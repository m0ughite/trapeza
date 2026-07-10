import { useScenario } from "../scenario/ScenarioContext";
import { PageHeader } from "./PageHeader";
import { ShadowPricesPanel } from "../components/ShadowPricesPanel";

export function BottlenecksPage() {
  const { run } = useScenario();
  return (
    <>
      <PageHeader path="/bottlenecks" />
      <ShadowPricesPanel clearing={run.clearing} />
    </>
  );
}
