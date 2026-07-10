import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ScenarioProvider } from "./scenario/ScenarioContext";
import { Layout } from "./routes/Layout";
import { OverviewPage } from "./pages/OverviewPage";
import { ClearingPage } from "./pages/ClearingPage";
import { BakeoffPage } from "./pages/BakeoffPage";
import { CalibrationPage } from "./pages/CalibrationPage";
import { BottlenecksPage } from "./pages/BottlenecksPage";
import { RiskPage } from "./pages/RiskPage";
import { SettlementPage } from "./pages/SettlementPage";
import { RunPage } from "./pages/RunPage";

export function App() {
  return (
    <BrowserRouter>
      <ScenarioProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<OverviewPage />} />
            <Route path="clearing" element={<ClearingPage />} />
            <Route path="bakeoff" element={<BakeoffPage />} />
            <Route path="calibration" element={<CalibrationPage />} />
            <Route path="bottlenecks" element={<BottlenecksPage />} />
            <Route path="risk" element={<RiskPage />} />
            <Route path="settlement" element={<SettlementPage />} />
            <Route path="run" element={<RunPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </ScenarioProvider>
    </BrowserRouter>
  );
}
