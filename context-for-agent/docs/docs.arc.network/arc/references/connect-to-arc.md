> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arc.network/llms.txt
> Use this file to discover all available pages before exploring further.

# Connect to Arc

> Set up your wallet and configure your development environment for Arc Testnet.

export const ConnectWallet = () => {
  const ARC_TESTNET = {
    chainId: "0x4CEF52",
    chainName: "Arc Testnet",
    nativeCurrency: {
      name: "USDC",
      symbol: "USDC",
      decimals: 18
    },
    rpcUrls: ["https://rpc.testnet.arc.network"],
    blockExplorerUrls: ["https://testnet.arcscan.app"]
  };
  const walletIcon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="cw-icon shrink-0" aria-hidden="true">
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 1 0 0 4h3a1 1 0 0 0 1-1v-2.5" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>;
  const truncateAddress = addr => {
    if (!addr) return "";
    return addr.slice(0, 6) + "\u2026" + addr.slice(-4);
  };
  const canUseDOM = typeof window !== "undefined";
  const [status, setStatus] = useState("checking");
  const [address, setAddress] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [connectedWalletName, setConnectedWalletName] = useState(null);
  const providerRef = useRef(null);
  useEffect(() => {
    if (!canUseDOM) {
      setStatus("not-installed");
      return;
    }
    const discovered = [];
    const handleAnnounce = event => {
      const {info, provider} = event.detail;
      if (!discovered.some(w => w.info.uuid === info.uuid)) {
        discovered.push({
          info,
          provider
        });
        setWallets([...discovered]);
      }
    };
    window.addEventListener("eip6963:announceProvider", handleAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    const timer = setTimeout(() => {
      if (discovered.length === 0 && !window.ethereum) {
        setStatus("not-installed");
        return;
      }
      const savedUuid = canUseDOM && localStorage.getItem("cw-wallet-uuid");
      const savedConnected = canUseDOM && localStorage.getItem("cw-connected") === "1";
      if (!savedConnected) {
        setStatus("disconnected");
        return;
      }
      let restoredProvider = null;
      let restoredName = null;
      if (savedUuid && discovered.length > 0) {
        const match = discovered.find(w => w.info.uuid === savedUuid);
        if (match) {
          restoredProvider = match.provider;
          restoredName = match.info.name;
        }
      }
      if (!restoredProvider && window.ethereum) {
        restoredProvider = window.ethereum;
        restoredName = "Browser Wallet";
      }
      if (!restoredProvider) {
        setStatus("disconnected");
        return;
      }
      providerRef.current = restoredProvider;
      setConnectedWalletName(restoredName);
      (async () => {
        try {
          const accounts = await restoredProvider.request({
            method: "eth_requestAccounts"
          });
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setStatus("connected");
          } else {
            setStatus("disconnected");
          }
        } catch {
          setStatus("disconnected");
        }
      })();
    }, 50);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("eip6963:announceProvider", handleAnnounce);
    };
  }, []);
  useEffect(() => {
    const provider = providerRef.current;
    if (!provider || !provider.on) return;
    const handleAccountsChanged = accounts => {
      if (accounts.length === 0) {
        setAddress(null);
        setStatus("disconnected");
        if (canUseDOM) {
          localStorage.removeItem("cw-connected");
          localStorage.removeItem("cw-wallet-uuid");
        }
      } else {
        setAddress(accounts[0]);
      }
    };
    const handleChainChanged = () => {};
    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);
    return () => {
      provider.removeListener("accountsChanged", handleAccountsChanged);
      provider.removeListener("chainChanged", handleChainChanged);
    };
  }, [status, address]);
  const connectWithProvider = async (provider, walletInfo) => {
    setError(null);
    setShowPicker(false);
    setStatus("connecting");
    try {
      const accounts = await provider.request({
        method: "eth_requestAccounts"
      });
      setAddress(accounts[0]);
      providerRef.current = provider;
      setConnectedWalletName(walletInfo?.name || "Browser Wallet");
      setStatus("switching");
      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{
            chainId: ARC_TESTNET.chainId
          }]
        });
      } catch (switchErr) {
        if (switchErr.code === 4902) {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [ARC_TESTNET]
          });
        } else {
          throw switchErr;
        }
      }
      if (canUseDOM) {
        localStorage.setItem("cw-connected", "1");
        if (walletInfo?.uuid) {
          localStorage.setItem("cw-wallet-uuid", walletInfo.uuid);
        }
      }
      setStatus("connected");
    } catch (err) {
      if (err.code === 4001) {
        setError("Request rejected. Try again when ready.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      setStatus("disconnected");
    }
  };
  const handleConnect = () => {
    if (wallets.length > 1) {
      setShowPicker(true);
      return;
    }
    if (wallets.length === 1) {
      connectWithProvider(wallets[0].provider, wallets[0].info);
      return;
    }
    if (window.ethereum) {
      connectWithProvider(window.ethereum, null);
      return;
    }
    setError("No wallet found. Install a browser wallet to continue.");
  };
  const handleDisconnect = async () => {
    const provider = providerRef.current;
    if (provider) {
      try {
        await provider.request({
          method: "wallet_revokePermissions",
          params: [{
            eth_accounts: {}
          }]
        });
      } catch {}
    }
    providerRef.current = null;
    setAddress(null);
    setConnectedWalletName(null);
    setStatus("disconnected");
    if (canUseDOM) {
      localStorage.removeItem("cw-connected");
      localStorage.removeItem("cw-wallet-uuid");
    }
  };
  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  if (status === "checking") {
    return null;
  }
  if (status === "not-installed") {
    return <div className="cw-card rounded-xl p-5 mb-4 not-prose">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {walletIcon}
            <p className="cw-text-body text-sm m-0">
              No wallet detected. Install a browser wallet to connect to Arc
              Testnet.
            </p>
          </div>
          <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="cw-btn-primary inline-block rounded-md px-4 py-2 text-sm font-medium no-underline whitespace-nowrap" aria-label="Download MetaMask (opens in new tab)">
            Get MetaMask →
          </a>
        </div>
      </div>;
  }
  if (status === "connected") {
    return <div className="cw-card rounded-xl p-5 mb-4 not-prose">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="cw-badge-connected inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{
      background: "currentColor"
    }} />
              Connected
            </span>
            <span className="cw-text-subtle text-xs">
              Arc Testnet{connectedWalletName ? ` · ${connectedWalletName}` : ""}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleCopy} className="cw-text-accent text-sm font-mono flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0" aria-label="Copy wallet address to clipboard" title={address}>
              {truncateAddress(address)}
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{
      display: copied ? "none" : "inline-block"
    }}>
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{
      display: copied ? "inline-block" : "none",
      color: "#8DD89F"
    }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
            <button onClick={handleDisconnect} className="cw-text-subtle text-xs bg-transparent border-0 cursor-pointer p-0 underline" aria-label="Disconnect wallet">
              Disconnect
            </button>
          </div>
        </div>
      </div>;
  }
  if (showPicker) {
    return <div className="cw-card rounded-xl p-5 mb-4 not-prose">
        <div className="flex items-center justify-between mb-3">
          <p className="cw-text-body text-sm font-medium m-0">Choose a wallet</p>
          <button onClick={() => setShowPicker(false)} className="cw-text-subtle text-xs bg-transparent border-0 cursor-pointer p-0 underline" aria-label="Cancel wallet selection">
            Cancel
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {wallets.map(w => <button key={w.info.uuid} onClick={() => connectWithProvider(w.provider, w.info)} className="cw-wallet-option flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left border-0 cursor-pointer transition-colors" aria-label={`Connect with ${w.info.name}`}>
              {w.info.icon ? <img src={w.info.icon} alt="" width="28" height="28" className="rounded-md shrink-0" aria-hidden="true" /> : <span className="inline-flex items-center justify-center w-7 h-7 rounded-md cw-wallet-icon-fallback shrink-0" aria-hidden="true">
                  {walletIcon}
                </span>}
              <span className="cw-text-body text-sm">{w.info.name}</span>
            </button>)}
        </div>
        {error && <p className="cw-error text-xs mt-2 mb-0" role="alert">
            {error}
          </p>}
      </div>;
  }
  const isLoading = status === "connecting" || status === "switching";
  const buttonText = isLoading ? status === "switching" ? "Adding network\u2026" : "Connecting\u2026" : "Connect Wallet";
  return <div className="cw-card rounded-xl p-5 mb-4 not-prose">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {walletIcon}
          <p className="cw-text-body text-sm m-0">
            Adds the network configuration and connects your account.
          </p>
        </div>
        <button onClick={handleConnect} disabled={isLoading} className="cw-btn-primary rounded-md px-4 py-2 text-sm font-medium border-0 cursor-pointer whitespace-nowrap shrink-0" aria-label="Connect wallet to Arc Testnet" aria-busy={isLoading}>
          {buttonText}
        </button>
      </div>
      {error && <p className="cw-error text-xs mt-2 mb-0" role="alert">
          {error}
        </p>}
    </div>;
};

