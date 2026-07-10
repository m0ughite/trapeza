import { useScenario } from "../scenario/ScenarioContext";
import { PageHeader } from "./PageHeader";
import { BakeOffPanel } from "../components/BakeOffPanel";

export function BakeoffPage() {
  const { run } = useScenario();
  return (
    <>
      <PageHeader path="/bakeoff" />
      <BakeOffPanel bakeOff={run.bakeOff} />
    </>
  );
}
