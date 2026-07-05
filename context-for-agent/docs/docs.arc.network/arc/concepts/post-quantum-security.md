> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arc.network/llms.txt
> Use this file to discover all available pages before exploring further.

# Post-quantum security

> Arc's post-quantum roadmap covers wallet signatures, validator authentication, private state, and supporting infrastructure against quantum-era attacks.

Arc's post-quantum roadmap covers wallet signatures, validator authentication,
private smart contract state, and offchain infrastructure.

<Info>
  Post-quantum features are on the roadmap and not yet available on Arc.
</Info>

## Why post-quantum security matters

Most public-key cryptography used today is vulnerable to large-scale quantum
computers. If those computers become practical, blockchains face two risks:

* **Signature forgery.** A quantum computer that breaks public-key cryptography
  can forge signatures that secure wallets, authorize transactions, and
  authenticate network participants.
* **Harvest-now, decrypt-later attacks.** Encrypted data captured today can be
  stored and decrypted later when quantum attacks become practical, exposing
  private transaction details, balances, and other sensitive data.

Because blockchain data is long-lived, post-quantum protections need to be in
place before quantum attacks are widely available.

## Post-quantum roadmap

Arc's roadmap phases each layer in a production-aligned sequence.

| Milestone                         | Release target | Scope                                                                                                                       | Why it matters                                                                                                                  |
| --------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Post-quantum wallet signatures    | Mainnet launch | Arc mainnet launches support for a post-quantum wallet signature scheme using `SLH-DSA-SHA2-128s`.                          | Classical wallet signatures are the most immediate quantum risk to user funds.                                                  |
| Post-quantum privacy              | Near-term      | Arc Privacy mainnet introduces post-quantum protections for encrypted state and node-to-node communication in privacy mode. | Private balances, counterparties, and transaction details face harvest-now, decrypt-later risk without post-quantum encryption. |
| Offchain infrastructure upgrades  | Mid-term       | Circle upgrades infrastructure such as TLS, encrypted data flows, and related operational systems.                          | Offchain infrastructure uses the same vulnerable cryptography as onchain systems.                                               |
| Post-quantum validator signatures | Long-term      | Arc adds a quantum-resistant signature scheme for validators.                                                               | Consensus signatures protect the integrity of the Arc ledger.                                                                   |

## Post-quantum wallet signatures

Arc introduces beta support for a post-quantum wallet signature based on
`SLH-DSA-SHA2-128s` at mainnet launch. Adoption is opt-in.

Ecosystem constraints to keep in mind:

* Hardware wallet support will take time to mature.
* Post-quantum standards are still evolving, so long-term signature choices may
  change.

<Warning>
  Expect a transition period as tooling, wallet support, and integrations
  mature.
</Warning>

## Post-quantum privacy

[Arc Privacy](/arc/concepts/opt-in-privacy) addresses the harvest-now,
decrypt-later threat. When Arc Privacy launches, encrypted state and private
transaction flows use post-quantum cryptography.

Attackers can capture encrypted data today and attempt to decrypt it later when
quantum attacks become practical. Post-quantum encryption at the platform level
protects sensitive balances, transaction details, and recipients without
requiring you to implement custom post-quantum cryptography.

## Post-quantum validator signatures

Validator authentication also requires post-quantum protection to keep the
ledger resilient. Arc adds post-quantum validator signatures in a later phase.

This sequencing is intentional: validator upgrades must be introduced carefully
to preserve throughput, latency, and operational reliability. Because Arc uses
sub-second finality, the window to exploit validator signatures is narrower than
the wallet-signature risk, making wallets the higher-priority target.

## Offchain infrastructure

Quantum resilience extends beyond the chain itself. Circle's roadmap includes
upgrading TLS, encrypted data flows, access controls, cloud environments, and
other operational systems that support Arc.

Offchain traffic and stored data face the same post-quantum threat vectors as
onchain data when vulnerable cryptography remains in use.
