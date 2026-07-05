> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Payment

A payment represents the end-to-end CPN payment flow, including the onchain
transaction and RFI check. It is initiated by locking in a quote and providing
the required recipient details.

The payment process begins when an OFI locks in a quote and submits sender and
beneficiary details. The transaction undergoes compliance checks, including the
RFI process if required. Once all necessary compliance checks are completed, the
payment enters the onchain transaction phase, where it awaits the transfer of
USDC. After the crypto transfer is received, the BFI initiates a fiat transfer
to the final recipient.

During the fiat transfer, the CPN sends webhook notifications to the OFI
indicating that the transfer has been confirmed or canceled. If the fiat
transfer is canceled or fails for any reason, the BFI issues a refund of crypto
to the OFI.
