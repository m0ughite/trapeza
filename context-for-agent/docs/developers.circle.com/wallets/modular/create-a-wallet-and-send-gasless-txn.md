> ## Documentation Index
> Fetch the complete documentation index at: https://developers.circle.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart: Create a Modular Wallet

This Quickstart guides you through creating your first modular wallet smart
account and sending a gasless transaction using the modular wallets SDKs for
**Web**, **iOS**, or **Android**. For a complete web app implementation, refer
to the
[Circle Smart Account example](https://github.com/circlefin/modularwallets-web-sdk/tree/master/examples/circle-smart-account)
in the modular wallets web SDK.

## Prerequisites

Before you begin, ensure you have completed the following steps:

* Familiarize yourself with [API Keys and Client Keys](/api-reference/keys)
  authentication.
* Visit the [Modular Wallet Console Setup](/wallets/modular/console-setup) page
  to:
  * Create a **Client Key** for the modular wallets SDK
  * Configure the **Domain Name** for your Passkey.
  * Retrieve the **Client URL** for authentication.

<Note>
  **Note:**

  Circle provides a robust built-in indexing service optimized for subscribed
  transactions per wallet. You can set up
  [webhook subscriptions](https://console.circle.com/webhooks) on the Circle
  Console to receive notifications for transfer activities or user operations. To
  retrieve data from our Indexing Service through your backend, use an API Key to
  authenticate RESTful API requests.
</Note>

## Installation and Setup

Follow the applicable setup steps for the SDK you are installing:

<Tabs>
  <Tab title="Web SDK">
    1. Run the following command in your shell, depending on your package manager:

    <CodeGroup>
      ```shell npm theme={null}
      npm install @circle-fin/modular-wallets-core
      ```

      ```shell yarn theme={null}
      yarn add @circle-fin/modular-wallets-core
      ```
    </CodeGroup>

    2. Create an `.env` file in your local directory and add the **Client Key** and
       **Client URL** obtained from the
       [Modular Wallet Console Setup](/wallets/modular/console-setup) page:

    ```text theme={null}
    VITE_CLIENT_KEY=YOUR-CLIENT-KEY
    VITE_CLIENT_URL=YOUR-CLIENT-URL
    ```

    3. Follow the **React development workflow** to build your sample web app using
       the provided sample code.

    * The root dependencies should already be installed from the installation step
      above.
    * Install additional web app dependencies from the provided `package.json` file
      below.

    ```json package.json theme={null}
    {
      "name": "quickstart-circle-smart-account",
      "version": "0.0.0",
      "private": true,
      "type": "module",
      "scripts": {
        "dev": "vite"
      },
      "dependencies": {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "viem": "^2.21.27",
        "@circle-fin/modular-wallets-core": "^1.x.x"
      },
      "devDependencies": {
        "@types/react": "^18.0.27",
        "@types/react-dom": "^18.0.10",
        "@vitejs/plugin-react": "^4.3.2",
        "typescript": "^5.0.3",
        "vite": "^5.4.14"
      }
    }
    ```

    * Implement the quickstart steps below within a blank `index.tsx` file.
    * After completing all quickstart steps, you can test your app by launching a
      local web server.

    For more details, see the
    [Circle Smart Account Example](https://github.com/circlefin/modularwallets-web-sdk/tree/master/examples/circle-smart-account).
  </Tab>

  <Tab title="iOS SDK">
    ### Swift Package Manager

    The [Swift Package Manager](https://swift.org/package-manager/) is a tool for
    automating the distribution of Swift code and is integrated into the `swift`
    compiler.

    Once you have your Swift package set up, adding CircleModularWalletsCore as a
    dependency is as easy as adding it to the `dependencies` value of your
    `Package.swift` or the Package list in Xcode.

    ```swift Swift theme={null}
    dependencies: [
        .package(url: "https://github.com/circlefin/modularwallets-ios-sdk.git", .upToNextMajor(from: "1.0.0"))
    ]
    ```

    Normally you'll want to depend on the `CircleModularWalletsCore` target:

    ```swift Swift theme={null}
    .product(name: "CircleModularWalletsCore", package: "CircleModularWalletsCore")
    ```
  </Tab>

  <Tab title="Android SDK">
    Add the maven repository to your gradle file. It's suggested that load settings
    from `local.properties`:

    ```gradle Gradle theme={null}
    repositories {
        ...
        maven {
                Properties properties = new Properties()
                // Load local.properties.
                properties.load(new File(rootDir.absolutePath + "/local.properties").newDataInputStream())

            url properties.getProperty('mwsdk.maven.url')
            credentials {
                    username properties.getProperty('mwsdk.maven.username')
                    password properties.getProperty('mwsdk.maven.password')
            }
        }
    }
    ```

    Add the maven setting values in `local.properties` file:

    ```properties Properties theme={null}
    mwsdk.maven.url=https://maven.pkg.github.com/circlefin/modularwallets-android-sdk
    mwsdk.maven.username=<GITHUB_USERNAME>
    # Fine-grained personal access tokens or classic with package write permission.
    mwsdk.maven.password=<GITHUB_PAT>
    ```

    Add the dependency:

    ```gradle Gradle theme={null}
    dependencies {
        implementation 'circle.modularwallets:core:version'
    }
    ```
  </Tab>
</Tabs>

## Quickstart Steps

You can get started with the sample code below which showcases basic Modular
Wallets capabilities, including Circle Smart Account, passkey, paymaster, and
bundler services to send a gasless transaction with passkey signing.

### 1. Create or Use an Existing Passkey

Create a new Passkey or use an existing one from your
[client key, passkey domain, and client URL](/wallets/modular/console-setup)
values.

<CodeGroup>
  ```javascript WebSDK theme={null}
  import {
      toPasskeyTransport,
      toWebAuthnCredential,
  } from '@circle-fin/modular-wallets-core'

  // 0. retrieve client key and client url from environment vars
  const clientKey = import.meta.env.VITE_CLIENT_KEY as string
  const clientUrl = import.meta.env.VITE_CLIENT_URL as string

  // 1. register or login with a passkey and
  //    Create a Passkey Transport from client key
  const passkeyTransport = toPasskeyTransport(clientUrl, clientKey)
  const credential = await toWebAuthnCredential({
      transport: passkeyTransport,
      mode: WebAuthnMode.Register, //or WebAuthnMode.Login if login
      username: 'your-username'  //replace with actual username
  })
  ```

  ```swift iOS SDK theme={null}
  import CircleModularWalletsCore

  let CLIENT_KEY = "xxxxxxx:xxxxx"

  Task {
      do {
          // 1. Register or login with a passkey and
          //    Create a Passkey Transport from client key
          let transport = toPasskeyTransport(clientKey: CLIENT_KEY)

          let credential =
              try await toWebAuthnCredential(
                  transport: transport,
                  userName: "MyExampleName", // userName
                  mode: WebAuthnMode.register // or WebAuthnMode.login
              )

          // 2. Create a WebAuthn owner account from the credential
          let webAuthnAccount = toWebAuthnAccount(
              credential
          )
  ```

  ```java Android SDK theme={null}
  val CLIENT_KEY = "xxxxxxx:xxxxx"

  CoroutineScope(Dispatchers.IO).launch {
      try {
          // 1. Register or login with a passkey and
          //    Create a Passkey Transport from client key
          val transport = toPasskeyTransport(context, CLIENT_KEY, clientUrlWithoutChain)

          val credential = toWebAuthnCredential(
              context,
              transport,
              "MyExampleName", // userName
              WebAuthnMode.Register // or WebAuthnMode.Login
          )

          // 2. Create a WebAuthn owner account from the credential
          val webAuthnAccount = toWebAuthnAccount(
              credential,
          )
  ```

  ```java Android SDK (Java) theme={null}
  final String CLIENT_KEY = "xxxxxxx:xxxxx";
  try {
      // 1. Register or login with a passkey and
      //    Create a Passkey Transport from client key
      HttpTransport transport = toPasskeyTransport(
          context,
          CLIENT_KEY,
          clientUrlWithoutChain
      );
      CompletableFuture<WebAuthnCredential> suspendResult = new CompletableFuture<>();
      toWebAuthnCredential(
          context,
          transport,
          "MyExampleName",
          WebAuthnMode.Register, // or WebAuthnMode.Login
          new CustomContinuation<>(suspendResult) // see CustomContinuation in "Creating a Custom Continuation" from Android SDK
      );
      WebAuthnCredential credential = suspendResult.join();
      // 2. Create a WebAuthn owner account from the credential
      WebAuthnAccount webAuthnAccount = toWebAuthnAccount(credential);
  ```
</CodeGroup>

### 2. Create and Set Up a Client

Create a client to access the desired blockchain network. The sample below
demonstrates using the `polygonAmoy` chain.

<CodeGroup>
  ```javascript WebSDK theme={null}
  import { toModularTransport } from "@circle-fin/modular-wallets-core";
  import { createPublicClient } from "viem";
  import { polygonAmoy } from "viem/chains";

  // 2. Create modular transport for given chain from client url and client key
  const modularTransport = toModularTransport(
    clientUrl + "/polygonAmoy",
    clientKey,
  );

  // 3. Create client to connect to specified blockchain const client =
  createPublicClient({ chain: polygonAmoy, transport: modularTransport });
  ```

  ```swift iOS SDK theme={null}
          // 3. Create modular transport for given chain from client key and client url
          let modularTransport = toModularTransport(
              clientKey: CLIENT_KEY,
              url: clientUrl
          )
  ```

  ```java Android SDK theme={null}
          // 3. Create modular transport for given chain from client url and client key
          val modularTransport = toModularTransport(
              context,
              CLIENT_KEY,
              clientUrl
          )
  ```

  ```java Android SDK (Java) theme={null}
          // 3. Create modular transport from chain and client key
          Transport modularTransport = toModularTransport(
              context,
              CLIENT_KEY,
              clientUrl
          );
  ```
</CodeGroup>

<Note>
  **Note:**

  When invoking `toModularTransport()`, you must specify the **blockchain
  network**. Supported networks include:

  | Mainnets    | Testnets          |
  | ----------- | ----------------- |
  | `arbitrum`  | `arbitrumSepolia` |
  | `-`         | `arcTestnet`      |
  | `avalanche` | `avalancheFuji`   |
  | `base`      | `baseSepolia`     |
  | `monad`     | `monadTestnet`    |
  | `optimism`  | `optimismSepolia` |
  | `polygon`   | `polygonAmoy`     |
  | `unichain`  | `unichainSepolia` |
</Note>

### 3. Create a Circle Smart Account with Passkey

Create a Circle Smart Account using the transport client and the owner's
credentials. Then, create a bundler client to send user operations for the
specified blockchain. The example below uses the `polygonAmoy` chain.

<CodeGroup>
  ```javascript Web SDK theme={null}
  import { toCircleSmartAccount } from "@circle-fin/modular-wallets-core";
  import {
    createBundlerClient,
    toWebAuthnAccount,
  } from "viem/account-abstraction";

  // 4. create a circle smart account
  const smartAccount = await toCircleSmartAccount({
    client,
    owner: toWebAuthnAccount({ credential }),
  });

  // 5. create a bundler client
  const bundlerClient = createBundlerClient({
    smartAccount,
    chain: polygonAmoy,
    transport: modularTransport,
  });
  ```

  ```swift iOS SDK theme={null}
          // 4. Create a bundler client
          let bundlerClient = BundlerClient(
              chain: PolygonAmoy,
              transport: modularTransport
          )

          // 5. Create smart account (CircleSmartAccount)
          //    and set the WebAuthn account as the owner
          let smartAccount =
              try await toCircleSmartAccount(
                  client: bundlerClient,
                  owner: webAuthnAccount
              )
  ```

  ```javascript Android SDK theme={null}
          // 4. Create a bundler client
          val bundlerClient = BundlerClient(
              PolygonAmoy,
              modularTransport,
          )

          // 5. Create smart account (CircleSmartAccount)
          //    and set the WebAuthn account as the owner
          val smartAccount = toCircleSmartAccount(
              bundlerClient,
              webAuthnAccount,
          )
  ```

  ```java Android SDK (Java) theme={null}
          // 4. Create a bundler client
          BundlerClient bundlerClient = new BundlerClient(PolygonAmoy.INSTANCE, modularTransport);

          // 5. Create smart account (CircleSmartAccount) and set the WebAuthn account as the owner
          CompletableFuture<CircleSmartAccount> suspendAccount = new CompletableFuture<>();
          toCircleSmartAccount(bundlerClient, webAuthnAccount, new CustomContinuation<>(suspendAccount));
          CircleSmartAccount smartAccount = suspendSmartAccount.join();
  ```
</CodeGroup>

### 4. Send a Gasless Transaction

Encapsulate the transaction within a user operation (userOp) and send it to the
bundler. The bundler then initiates the transaction on behalf of the sender and
forwards the transaction receipt back upon request.

<Note>
  **Note:**

  On mobile platforms, **iOS** and **Android** offer at least a second option to
  send a transaction using the `encodeTransfer()` method. In the code below,
  ensure you select either **Option 1** or **Option 2** based on your
  requirements.
</Note>

<CodeGroup>
  ```javascript Web SDK theme={null}
  import { encodeTransfer } from "@circle-fin/modular-wallets-core";

  // 6. Send a user operation to the bundler.
  // // Here we send 1 USDC to a random address
  const USDC_CONTRACT_ADDRESS = "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582"; //Polygon Amoy testnet const
  USDC_DECIMALS = 6;
  const userOpHash = await bundlerClient.sendUserOperation({
    calls: [encodeTransfer(to, USDC_CONTRACT_ADDRESS, 100000n)],
    paymaster: true,
  });

  // 7. wait for transaction receipt
  const { receipt } = await bundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });
  ```

  ```swift iOS SDK theme={null}
          // (Option 1)
          // 6. Send a user operation directly to the bundler.
          //    Here we send 1 USDC to a random address.
          let USDC_CONTRACT_ADDRESS = "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582"  //Polygon Amoy testnet
          let USDC_DECIMALS: Float = pow(10, 6)
          let userOpHash = try await bundlerClient.sendUserOperation(
              account: smartAccount,
              calls: [
                  EncodeCallDataArg(
                      to: USDC_CONTRACT_ADDRESS,
                      value: BigInt(0),
                      abiJson: ERC20_ABI,
                      functionName: "transfer",
                      args: [
                          "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",  //recipient address
                          BigInt(1 * USDC_DECIMALS)  //transfer amount
                      ]
                  )
              ],
              paymaster: Paymaster.True()
          )

          // 7. Wait for transaction receipt
          let receipt = try await bundlerClient.waitForUserOperationReceipt(
              userOpHash: userOpHash
          )
      }
      catch {
          print(error)
      }
  }

          // (Option 2)
          // 6. Use encodeTransfer to send a user operation to the bundler.
          //    Here we send 1 USDC to a random address.
          let result = Utils.encodeTransfer(
              to: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",  //receiver address,
              token: PolygonAmoyToken.USDC.name,
              amount: BigInt(1 * USDC_DECIMALS)  //transfer amount
          )
          let userOpHash = try await bundlerClient.sendUserOperation(
              account: smartAccount,
              calls: [
                  EncodeCallDataArg(
                      to: result.to,
                      value: BigInt(0),
                      data: result.data
                  )
              ],
              paymaster: Paymaster.True()
          )

          // 7. Wait for transaction receipt
          let receipt = try await bundlerClient.waitForUserOperationReceipt(
              userOpHash: userOpHash
          )
      }
      catch {
          print(error)
      }
  }
  ```

  ```java Android SDK theme={null}
          // (Option 1)
          // 6. Send a user operation to the bundler.
          //    Here we send 1 USDC to a random address.
          val USDC_CONTRACT_ADDRESS = "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582"  //Polygon Amoy testnet
          val USDC_DECIMALS = 6
          val userOpHash = bundlerClient.sendUserOperation(
              context,
              smartAccount,
              arrayOf(
                  EncodeCallDataArg(
                      to = USDC_CONTRACT_ADDRESS,
                      value = BigInteger("0"),
                      functionName = "transfer",
                      abiJson = ABI_ERC20,
                      args = arrayOf(
                          "0x0000000071727De22E5E9d8BAf0edAc6f37da032",  //recipient address
                          parseUnits("1", USDC_DECIMALS)  //transfer amount
                      )
                  ),
                  paymaster = Paymaster.True()
              )
          )

          // 7. wait for transaction receipt
          val receipt = bundlerClient.waitForUserOperationReceipt(userOpHash)
      }
      catch (e: Exception) {
          e.printStackTrace()
      }
  }

          // (Option 2)
          // 6. Use encodeTransfer to send a user operation to the bundler.
          //    Here we send 1 USDC to a random address.
          val result = encodeTransfer(
              "0x0000000071727De22E5E9d8BAf0edAc6f37da032",  //receiver address
              Token.PolygonAmoy_USDC.name,
              parseUnits("1", USDC_DECIMALS)  //transfer amount
          )
          val userOpHash = bundlerClient.sendUserOperation(
              context,
              smartAccount,
              calls = arrayOf(
                  EncodeCallDataArg(
                      to = result.to,
                      value = BigInteger.ZERO,
                      data = result.data
                  )
              ),
              paymaster = Paymaster.True()
          )

          // 7. wait for transaction receipt
          val receipt = bundlerClient.waitForUserOperationReceipt(userOpHash)
      }
      catch (e: Exception) {
          e.printStackTrace()
      }
  }
  ```

  ```java Android SDK (Java) theme={null}
          // (Option 1)
          // 6. Send a user operation to the bundler.
          //    Here we send 1 USDC to a random address.
          String USDC_CONTRACT_ADDRESS = "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582";
          EncodeCallDataArg usdcTransfer = new EncodeCallDataArg(
              USDC_CONTRACT_ADDRESS, // to
              BigInteger.valueOf(0), // value
              null, // data
              AbiConstantsKt.getABI_ERC20(), // abiJson
              new Object[]{
                  "0x0000000071727De22E5E9d8BAf0edAc6f37da032", // receiver addres
                  parseUnits("1", 6) // transfer amount
              },
              "transfer" // functionName
          );
          UserOperationV07 partialUserOp = new UserOperationV07();
          CompletableFuture<String> suspendUserOpHash = new CompletableFuture<>();
          bundlerClient.sendUserOperation(
              context,
              smartAccount,
              new EncodeCallDataArg[] {
                  usdcTransfer
              },
              partialUserOp,
              new Paymaster.True(),
              new CustomContinuation<>(suspendUserOpHash)
          );
          String userOpHash = suspendUserOpHash.join();
          // 7. wait for transaction receipt
          CompletableFuture<UserOperationReceipt> suspendReceipt = new CompletableFuture<>();
          bundlerClient.waitForUserOperationReceipt(userOpHash, new CustomContinuation<>(suspendReceipt));
          UserOperationReceipt receipt = suspendReceipt.join();
      }
      catch (Exception e) {
          e.printStackTrace()
      }
  }

          // (Option 2)
          // 6. Use encodeTransfer to send a user operation to the bundler.
          //    Here we send 1 USDC to a random address.
          EncodeTransferResult result = encodeTransfer(
              "0x0000000071727De22E5E9d8BAf0edAc6f37da032", //receiver address
              Token.PolygonAmoy_USDC.name(),
              parseUnits("1", 6) //transfer amount
          );
          CompletableFuture<String> suspendUserOpHash = new CompletableFuture<>();
          bundlerClient.sendUserOperation(
              context,
              smartAccount,
              new EncodeCallDataArg[]{
                  new EncodeCallDataArg(result.getTo(), BigInteger.ZERO, result.getData())
              },  // calls
              new UserOperationV07(),
              new Paymaster.True(),
              new CustomContinuation<>(suspendUserOpHash)
          );
          String userOpHash = suspendUserOpHash.join();
          // 7. wait for transaction receipt
          CompletableFuture<UserOperationReceipt> suspendReceipt = new CompletableFuture<>();
          bundlerClient.waitForUserOperationReceipt(userOpHash, new CustomContinuation<>(suspendReceipt));
          UserOperationReceipt receipt = suspendReceipt.join();
      }
      catch (Exception e) {
          e.printStackTrace()
      }
  }
  ```
</CodeGroup>

## Summary

In this Quickstart, you were able to:

* Set up the Modular Wallet SDK.
* Create a Circle Smart Account with Passkey.
* Send a gasless transaction using the bundler.

You can use these foundational steps to integrate modular wallets into your
application and explore its full suite of capabilities.
