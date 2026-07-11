import { useScenario } from "../scenario/ScenarioContext";
import { PageHeader } from "./PageHeader";
import { CalibrationPanel } from "../components/CalibrationPanel";

export function CalibrationPage() {
  const { run } = useScenario();
  return (
    <>
      <PageHeader path="/calibration" />
      <CalibrationPanel calibration={run.calibration} providers={run.providers} />
    </>
  );
}
