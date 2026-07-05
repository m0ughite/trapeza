> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arc.network/llms.txt
> Use this file to discover all available pages before exploring further.

# Install App Kit

> Install the App Kit core package and your preferred adapter to start building apps

To get started with App Kit, install the latest core package and the adapter
that fits your environment.

<Note>
  To [swap](/app-kit/swap), you need a (free) kit key from
  [Circle Console](https://console.circle.com).
</Note>

<Steps>
  <Step title="Install the core package">
    <CodeGroup>
      ```bash npm theme={null}
      npm install @circle-fin/app-kit
      ```

      ```bash yarn theme={null}
      yarn add @circle-fin/app-kit
      ```
    </CodeGroup>

    <Accordion icon="circle-info" title="Need a lighter install? Individual packages are available">
      App Kit lets you access all its capabilities in a single package. If you prefer to just install the capabilities you need, you can install the standalone packages:

      <CodeGroup>
        ```bash npm theme={null}
        ## Bridge
        npm install @circle-fin/bridge-kit

        ## Swap
        npm install @circle-fin/swap-kit

        ## Unified Balance
        npm install @circle-fin/unified-balance-kit
        ```

        ```bash yarn theme={null}
        ## Bridge
        yarn add @circle-fin/bridge-kit

        ## Swap
        yarn add @circle-fin/swap-kit

        ## Unified Balance
        yarn add @circle-fin/unified-balance-kit
        ```
      </CodeGroup>
    </Accordion>
  </Step>

  <Step title="Install your preferred adapter">
    <Tabs>
      <Tab title="Viem">
        <CodeGroup>
          ```bash npm theme={null}
          npm install @circle-fin/adapter-viem-v2 viem
          ```

          ```bash yarn theme={null}
          yarn add @circle-fin/adapter-viem-v2 viem
          ```
        </CodeGroup>
      </Tab>

      <Tab title="Ethers">
        <CodeGroup>
          ```bash npm theme={null}
          npm install @circle-fin/adapter-ethers-v6 ethers
          ```

          ```bash yarn theme={null}
          yarn add @circle-fin/adapter-ethers-v6 ethers
          ```
        </CodeGroup>
      </Tab>

      <Tab title="Solana">
        <CodeGroup>
          ```bash npm theme={null}
          npm install @circle-fin/adapter-solana-kit @solana/kit @solana/web3.js
          ```

          ```bash yarn theme={null}
          yarn add @circle-fin/adapter-solana-kit @solana/kit @solana/web3.js
          ```
        </CodeGroup>

        If bridging, you should also install an EVM adapter (Viem or Ethers).

        <Note>
          For the [Bridge tokens across blockchains](/app-kit/quickstarts/bridge-tokens-across-blockchains#solana) quickstart
          and [adapter setup](/app-kit/tutorials/adapter-setups#solana) examples, the same
          adapter is used with `@solana/kit` and `@solana/web3.js`.
        </Note>
      </Tab>

      <Tab title="Circle Wallets">
        <Badge color="blue">server-side only</Badge>

        If you have a [Circle Wallets](https://developers.circle.com/wallets) account, you can use the Circle Wallets adapter to
        connect to developer-controlled wallets and Circle Contracts.

        <CodeGroup>
          ```bash npm theme={null}
          npm install @circle-fin/adapter-circle-wallets
          ```

          ```bash yarn theme={null}
          yarn add @circle-fin/adapter-circle-wallets
          ```
        </CodeGroup>
      </Tab>
    </Tabs>
  </Step>
</Steps>
