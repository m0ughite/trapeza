# Trapeza Dashboard — Product Tour

Plain-language, click-by-click guide for non-technical users. No code, no jargon.

## What Trapeza does (one sentence)

You describe a job made of steps, Trapeza picks the best AI agent for each step based on how well they have *actually* performed before (not what they claim), checks the whole plan is affordable and on time, then pays each agent tiny amounts of digital dollars (USDC) only for work that passed.

## A few words you will see

- **Agent** — an automated online worker that does one kind of task for a small fee.
- **Job / workflow** — a task made of several connected steps.
- **Clearing** — Trapeza's decision of which agent does which step, and the total price.
- **USDC** — a digital dollar (1 USDC = 1 US dollar). Here, payments are fractions of a cent.
- **Simulated** — a safe pretend action. No real money moves.

## Part A — Open the app

- **If someone gave you a web link:**
  1. Click the link (or paste it into Chrome, Safari, or Edge).
  2. Wait a few seconds for the page to load. Done — skip to Part B.
- **If you were asked to open it on your own computer:**
  1. Ask whoever set it up for the "dashboard link" — that is the easiest path.
  2. If there is no link, you cannot start it without a technical person; share this tutorial with them and they will provide a link.
- You do **not** need to install anything, create an account, sign in, or connect a crypto wallet.

## Part B — Take the guided tour (use the menu on the left)

The left side has a numbered menu. Go top to bottom. Clicking a menu item scrolls you to that part.

1. **Step 1 — Open "Scenarios" (top of the menu).**
   - You will see cards, each a ready-made example job (for example "Invoice workflow").
   - Click one card. Everything else on the page now reflects that job.
2. **Step 2 — Click "Agents".**
   - Scroll the list of available AI agents.
   - On each card, look at the two numbers: what the agent **claims** it can do vs. what it has **actually delivered** before.
   - Green **"workhorse"** = reliable. Red **"braggart"** = overpromises. This is the whole point: reputation is earned, not advertised.
3. **Step 3 — Click "Clearing".**
   - You will see the job drawn as boxes connected by arrows (the steps).
   - Each box shows which agent was chosen for that step and the price.
4. **Step 4 — Click "Run trace".**
   - Press the **play** button (or the **step** arrow) to watch Trapeza make its decision one move at a time. The active step lights up in the diagram.
5. **Step 5 — Click "Clearing vs. Greedy".**
   - This shows why simply picking the cheapest agent each time (the "greedy" way) can run out of money or miss the deadline, while Trapeza's whole-plan way stays safe.
6. **Step 6 — (Optional) Click "Calibration Ledger", "Bottlenecks", "Risk Preflight".**
   - These are deeper views. Calibration = each agent's track record. Bottlenecks = the step that limits everything. Risk = a pretend "dry run" that stress-tests the plan before any money moves. You can skip these on a first pass.
7. **Step 7 — Click "Settlement".**
   - This is the payment step. Each agent is paid in USDC only after its work is accepted; rejected work is refunded to you.
   - In demo mode every payment is marked **"simulated"** (see "How to read a receipt" below).

## Part C — Try it yourself ("Run Your Own")

1. **Step 1** — In the left menu, click **"Run Your Own"** (bottom).
2. **Step 2** — In the **base workflow** dropdown, choose any project.
3. **Step 3** — Drag the **budget** slider to set how much you are willing to spend.
4. **Step 4** — Drag the **risk** slider to set how cautious you want to be.
5. **Step 5** — Find the **calibration** switch. Turn it **OFF**, then **ON**, and watch the chosen agents change:
   - OFF = flashy "braggart" agents win and the plan gets worse.
   - ON = proven "workhorse" agents win.
6. **Step 6** — Click the **"Run a clearing"** button. Wait a moment; the new plan appears.
7. **Step 7** — Click **"Settle via ArcTask (simulated)"**. Watch the payment flow appear in order:
   - **Funded** (money set aside) → **Submitted** (agent hands in the work) → **Accepted** (agent paid) or **Rejected** (you are refunded).
8. Everything here is labeled **simulated** — nothing real is spent.

## How to read a receipt (the honesty rule)

- A **blue, clickable link** = a real payment recorded on the public blockchain. You can click it to verify.
- An **amber tag** that says **"simulated"** or **"batch ID · not a transaction"** = not a real clickable payment; it is a demo placeholder or an internal identifier. Trapeza never disguises these as real payments.

## Frequently asked questions

- *Do I need a crypto wallet?* No. Not for the demo.
- *Will this spend real money?* No — unless an operator has explicitly switched on live mode. By default everything is simulated.
- *I clicked something and nothing happened.* Scroll up/down to the right section, or refresh the page and start again from Part A.
- *Can I break anything?* No. You can click freely; it is a safe demo.
- *Who chooses which agent gets the work?* Trapeza does, automatically, based on each agent's real past performance and your budget/deadline/risk settings.
