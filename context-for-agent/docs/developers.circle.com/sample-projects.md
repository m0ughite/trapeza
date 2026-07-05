> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Browse Sample Projects

export const SDKCard = ({id, title, description, icon, iconName, iconColor, product, textForProduct, languages, textForLanguages, platforms, links, relevantLinks, anchor}) => {
  const finalIcon = iconName || icon;
  const finalIconColor = iconColor || "blue";
  const finalProduct = textForProduct || product;
  const finalLanguages = textForLanguages || languages;
  const finalLinks = relevantLinks || links || [];
  const finalPlatforms = platforms || [];
  const WalletIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 25 24" className="pointer-events-none" aria-hidden="true" focusable="false" role="img">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.676 6.647c0-.437.186-.856.517-1.165A1.83 1.83 0 0 1 5.441 5h11.47c.469 0 .918.174 1.249.482.33.31.517.728.517 1.165v.824m-15-.824v11.706c0 .437.185.856.516 1.165.331.308.78.482 1.248.482H19.56a1.83 1.83 0 0 0 1.248-.482c.33-.31.517-.728.517-1.165v-1.824M3.675 6.647c0 .437.186.856.517 1.165s.78.482 1.248.482H19.56c.468 0 .917.174 1.248.483.33.308.517.727.517 1.164v1.824M17.5 16h4.3a.7.7 0 0 0 .7-.7v-2.6a.7.7 0 0 0-.7-.7h-4.3a2 2 0 1 0 0 4" />
    </svg>;
  const TemplateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="pointer-events-none" aria-hidden="true" focusable="false" role="img">
      <path strokeMiterlimit="10" strokeWidth="2" d="M4 8v11c0 1.1.9 2 2 2h10" />
      <path strokeMiterlimit="10" strokeWidth="2" d="m19.7 7.4-4.6-4.2c-.2-.1-.4-.2-.6-.2H9.7C8.8 3 8 3.7 8 4.6v10.9c0 .8.8 1.5 1.7 1.5h8.6c.9 0 1.7-.7 1.7-1.6V8q0-.3-.3-.6Z" />
      <path strokeMiterlimit="10" strokeWidth="2" d="M15 3.1v4.4c0 .3.2.5.5.5H20M17.1 7.5l-1.2-2.2" />
    </svg>;
  const ContractIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="pointer-events-none" aria-hidden="true" focusable="false" role="img">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m10.5 15-2-2 2-2m3 4 2-2-2-2M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2" />
    </svg>;
  const SwitchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="pointer-events-none" aria-hidden="true" focusable="false" role="img">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0-4-4m4 4-4 4m0 6H4m0 0 4 4m-4-4 4-4" />
    </svg>;
  const LibraryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="pointer-events-none" aria-hidden="true" focusable="false" role="img">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4z" />
    </svg>;
  const BeakerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="cb-icon cb-icon-beakeroutline pointer-events-none" aria-hidden="true" data-testid="icon-beakeroutline" focusable="false" role="img">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 0 0-1.022-.547l-2.387-.477a6 6 0 0 0-3.86.517l-.318.158a6 6 0 0 1-3.86.517L6.05 15.21a2 2 0 0 0-1.806.547M8 4h8l-1 1v5.172a2 2 0 0 0 .586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 0 0 9 10.172V5z"></path>
    </svg>;
  const iconColorStyles = {
    orange: {
      light: {
        backgroundColor: "#fff7ed",
        color: "#ea580c"
      },
      dark: {
        backgroundColor: "#431407",
        color: "#fb923c"
      }
    },
    blue: {
      light: {
        backgroundColor: "#eff6ff",
        color: "#2563eb"
      },
      dark: {
        backgroundColor: "#1e3a8a",
        color: "#60a5fa"
      }
    },
    green: {
      light: {
        backgroundColor: "#f0fdf4",
        color: "#16a34a"
      },
      dark: {
        backgroundColor: "#14532d",
        color: "#4ade80"
      }
    },
    purple: {
      light: {
        backgroundColor: "#faf5ff",
        color: "#9333ea"
      },
      dark: {
        backgroundColor: "#581c87",
        color: "#c084fc"
      }
    },
    violet: {
      light: {
        backgroundColor: "#f5f3ff",
        color: "#7c3aed"
      },
      dark: {
        backgroundColor: "#4c1d95",
        color: "#a78bfa"
      }
    },
    pink: {
      light: {
        backgroundColor: "#fdf2f8",
        color: "#ec4899"
      },
      dark: {
        backgroundColor: "#831843",
        color: "#f9a8d4"
      }
    },
    red: {
      light: {
        backgroundColor: "#fef2f2",
        color: "#dc2626"
      },
      dark: {
        backgroundColor: "#7f1d1d",
        color: "#f87171"
      }
    },
    "accent-orange": {
      light: {
        backgroundColor: "#fff7ed",
        color: "#ea580c"
      },
      dark: {
        backgroundColor: "#431407",
        color: "#fb923c"
      }
    },
    "accent-blue": {
      light: {
        backgroundColor: "#eff6ff",
        color: "#2563eb"
      },
      dark: {
        backgroundColor: "#1e3a8a",
        color: "#60a5fa"
      }
    },
    "accent-green": {
      light: {
        backgroundColor: "#f0fdf4",
        color: "#16a34a"
      },
      dark: {
        backgroundColor: "#14532d",
        color: "#4ade80"
      }
    },
    "accent-purple": {
      light: {
        backgroundColor: "#faf5ff",
        color: "#9333ea"
      },
      dark: {
        backgroundColor: "#581c87",
        color: "#c084fc"
      }
    },
    "accent-violet": {
      light: {
        backgroundColor: "#f5f3ff",
        color: "#7c3aed"
      },
      dark: {
        backgroundColor: "#4c1d95",
        color: "#a78bfa"
      }
    },
    "accent-pink": {
      light: {
        backgroundColor: "#fdf2f8",
        color: "#ec4899"
      },
      dark: {
        backgroundColor: "#831843",
        color: "#f9a8d4"
      }
    },
    error: {
      light: {
        backgroundColor: "#fef2f2",
        color: "#dc2626"
      },
      dark: {
        backgroundColor: "#7f1d1d",
        color: "#f87171"
      }
    }
  };
  const iconColorClasses = {
    orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    violet: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
  };
  const iconComponents = {
    wallet: <WalletIcon />,
    WalletOutline: <WalletIcon />,
    template: <TemplateIcon />,
    TemplateOutline: <TemplateIcon />,
    contract: <ContractIcon />,
    ContractOutline: <ContractIcon />,
    switch: <SwitchIcon />,
    SwitchHorizontalOutline: <SwitchIcon />,
    library: <LibraryIcon />,
    LibraryOutline: <LibraryIcon />,
    beaker: <BeakerIcon />,
    BeakerOutline: <BeakerIcon />
  };
  const selectedIcon = iconComponents[finalIcon] || finalIcon;
  return <>
      <style>{`
        .icon-circle-${finalIconColor} {
          background-color: ${iconColorStyles[finalIconColor]?.light.backgroundColor};
          color: ${iconColorStyles[finalIconColor]?.light.color};
        }
        .dark .icon-circle-${finalIconColor} {
          background-color: ${iconColorStyles[finalIconColor]?.dark.backgroundColor};
          color: ${iconColorStyles[finalIconColor]?.dark.color};
        }
      `}</style>
      <div className="border border-gray-200 dark:border-[#2b323a] rounded-xl p-5 bg-white dark:bg-[#14171c] shadow-sm mt-4" data-testid="sdk-sample-card" id={anchor || id}>
        {}
        <div className="mb-4">
          <div className="flex flex-row items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 icon-circle-${finalIconColor}`}>
              {selectedIcon}
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {title}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {description}
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="flex flex-wrap gap-6 mb-4">
          {}
          {finalProduct && <div data-testid="sdk-sample-card-product">
              <div data-testid="card-detail">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Product
                </h3>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {finalProduct}
                </div>
              </div>
            </div>}

          {}
          {finalLanguages && <div data-testid="sdk-sample-card-languages">
              <div data-testid="card-detail">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Languages
                </h3>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {finalLanguages}
                </div>
              </div>
            </div>}

          {}
          {finalPlatforms && finalPlatforms.length > 0 && <div data-testid="sdk-sample-card-platforms">
              <div data-testid="card-detail">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Platforms
                </h3>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex flex-wrap items-center gap-3 font-semibold">
                    {finalPlatforms.map((platform, index) => {
    const platformName = typeof platform === "string" ? platform : platform.name;
    let platformIcon = typeof platform === "string" ? null : platform.icon;
    if (!platformIcon) {
      const lowerName = platformName.toLowerCase();
      if (lowerName.includes("react")) {
        platformIcon = "react";
      } else if (lowerName.includes("web")) {
        platformIcon = "globe";
      } else if (lowerName.includes("android")) {
        platformIcon = "android";
      } else if (lowerName.includes("ios")) {
        platformIcon = "apple";
      }
    }
    return <div key={index} className="flex items-center gap-1 shrink-0" data-testid="sdk-sample-card-platform-item">
                          {platformIcon && (platformIcon.endsWith(".svg") ? <img alt={platformName} loading="lazy" width="20" height="20" decoding="async" src={platformIcon} className="shrink-0" /> : <Icon icon={platformIcon} className="w-5 h-5 shrink-0" />)}
                          {platformName}
                        </div>;
  })}
                  </div>
                </div>
              </div>
            </div>}
        </div>

        {}
        <div className="flex flex-wrap gap-2" data-testid="sdk-sample-card-relevant-links">
          {finalLinks.map((link, index) => <a key={index} data-testid="sdk-sample-card-relevant-link" href={link.url || link.href} rel="noreferrer noopener nofollow" target={link.href?.startsWith("http") || link.href?.startsWith("https") ? "_blank" : "_self"} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium no-underline border border-gray-200 dark:border-[#363c45] bg-white dark:bg-[#1b1f24] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#252a31] hover:border-gray-300 dark:hover:border-[#454c57] transition-all duration-200">
              {link.icon && <Icon icon={link.icon} className="w-5 h-5 shrink-0" />}
              {link.type === "github" && <Icon icon="github" className="w-5 h-5 shrink-0" />}
              {link.label}
            </a>)}
        </div>
      </div>
    </>;
};

The following projects serve as reference implementations for features of Circle
developer tools. These projects include examples that you can use as a
foundation to build your own projects.

## Wallets

Wallets provides a comprehensive solution for you to build flexible, secure, and
scalable embedded wallets within your applications. For more information, see
the [Wallets documentation](/wallets).

<SDKCard
  title="Create escrow contracts for the gig economy using AI and USDC"
  description="Sample project demonstrating  for the integration of AI agents with blockchain to manage escrow services autonomously."
  iconName="WalletOutline"
  iconColor="accent-green"
  textForProduct="Wallets, Contracts"
  textForLanguages="TypeScript"
  platforms={["Web"]}
  relevantLinks={[
{
  label: "Replit",
  url: "https://replit.com/@buildoncircle/Trusted-Payment-Apps-with-AI-and-USDC?v=1",
},
]}
  anchor="create-escrow-contracts-for-the-gig-economy-using-ai-and-usdc"
/>

<SDKCard
  title="Autonomous payments with AI agents"
  description="Sample app for autonomous USDC payments with AI agents using the developer-controlled wallets SDK"
  iconName="WalletOutline"
  iconColor="accent-green"
  textForProduct="Wallets"
  textForLanguages="Python"
  platforms={["Web"]}
  relevantLinks={[
{
  label: "Replit",
  url: "https://replit.com/t/circle-developer/repls/AI-Agent-Autonomous-Payment-System/view#README.md",
},
]}
  anchor="autonomous-payments-with-ai-agents"
/>

<SDKCard
  title="Create a smart account and send a gasless transaction"
  description="Sample app showcasing how to use the modular wallets web SDK to register for and log in to a Circle smart account with passkeys, and send a user operation using this account on Polygon Amoy"
  iconName="WalletOutline"
  iconColor="accent-green"
  textForProduct="Wallets"
  textForLanguages="JavaScript"
  platforms={["Web", "React"]}
  relevantLinks={[
{
  type: "github",
  label: "Github",
  url: "https://github.com/circlefin/modularwallets-web-sdk",
},
]}
  anchor="create-a-smart-account-and-send-a-gasless-transaction"
/>

<SDKCard
  title="User account creation, social and email login, and PIN authorization flow"
  description="Sample app for experiencing user account creation, login UX, and PIN authorization flow powered by the user-controlled wallets SDK (client)"
  iconName="WalletOutline"
  iconColor="accent-green"
  textForProduct="Wallets"
  textForLanguages="JavaScript, TypeScript, Kotlin, Swift"
  platforms={["iOS", "Android", "Web", "React"]}
  relevantLinks={[
{
  type: "github",
  label: "Web",
  url: "https://github.com/circlefin/w3s-pw-web-sdk/tree/master/examples",
},
{
  type: "github",
  label: "React Native",
  url: "https://github.com/circlefin/w3s-react-native-sample-app-wallets",
},
{
  type: "github",
  label: "iOS",
  url: "https://github.com/circlefin/w3s-ios-sample-app-wallets",
},
{
  type: "github",
  label: "Android",
  url: "https://github.com/circlefin/w3s-android-sample-app-wallets",
},
]}
  anchor="user-account-creation-and-email-login-and-pin-authorization-flow"
/>

<SDKCard
  title="User account creation and social login"
  description="Sample app for experiencing user account creation and login UX powered by the user-controlled wallets SDK (client)"
  iconName="WalletOutline"
  iconColor="accent-green"
  textForProduct="Wallets"
  textForLanguages="TypeScript"
  platforms={["iOS"]}
  relevantLinks={[
{
  type: "github",
  label: "iOS",
  url: "https://github.com/circlefin/w3s-digital-wallet-iOS-sample-app",
},
]}
  anchor="user-account-creation-and-social-login"
/>

<SDKCard
  title="Manage user sessions"
  description="Test server to manage user sessions and requests powered by the user-controlled wallets SDK (server)"
  iconName="WalletOutline"
  iconColor="accent-green"
  textForProduct="Wallets"
  textForLanguages="JavaScript"
  platforms={["Web"]}
  relevantLinks={[
{
  type: "github",
  label: "Github",
  url: "https://github.com/circlefin/w3s-programmable-wallets-test-server",
},
]}
  anchor="manage-user-sessions"
/>

<SDKCard
  title="Telegram bot with Wallets"
  description="Sample app that demonstrates the use of developer-controlled wallets to perform USDC operations on Telegram."
  iconName="WalletOutline"
  iconColor="accent-green"
  textForProduct="Wallets"
  textForLanguages="JavaScript"
  platforms={["Web"]}
  relevantLinks={[
{
  label: "Replit",
  url: "https://replit.com/@buildoncircle/Telegram-Bot-with-Programmable-Wallet",
},
]}
  anchor="telegram-bot-with-wallets"
/>

## Paymaster

Circle Paymaster allows your users to pay for network (gas) fees using USDC
tokens, instead of chain native tokens.

<SDKCard
  title="Pay for network fees with USDC"
  description="Sample app that demonstrates the use of Circle Paymaster to pay for network fees in USDC."
  iconName="WalletOutline"
  iconColor="accent-pink"
  textForProduct="Paymaster"
  textForLanguages="TypeScript"
  platforms={["Web"]}
  relevantLinks={[
{
  label: "Replit",
  url: "https://replit.com/@buildoncircle/Circle-Paymaster-Wallet",
},
]}
  anchor="pay-for-network-fees-with-usdc"
/>

## Circle Mint

Circle Mint is a fast and cost-effective way to access and redeem USDC and EURC.
For more information, see the [Circle Mint documentation](/circle-mint).

<SDKCard
  title="Test payment flows"
  description="Sample app to demonstrate features of the Mint Payments API"
  iconName="LibraryOutline"
  iconColor="accent-violet"
  textForProduct="Mint"
  textForLanguages="Vue"
  platforms={["Web"]}
  relevantLinks={[
{
  type: "github",
  label: "Github",
  url: "https://github.com/circlefin/payments-sample-app?tab=readme-ov-file",
},
]}
  anchor="test-payment-flows"
/>

## CCTP

Cross-Chain Transfer Protocol (CCTP) is an on-chain utility that allows for USDC
transfers between blockchains via native burning and minting. For more
information, see the [CCTP documentation](/cctp).

<SDKCard
  title="Fast and Standard Transfer USDC between blockchains"
  description="Sample app that demonstrates the fast transfer capabilities of CCTP"
  iconName="SwitchHorizontalOutline"
  iconColor="accent-blue"
  textForProduct="CCTP"
  textForLanguages="TypeScript"
  platforms={["Web", "React"]}
  relevantLinks={[
{
  type: "github",
  label: "Github",
  url: "https://github.com/circlefin/circle-cctp-crosschain-transfer",
},
{
  label: "Replit",
  url: "https://replit.com/@buildoncircle/circle-cctp-crosschain-transfer",
},
]}
  anchor="fast-transfer-usdc-between-blockchains"
/>

<SDKCard
  title="Cross-chain USDC Telegram bot with CCTP and Wallets"
  description="Sample app that demonstrates the use of developer-controlled wallets and CCTP to move USDC across chains on Telegram."
  iconName="SwitchHorizontalOutline"
  iconColor="accent-blue"
  textForProduct="CCTP, Wallets"
  textForLanguages="JavaScript"
  platforms={["Web"]}
  relevantLinks={[
{
  label: "Replit",
  url: "https://replit.com/@buildoncircle/Cross-Chain-USDC-Telegram-Bot-with-CCTP-v2-and-Circle-Wallets",
},
]}
  anchor="cross-chain-usdc-telegram-bot-with-cctp-and-wallets"
/>

## Circle Research

Circle Research develops cutting-edge insights and reference materials. For more
information see the
[Circle Research homepage](https://circle.com/circle-research).

<Warning>
  Circle Research projects are experimental. Make sure you test your code
  thoroughly if you are integrating ideas from these repositories.
</Warning>

<Banner variant="warning">
  Circle Research projects are experimental. Make sure you test your code
  thoroughly if you are integrating ideas from these repositories.
</Banner>

<SDKCard
  title="Evaluate a fast confirmation rule on Ethereum"
  description="Sample script to evaluate a fast confirmation rule for transaction settlement on Ethereum"
  iconName="BeakerOutline"
  iconColor="error"
  textForProduct="Circle Research"
  textForLanguages="Python"
  relevantLinks={[
{
  type: "github",
  label: "Github",
  url: "https://github.com/circlefin/ethereum-fast-confirmation-rule",
},
]}
  anchor="evaluate-a-fast-confirmation-rule-on-ethereum"
/>

<SDKCard
  title="Execute onchain transactions with intents and AI"
  description="Reference implementation of Circle Research's TXT2TXN project"
  iconName="BeakerOutline"
  iconColor="error"
  textForProduct="Circle Research"
  textForLanguages="JavaScript, Python"
  platforms={["Web"]}
  relevantLinks={[
{
  type: "github",
  label: "Frontend",
  url: "https://github.com/circlefin/txt2txn-web",
},
{
  type: "github",
  label: "Backend",
  url: "https://github.com/circlefin/txt2txn-service",
},
]}
  anchor="execute-onchain-transactions-with-intents-and-ai"
/>

<SDKCard
  title="Create credit apps powered by USDC"
  description="Reference implementation for building credit apps using USDC and Circle Research's Perimeter Protocol"
  iconName="BeakerOutline"
  iconColor="error"
  textForProduct="Circle Research"
  textForLanguages="TypeScript"
  platforms={["Web"]}
  relevantLinks={[
{
  type: "github",
  label: "Github",
  url: "https://github.com/circlefin/perimeter-protocol",
},
]}
  anchor="create-credit-apps-powered-by-usdc"
/>
