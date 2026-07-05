> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Quotes

Quotes are real-time exchange rates and settlement costs for a specific payment
corridor. A quote includes the following key elements:

* **Exchange rate lock**: The quote locks in an exchange rate for a specified
  time window, protecting both the OFI and the sender from market volatility
  during the payment process. When the time window expires, a new quote must be
  requested.
* **Two-way quotes**: You may query the quote based on the source amount and the
  destination amount. For instance, if a customer holding USDC wants to pay a
  recipient in BRL and the recipient needs an accurate amount of BRL, you can
  query using the destination amount. If a quote is for a remittance use case,
  where the customer needs an accurate amount of USDC to send, you can query
  using the source amount.
* **Cost breakdown**: The quote response includes details of all applicable
  fees, including fee and any additional charges at the transaction level,
  ensuring transparent cost estimation.
* **Competitive aggregation**: By providing multiple quotes, CPN ensures that
  OFIs can choose the most competitive option based on price, speed, and
  compliance.