Connect a wallet to Arc Testnet using one-click setup or manual configuration.

## Wallet setup

Use the button below to add Arc Testnet to your wallet automatically.

<ConnectWallet />

### Manual setup

<Tip>
  Arc uses USDC as the native gas token (18 decimals). If your wallet supports
  **custom gas tokens**, ensure display/decimals are set correctly. Wallets that
  don't support custom gas tokens still work for signing and sending
  transactions — balances may display as "ETH" but the underlying token is USDC.
  See [Gas and fees](/arc/references/gas-and-fees) for details.
</Tip>

<Tabs>
  <Tab title="MetaMask">
    <Steps>
      <Step title="Open network settings">
        Open MetaMask → **Settings** → **Networks** → **Add network** → **Add a network manually**.
      </Step>

      <Step title="Enter network details">
        | Field               | Value                             |
        | :------------------ | :-------------------------------- |
        | **Network name**    | Arc Testnet                       |
        | **New RPC URL**     | `https://rpc.testnet.arc.network` |
        | **Chain ID**        | 5042002                           |
        | **Currency symbol** | USDC                              |
        | **Explorer URL**    | `https://testnet.arcscan.app`     |
      </Step>

      <Step title="Save and switch">
        Click **Save**, then switch to Arc Testnet.
      </Step>
    </Steps>
  </Tab>

  <Tab title="Rabby">
    <Steps>
      <Step title="Open network settings">
        Open Rabby → click the **network selector** (top-left) → **Add Custom Network**.
      </Step>

      <Step title="Enter network details">
        | Field              | Value                             |
        | :----------------- | :-------------------------------- |
        | **Chain Name**     | Arc Testnet                       |
        | **Chain ID**       | 5042002                           |
        | **RPC URL**        | `https://rpc.testnet.arc.network` |
        | **Currency**       | USDC                              |
        | **Block Explorer** | `https://testnet.arcscan.app`     |
      </Step>

      <Step title="Confirm and switch">
        Click **Confirm**, then select Arc Testnet from the network list.
      </Step>
    </Steps>
  </Tab>

  <Tab title="Coinbase Wallet">
    <Steps>
      <Step title="Open network settings">
        Open Coinbase Wallet → **Settings** → **Networks** → **Add custom network**.
      </Step>

      <Step title="Enter network details">
        | Field               | Value                             |
        | :------------------ | :-------------------------------- |
        | **Network name**    | Arc Testnet                       |
        | **RPC URL**         | `https://rpc.testnet.arc.network` |
        | **Chain ID**        | 5042002                           |
        | **Currency symbol** | USDC                              |
        | **Block explorer**  | `https://testnet.arcscan.app`     |
      </Step>

      <Step title="Save and switch">
        Click **Save**, then switch to Arc Testnet.
      </Step>
    </Steps>
  </Tab>

  <Tab title="Rainbow">
    <Steps>
      <Step title="Open network settings">
        Open Rainbow → **Settings** (gear icon) → **Networks** → **Custom Network**.
      </Step>

      <Step title="Enter network details">
        | Field              | Value                             |
        | :----------------- | :-------------------------------- |
        | **Network name**   | Arc Testnet                       |
        | **RPC URL**        | `https://rpc.testnet.arc.network` |
        | **Chain ID**       | 5042002                           |
        | **Symbol**         | USDC                              |
        | **Block explorer** | `https://testnet.arcscan.app`     |
      </Step>

      <Step title="Save and switch">
        Click **Save**, then switch to Arc Testnet.
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Network details

| Parameter | Value                                              |
| :-------- | :------------------------------------------------- |
| Network   | Arc Testnet                                        |
| Chain ID  | `5042002`                                          |
| Currency  | USDC                                               |
| Explorer  | [testnet.arcscan.app](https://testnet.arcscan.app) |
| Faucet    | [faucet.circle.com](https://faucet.circle.com)     |

### RPC endpoints

<CodeGroup>
  ```text Primary theme={null}
  https://rpc.testnet.arc.network
  ```

  ```text Blockdaemon theme={null}
  https://rpc.blockdaemon.testnet.arc.network
  ```

  ```text dRPC theme={null}
  https://rpc.drpc.testnet.arc.network
  ```

  ```text QuickNode theme={null}
  https://rpc.quicknode.testnet.arc.network
  ```
</CodeGroup>

### WebSocket endpoints

<CodeGroup>
  ```text Primary theme={null}
  wss://rpc.testnet.arc.network
  ```

  ```text dRPC theme={null}
  wss://rpc.drpc.testnet.arc.network
  ```

  ```text QuickNode theme={null}
  wss://rpc.quicknode.testnet.arc.network
  ```
</CodeGroup>
