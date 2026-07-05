> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Browse SDKs

> Explore Circle's SDKs to learn and simplify your development with the Circle Platform

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

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <SDKCard
    id="developer-controlled-wallet-sdk"
    title="Developer-Controlled Wallets SDK"
    description="Server SDK for creating and managing developer-controlled wallets"
    icon="wallet"
    iconColor="orange"
    product="Wallets"
    languages="TypeScript, Python"
    links={[
{
  label: "Node.js",
  href: "https://www.npmjs.com/package/@circle-fin/developer-controlled-wallets",
  icon: "npm",
},
{
  label: "Python",
  href: "https://pypi.org/project/circle-developer-controlled-wallets/",
},
{
  label: "Node.js docs",
  href: "/sdks/developer-controlled-wallets-nodejs-sdk",
},
{
  label: "Python docs",
  href: "/sdks/developer-controlled-wallets-python-sdk",
},
]}
  />

  <SDKCard
    id="modular-wallet-sdk-client"
    title="Modular Wallets SDK"
    description="Client SDK for creating and managing modular wallets"
    icon="template"
    iconColor="blue"
    product="Modular Wallets"
    languages="JavaScript, TypeScript, Swift, Kotlin, Java"
    platforms={[
{ name: "Web", icon: "globe" },
{ name: "iOS", icon: "apple" },
{ name: "Android", icon: "android" },
]}
    links={[
{
  label: "Web",
  href: "https://www.npmjs.com/package/@circle-fin/modular-wallets-core",
  icon: "npm",
},
{
  label: "iOS",
  href: "https://github.com/circlefin/modularwallets-ios-sdk",
  icon: "github",
},
{
  label: "Android",
  href: "https://github.com/circlefin/modularwallets-android-sdk",
  icon: "github",
},
{
  label: "Web docs",
  href: "/wallets/modular/web-sdk",
},
{
  label: "iOS docs",
  href: "/wallets/modular/ios-sdk",
},
{
  label: "Android docs",
  href: "/wallets/modular/android-sdk",
},
]}
  />

  <SDKCard
    id="user-controlled-wallet-sdk-client"
    title="User-Controlled Wallets SDK (Client)"
    description="Client SDK for creating and managing user-controlled wallets"
    icon="wallet"
    iconColor="green"
    product="Wallets"
    languages="JavaScript, TypeScript, Kotlin, Swift"
    platforms={[
{ name: "Web", icon: "globe" },
{ name: "React", icon: "react" },
{ name: "iOS", icon: "apple" },
{ name: "Android", icon: "android" },
]}
    links={[
{
  label: "Web",
  href: "https://github.com/circlefin/w3s-pw-web-sdk",
  icon: "github",
},
{
  label: "React Native",
  href: "https://github.com/circlefin/w3s-react-native-sdk",
  icon: "github",
},
{
  label: "iOS",
  href: "https://github.com/circlefin/w3s-ios-sdk",
  icon: "github",
},
{
  label: "Android",
  href: "https://github.com/circlefin/w3s-android-sdk",
  icon: "github",
},
]}
  />

  <SDKCard
    id="user-controlled-wallet-sdk-server"
    title="User-Controlled Wallets SDK (Server)"
    description="Server SDK for creating and managing user-controlled wallets"
    icon="wallet"
    iconColor="green"
    product="Wallets"
    languages="TypeScript, Python"
    links={[
{
  label: "Node.js",
  href: "https://www.npmjs.com/package/@circle-fin/user-controlled-wallets",
  icon: "npm",
},
{
  label: "Python",
  href: "https://pypi.org/project/circle-user-controlled-wallets/",
},
{
  label: "Node.js docs",
  href: "/sdks/user-controlled-wallets-nodejs-sdk",
},
{
  label: "Python docs",
  href: "/sdks/user-controlled-wallets-python-sdk",
},
]}
  />

  <SDKCard
    id="smart-contract-platform-sdk"
    title="Contracts SDK"
    description="Server SDK for creating and managing smart contracts"
    icon="contract"
    iconColor="purple"
    product="Contracts"
    languages="TypeScript, Python"
    links={[
{
  label: "Node.js",
  href: "https://www.npmjs.com/package/@circle-fin/smart-contract-platform",
  icon: "npm",
},
{
  label: "Python",
  href: "https://pypi.org/project/circle-smart-contract-platform/",
},
{
  label: "Node.js docs",
  href: "/sdks/contracts-nodejs-sdk",
},
{
  label: "Python docs",
  href: "/sdks/contracts-python-sdk",
},
]}
  />

  <SDKCard
    id="mint-payouts-sdk"
    title="Mint Payouts SDK"
    description="Server SDK for creating and managing stablecoin payouts"
    icon="library"
    iconColor="violet"
    product="Mint"
    languages="NodeJS"
    links={[
{
  label: "Github",
  href: "https://github.com/circlefin/circle-nodejs-sdk",
  icon: "github",
},
]}
  />
</div>
