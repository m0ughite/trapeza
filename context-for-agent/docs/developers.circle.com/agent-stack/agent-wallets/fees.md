> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Agent Wallet Fees

> Fee breakdown for agent wallet operations, including bridging, swapping, and payments.

The following fees may apply depending on the operations your agent wallet
performs:

| Fee                    | Amount                           | When it applies                                |
| :--------------------- | :------------------------------- | :--------------------------------------------- |
| Gas                    | \$0 (sponsored)                  | All onchain transactions                       |
| CCTP fast transfer fee | Varies by source blockchain      | Bridging                                       |
| Forwarding service fee | \$0.20                           | Bridging                                       |
| Forwarding gas fee     | Varies by destination blockchain | Bridging                                       |
| Swap provider fee      | 2 bps                            | Swapping                                       |
| Gateway protocol fee   | 0.5 bps                          | Crosschain x402 payments (free for same-chain) |
| Eco deposit fee        | Set by Eco                       | Gasless Gateway deposits using Eco             |

<Note>
  Eco is a third-party fast-deposit service. Circle does not operate, endorse,
  or audit Eco. Review [Eco's
  docs](https://eco.com/docs/getting-started/programmable-addresses/gateway-deposits)
  and test the flow before using it in production.
</Note>

What to know about agent wallet fees:

* **Gas sponsorship**: Onchain transactions on agent wallets are gas-sponsored
  at no cost to you. Sponsorship is capped, subject to fair use, and may change
  over time.
* **CCTP fast transfer**: Agent Wallets use CCTP fast transfer only for
  bridging, which provides near-instant finality at a higher fee than standard
  transfers. For fast transfer rates by source blockchain, see
  [CCTP fees](/cctp/concepts/fees).
* **Forwarding gas fee**: Bridging also incurs a forwarding gas fee that varies
  by destination blockchain.
