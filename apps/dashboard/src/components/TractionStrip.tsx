import type { TractionMetrics } from "../types/contract";
import { Stat } from "./ui";
import { ms, num, usd } from "../services/format";

export function TractionStrip(props: { traction: TractionMetrics }) {
  const t = props.traction;
  return (
    <div className="stat-row">
      <Stat k="steps cleared" v={t.nodesCleared} tone="mint" />
      <Stat k="testnet volume" v={usd(t.totalClearedUsdc)} />
      <Stat k="value per USDC" v={`${num(t.resultPerUsdc, 2)}×`} note="value delivered per dollar spent" />
      <Stat k="settlement makespan" v={ms(t.makespanMs)} small />
      <Stat k="payment chain depth" v={t.paymentChainDepth} small />
      <Stat k="workflow connectedness" v={num(t.graphDensity, 2)} small note="edges per step" />
      <Stat k="providers priced" v={t.providerCount} small />
    </div>
  );
}
