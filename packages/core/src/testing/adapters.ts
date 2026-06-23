/**
 * In-memory mock implementations of the chain/network-facing boundaries.
 *
 * These record what *would* hit the chain/network so tests can assert on it,
 * but perform NO live calls. They are drop-in replacements for the real
 * `@trapeza/adapter-arc` / `@trapeza/adapter-gateway` so the whole primitive is
 * exercisable with zero credentials.
 */

import type {
  ChainAdapter,
  Oracle,
  QuoteSource,
  SettlementAdapter,
} from "../interfaces.js";
import type {
  Outcome,
  ProviderProfile,
  Quote,
  TaskSpec,
} from "../models.js";

// ── Settlement (x402 pay-per-call) ──────────────────────────────────────────

export interface RecordedPayment {
  endpoint: string;
  body: unknown;
  amountUsdc: string;
  txHash: string;
}

/**
 * Records transfers; never touches a chain. Price per endpoint can be scripted;
 * otherwise a flat default is charged. Each `pay` mints a fake, unique txHash.
 */
export class MockSettlementAdapter implements SettlementAdapter {
  readonly payments: RecordedPayment[] = [];
  private seq = 0;
  private prices = new Map<string, string>();

  constructor(private defaultAmountUsdc = "0.001") {}

  /** Script the price an endpoint charges per x402 call. */
  setPrice(endpoint: string, amountUsdc: string): void {
    this.prices.set(endpoint, amountUsdc);
  }

  async pay(
    endpoint: string,
    body?: unknown,
  ): Promise<{ amountUsdc: string; txHash: string }> {
    const amountUsdc = this.prices.get(endpoint) ?? this.defaultAmountUsdc;
    const txHash = `0xpay${(++this.seq).toString(16).padStart(8, "0")}`;
    this.payments.push({ endpoint, body, amountUsdc, txHash });
    return { amountUsdc, txHash };
  }

  get totalPaidUsdc(): number {
    return this.payments.reduce((sum, p) => sum + Number(p.amountUsdc), 0);
  }
}

// ── Chain (ERC-8004 identity/reputation + bonded escrow) ────────────────────

export interface RecordedFeedback {
  agentId: bigint;
  score: number;
  tag: string;
  evidenceURI: string;
  txHash: string;
}

export interface RecordedEscrow {
  taskId: string;
  providerWallet: `0x${string}`;
  amountUsdc: string;
  state: "open" | "released" | "slashed";
  openTxHash: string;
  resolveTxHash?: string;
}

/** Mock Arc/ERC-8004/escrow. Mints sequential identities, records everything. */
export class MockChainAdapter implements ChainAdapter {
  readonly feedback: RecordedFeedback[] = [];
  readonly escrows = new Map<string, RecordedEscrow>();
  private identitySeq = 0n;
  private txSeq = 0;

  private nextTx(prefix: string): string {
    return `0x${prefix}${(++this.txSeq).toString(16).padStart(8, "0")}`;
  }

  async mintIdentity(_meta: object): Promise<bigint> {
    return ++this.identitySeq;
  }

  async giveFeedback(
    agentId: bigint,
    score: number,
    tag: string,
    evidenceURI: string,
  ): Promise<string> {
    const txHash = this.nextTx("fb");
    this.feedback.push({ agentId, score, tag, evidenceURI, txHash });
    return txHash;
  }

  async openEscrow(
    taskId: string,
    providerWallet: `0x${string}`,
    amountUsdc: string,
  ): Promise<string> {
    const openTxHash = this.nextTx("esc");
    this.escrows.set(taskId, {
      taskId,
      providerWallet,
      amountUsdc,
      state: "open",
      openTxHash,
    });
    return openTxHash;
  }

  async resolveEscrow(
    taskId: string,
    action: "release" | "slash",
  ): Promise<string> {
    const esc = this.escrows.get(taskId);
    if (!esc) throw new Error(`resolveEscrow: no escrow for task ${taskId}`);
    const resolveTxHash = this.nextTx(action === "release" ? "rel" : "slh");
    esc.state = action === "release" ? "released" : "slashed";
    esc.resolveTxHash = resolveTxHash;
    return resolveTxHash;
  }
}

// ── Oracle (deterministic, scriptable pass/fail) ────────────────────────────

export interface OracleVerdict {
  passed: boolean;
  score?: number;
  evidenceURI?: string;
  realizedCostUsdc?: string;
  realizedLatencyMs?: number;
}

/**
 * Deterministic oracle. Script verdicts per taskId; otherwise a configurable
 * default applies (pass, score 100). Realized cost defaults to the settlement
 * receipt amount carried on the execute result, so the calibration ledger gets
 * a realistic cost without the oracle needing chain access.
 */
export class MockOracle implements Oracle {
  private scripted = new Map<string, OracleVerdict>();

  constructor(
    private defaultVerdict: OracleVerdict = { passed: true, score: 100 },
  ) {}

  /** Script the verdict for a specific task. */
  script(taskId: string, verdict: OracleVerdict): this {
    this.scripted.set(taskId, verdict);
    return this;
  }

  async verify(spec: TaskSpec, result: unknown): Promise<Outcome> {
    const verdict = this.scripted.get(spec.id) ?? this.defaultVerdict;
    const r = result as
      | { provider?: string; receipt?: { amountUsdc?: string } }
      | undefined;

    const providerId = r?.provider ?? "unknown";
    const realizedCostUsdc =
      verdict.realizedCostUsdc ?? r?.receipt?.amountUsdc ?? "0";
    const score = verdict.score ?? (verdict.passed ? 100 : 0);

    return {
      taskId: spec.id,
      providerId,
      passed: verdict.passed,
      score,
      evidenceURI:
        verdict.evidenceURI ?? `mock://oracle/${spec.id}/${verdict.passed}`,
      realizedCostUsdc,
      realizedLatencyMs: verdict.realizedLatencyMs ?? 100,
    };
  }
}

// ── Quote source (the RFQ step) ─────────────────────────────────────────────

export type QuoteFn = (
  spec: TaskSpec,
  provider: ProviderProfile,
) => Quote | null;

/**
 * Produces self-reported quotes for a task. Either provide a `quoteFn` that maps
 * a (task, provider) to a Quote, or pre-register static quotes by providerId.
 * These are PRIORS — the router ignores `claimedSuccessProb` whenever
 * calibration is on.
 */
export class MockQuoteSource implements QuoteSource {
  private static_ = new Map<string, Omit<Quote, "providerId">>();

  constructor(private quoteFn?: QuoteFn) {}

  /** Register a static self-report for a provider. */
  setQuote(providerId: string, quote: Omit<Quote, "providerId">): this {
    this.static_.set(providerId, quote);
    return this;
  }

  async quotesFor(
    spec: TaskSpec,
    providers: ProviderProfile[],
  ): Promise<Quote[]> {
    const quotes: Quote[] = [];
    for (const provider of providers) {
      if (this.quoteFn) {
        const q = this.quoteFn(spec, provider);
        if (q) quotes.push(q);
        continue;
      }
      const stat = this.static_.get(provider.id);
      if (stat) quotes.push({ providerId: provider.id, ...stat });
    }
    return quotes;
  }
}
