# Week 4 Assignment — Documentation Pack: Money Transfer Feature

**Course:** Software Testing and Debugging · KBTU 2026
**Author:** Alima Makhymetova
**Feature under test:** Transfers → Between my accounts (mobile app)

> **Requirements used.** Source: the Week 3 practice brief:
> - whole tenge only; amount 100 – 500,000 KZT per transfer (**REQ-3.1**)
> - daily limit 1,000,000 KZT across all transfers, reset at midnight Almaty time (**REQ-3.2**)
> - transfers above 100,000 KZT require a 6-digit SMS code, valid 120 s, three wrong attempts cancel the transfer (**REQ-3.3**)
> - if the amount and the daily limit are both violated, the amount error is shown
> - **REQ-3.4** — insufficient balance (named in the Week 4 traceability example; the brief gives no outcome for it)
>
> The brief does not number requirements; the numbering follows the Week 4 deck. Points the brief does not settle are marked **[ASSUMPTION]**.

---

## 1. Test Plan (section)

### 1.1 Scope

**In scope**
- Own-account transfers: source account → own deposit account (e.g. the deposit ending 4417).
- Amount validation (REQ-3.1): range, whole tenge, type, empty.
- Approval rules (REQ-3.1 to REQ-3.3): amount × daily total × SMS threshold.
- SMS code lifecycle: attempts, expiry, cancellation.
- Balance, statement and daily-total correctness after success, rejection and cancellation.

**Out of scope (explicitly)**
- Transfers to other customers or other banks; foreign currency; scheduled or recurring transfers.
- Android and web clients (this plan covers iOS only).
- Performance and load testing; security testing of the SMS gateway.
- Concurrent transfers by the same customer (an open question, see section 3).

### 1.2 Approach

| Level / type | Technique | Automation |
|---|---|---|
| System, functional | Equivalence partitions + boundary values on the amount (Task A) | Manual now; candidates for week 5 |
| System, functional | Decision table: amount range × daily total × SMS threshold, collapsed to 4 tests (Task B) | Manual now |
| System, functional | State transition: SMS code, valid-transitions coverage (Task C) | Manual now |
| Regression before release | Release checklist (section 4) | Manual |
| Defect management | Severity set by the tester, priority by the product owner | Tracker |

### 1.3 Environment and data

- Test environment 2, iOS 18.2, app 4.11.0 (build 2291).
- Test customer **TC-014**: balance 1,000,000 KZT. The daily total is reset to the value given in each test case before the test (via the test admin view). **[ASSUMPTION]**
- SMS codes are read from the test SMS gateway log. **[ASSUMPTION]**
- Each test starts from freshly reset data, so no test depends on another.

### 1.4 Top three product risks

| # | Risk | Why it matters | Covered by |
|---|---|---|---|
| R1 | **Daily limit miscalculated** (this transfer not included in the total, or wrong boundary) | Direct money and regulatory exposure | TC-APRT-2, TC-APRT-4 |
| R2 | **SMS confirmation weak or bypassed** (code not requested above 100,000, expired code or a 4th attempt accepted) | Fraud exposure on exactly the transfers the code protects | TC-AMT-03, TC-APRT-3, TC-SMS-04, 05, 06 |
| R3 | **Double debit** (Confirm tapped twice, request retried) | Customer charged twice; hardest to undo | Release checklist; DEF-202 |

Project risk: test data and SMS-gateway access. If the daily total cannot be set to 100,000 or 990,000 per test, TC-APRT-2, 3, 4 are blocked.

### 1.5 Entry criteria

1. Build 2291 (or later) is deployed to test environment 2.
2. Smoke test passes: log in as TC-014, open Transfers → Between my accounts, reach the amount screen.
3. TC-014 is loaded with balance 1,000,000 and the daily total can be set per test.
4. The tester can read the SMS gateway log.
5. Acceptance criteria exist for REQ-3.1 to REQ-3.3 (REQ-3.4 may be pending, see exit criterion 6).

### 1.6 Exit criteria

1. All 12 planned test cases (section 2) are executed; none is "not run".
2. Zero open defects with severity critical or high.
3. REQ-3.1, REQ-3.2 and REQ-3.3 each have at least one passed test case and no failed one.
4. The boundary values 99, 100, 500,000 and 500,001 have each been executed once and passed.
5. All 11 release-checklist items (section 4) are ticked on the release candidate build, including the 100,000 / 100,001 SMS-threshold item.
6. REQ-3.4 and each open gap in section 3 either has an agreed expected outcome and a passed test, **or** is listed as residual risk.
7. A test completion report lists the residual risks.

If any criterion is not met, the report names it and the risk it leaves. Release is allowed only with a written acceptance by the product owner, in the form: *"Shipped with [N open defects / unmet criterion X], accepted by [name] on [date]."*

---

## 2. Test Cases (12)

All 12 come from my Week 3 sheets (IDs kept in the "Week 3 source" line): five from Task A (amount), four from Task B (approval), three from Task C (SMS code). In every case, steps 1–2 are the same navigation: **1.** Open Transfers → Between my accounts. **2.** Select the deposit ending 4417 as recipient. In this document each case has full preconditions, concrete data and a checkable result; a Week 3 sheet had only short entries.

### TC-AMT-01 · Minimum amount is accepted, no SMS code
- **Week 3 source:** Task A, minimum boundary 100
- **Traces to:** REQ-3.1 (primary), REQ-3.3 (no code at or below 100,000)
- **Technique:** boundary value
- **Preconditions:** TC-014 logged in, balance 1,000,000 KZT, daily total 0
- **Steps:** 1–2 as above; 3. Enter 100; 4. Tap Continue
- **Expected:** transfer completes with a success screen; no SMS code screen; balance 999,900; statement shows one entry of 100 KZT; daily total 100

### TC-AMT-02 · Amount below the minimum is rejected
- **Week 3 source:** Task A, 99
- **Traces to:** REQ-3.1
- **Technique:** boundary value
- **Preconditions:** TC-014 logged in, balance 1,000,000, daily total 0
- **Steps:** 1–2 as above; 3. Enter 99; 4. Tap Continue
- **Expected:** transfer is rejected with an error that the amount is below the minimum of 100 KZT; no SMS code screen; balance 1,000,000; no statement entry

### TC-AMT-03 · Maximum amount is accepted with an SMS code
- **Week 3 source:** Task A, 500,000
- **Traces to:** REQ-3.1 (primary), REQ-3.3 (500,000 is above 100,000)
- **Technique:** boundary value
- **Preconditions:** TC-014 logged in, balance 1,000,000, daily total 0
- **Steps:** 1–2 as above; 3. Enter 500,000; 4. Tap Continue; 5. Read the 6-digit code from the SMS gateway log; 6. Enter it and tap Confirm
- **Expected:** SMS code screen appears after step 4; after step 6 a success screen; balance 500,000; one statement entry of 500,000; daily total 500,000
- **Note:** the Week 3 sheet said only "Transfer executes". Since 500,000 is above 100,000, the code step is added here.

### TC-AMT-04 · Amount above the maximum is rejected
- **Week 3 source:** Task A, 500,001
- **Traces to:** REQ-3.1
- **Technique:** boundary value
- **Preconditions:** TC-014 logged in, balance 1,000,000, daily total 0
- **Steps:** 1–2 as above; 3. Enter 500,001; 4. Tap Continue
- **Expected:** transfer is rejected with an error that the amount is above the maximum of 500,000 KZT; no SMS code screen; balance 1,000,000; no statement entry

### TC-AMT-05 · Amount with a decimal part is rejected
- **Week 3 source:** Task A, non-integer partition (100,000.50)
- **Traces to:** REQ-3.1 (whole tenge only)
- **Technique:** equivalence partition (invalid, not on the number line)
- **Preconditions:** TC-014 logged in, balance 1,000,000, daily total 0
- **Steps:** 1–2 as above; 3. Enter 100,000.50; 4. Tap Continue
- **Expected:** transfer is rejected with an error that only whole tenge is accepted; no SMS code screen; balance 1,000,000; no statement entry

### TC-APRT-1 · Amount outside limits is rejected (decision table R5–R8)
- **Week 3 source:** Task B, T1: C1 = N
- **Traces to:** REQ-3.1
- **Technique:** decision table (collapsed column R5–R8, amount error wins)
- **Preconditions:** TC-014 logged in, balance 1,000,000, daily total 0
- **Steps:** 1–2 as above; 3. Enter 50; 4. Tap Continue
- **Expected:** error "amount out of limits"; no SMS code screen; balance 1,000,000; no statement entry

### TC-APRT-2 · Daily limit would be exceeded (decision table R3–R4)
- **Week 3 source:** Task B, T2: C1 = Y, C2 = N (daily total 990,000 → 1,040,000)
- **Traces to:** REQ-3.2
- **Technique:** decision table
- **Preconditions:** TC-014 logged in, balance 1,000,000, daily total set to 990,000
- **Steps:** 1–2 as above; 3. Enter 50,000; 4. Tap Continue
- **Expected:** error "daily limit exceeded" (990,000 + 50,000 = 1,040,000 > 1,000,000); no SMS code screen (50,000 is below the SMS threshold anyway); balance 1,000,000; daily total 990,000; no statement entry

### TC-APRT-3 · Large amount within the limit asks for an SMS code (decision table R1)
- **Week 3 source:** Task B, T3: C1 = Y, C2 = Y, C3 = Y (daily total 100,000 → 300,000)
- **Traces to:** REQ-3.3 (primary), REQ-3.1, REQ-3.2
- **Technique:** decision table
- **Preconditions:** TC-014 logged in, balance 1,000,000, daily total set to 100,000
- **Steps:** 1–2 as above; 3. Enter 200,000; 4. Tap Continue
- **Expected:** SMS code screen appears; nothing is debited yet: balance 1,000,000, daily total 100,000, no statement entry
- **Postcondition:** transfer pending confirmation (stop here; do not enter a code)

### TC-APRT-4 · Small amount within the limit executes immediately (decision table R2)
- **Week 3 source:** Task B, T4: C1 = Y, C2 = Y, C3 = N (daily total 100,000 → 105,000)
- **Traces to:** REQ-3.3 (no code at or below 100,000), REQ-3.1, REQ-3.2
- **Technique:** decision table
- **Preconditions:** TC-014 logged in, balance 1,000,000, daily total set to 100,000
- **Steps:** 1–2 as above; 3. Enter 5,000; 4. Tap Continue
- **Expected:** transfer completes with a success screen; no SMS code screen; balance 995,000; one statement entry of 5,000; daily total 105,000

### TC-SMS-04 · Two wrong codes, then the correct code, confirms the transfer
- **Week 3 source:** Task C, Waiting·3 → Confirmed
- **Traces to:** REQ-3.3
- **Technique:** state transition (valid transitions)
- **Preconditions:** TC-014 logged in, balance 1,000,000, daily total 0
- **Steps:** 1–2 as above; 3. Enter 150,000; 4. Tap Continue; 5. Enter a wrong 6-digit code (any code that differs from the issued one) and tap Confirm; 6. Repeat step 5 once more; 7. Read the issued code from the gateway log, enter it, tap Confirm
- **Expected:** after steps 5 and 6 an error appears and the SMS code screen stays open; balance 1,000,000; after step 7 a success screen; balance 850,000; one statement entry of 150,000; daily total 150,000

### TC-SMS-05 · Three wrong codes cancel the transfer
- **Week 3 source:** Task C, Waiting·3 → Blocked
- **Traces to:** REQ-3.3
- **Technique:** state transition (valid transitions)
- **Preconditions:** TC-014 logged in, balance 1,000,000, daily total 0
- **Steps:** 1–2 as above; 3. Enter 150,000; 4. Tap Continue; 5. Enter a wrong 6-digit code and tap Confirm; 6. Repeat step 5 twice more (three wrong codes in total)
- **Expected:** after the third wrong code the transfer is cancelled with a visible message; balance 1,000,000; no statement entry; daily total 0

### TC-SMS-06 · No code within 120 seconds expires the transfer
- **Week 3 source:** Task C, Waiting·1 → Expired
- **Traces to:** REQ-3.3
- **Technique:** state transition (valid transitions)
- **Preconditions:** TC-014 logged in, balance 1,000,000, daily total 0
- **Steps:** 1–2 as above; 3. Enter 150,000; 4. Tap Continue; 5. Do not enter a code; wait 121 seconds on the SMS code screen
- **Expected:** the screen shows that the code has expired and the transfer is cancelled; balance 1,000,000; no statement entry; daily total 0

*Week 3 cases not used among the 12:* TC-AMT-06 (non-numeric "xyz"), TC-SMS-01, 02, 03, 07.

---

## 3. Traceability Matrix

| Requirement | Test cases | Technique | Status |
|---|---|---|---|
| REQ-3.1 Amount 100 – 500,000, whole tenge | TC-AMT-01…05, TC-APRT-1 | Partitions + boundary values | 6 of 6 not run |
| REQ-3.2 Daily limit 1,000,000 | TC-APRT-2 (also TC-APRT-3, 4) | Decision table | 1 of 1 not run |
| REQ-3.3 SMS code above 100,000 | TC-AMT-03, TC-APRT-3, 4, TC-SMS-04, 05, 06 | Decision table + state transition | 6 of 6 not run |
| REQ-3.4 Insufficient balance | — | — | **NOT COVERED** |

"Not run" is stated on purpose: this pack documents the design. No result is claimed that was not observed.

**Why REQ-3.4 is not covered**
1. The brief never mentions insufficient balance, so no expected result can be written (see DEF-203).
2. My Week 3 decision table had no balance condition, so no case was derived from it.
3. A draft case is ready once the outcome is agreed: balance 50,000, amount 60,000, expected result per the agreed rule.

**Gaps in the 12 cases**
- **The SMS threshold itself (100,000 / 100,001) has no boundary test.** The brief ties behaviour to that number. TC-AMT-01 and TC-APRT-4 cover the "no code" side far from the border, TC-AMT-03 and TC-APRT-3 the "code" side far from the border. The border is covered only by the release checklist.
- Non-numeric and empty amount are invalid partitions of REQ-3.1 (Week 3: TC-AMT-06 and the "empty" class); not among the 12.
- Daily total reset at midnight Almaty time: no case derived for 23:59:59 / 00:00:00.
- Whether rounding to whole tenge can hide a boundary.

**Open questions for the analyst (found in Week 3 and from the brief)**
1. Is a daily total of exactly 1,000,000 within the limit or already over it?
2. How are two simultaneous transfers handled for the daily limit?
3. Does a cancelled or expired transfer count towards the daily limit?
4. Can the customer request a new SMS code, and does it reset the three attempts?
5. A transfer submitted at 23:59:50 whose code is confirmed after midnight: which day's total does it count to?
6. State table: what happens in Confirmed, Expired and Blocked on a correct code, a wrong code, or 120 s passing? Three of these cells are the most dangerous cases (double confirm, late code, timer after confirmation).

---

## 4. Release Checklist — SMS Code Flow

Run on the release candidate build, test environment 2, customer TC-014.

- [ ] 100,000 completes without a code; 100,001 asks for a 6-digit code
- [ ] Code is accepted within 120 seconds
- [ ] Code entered after 120 seconds is rejected
- [ ] Second wrong code leaves the screen open; third wrong code cancels the transfer
- [ ] After cancellation, the correct code is not accepted
- [ ] Confirm tapped twice debits once
- [ ] Correct code entered after expiry does not execute the transfer
- [ ] Waiting more than 120 seconds after a confirmed transfer does not cancel or reverse it
- [ ] Balance is unchanged after a cancelled or expired transfer
- [ ] Daily total updates only after confirmation
- [ ] Daily total resets at 00:00 Almaty time (check 23:59:59 and 00:00:00)

---

## 5. Defect Reports (3)

> **These three reports are mocked.** The brief allows this, and no app build was available. Environment, reproducibility and observed results are **illustrative values**, written to show a complete report. They are not observations from a real run. A mocked report must not be filed in a real tracker.

### DEF-201 · Transfers: transfer accepted when it raises the daily total above 1,000,000 KZT

| Field | Content |
|---|---|
| **Title** | Transfers: transfer accepted when it raises the daily total above 1,000,000 KZT |
| **Environment** | iOS 18.2, app 4.11.0 build 2291, test env 2 *(mock)* |
| **Preconditions** | Test customer TC-014, balance 1,000,000 KZT, daily total set to 990,000 KZT |
| **Steps to reproduce** | 1. Open Transfers → Between my accounts<br>2. Select the deposit ending 4417<br>3. Enter 50,000 and tap Continue |
| **Expected result** | Error "daily limit exceeded" (990,000 + 50,000 = 1,040,000 > 1,000,000); balance stays 1,000,000 (REQ-3.2) |
| **Actual result** | Success screen; balance 950,000; daily total 1,040,000 *(mock)* |
| **Reproducibility** | 5 of 5 attempts *(mock)* |
| **Severity / priority** | Severity: high (the limit is a financial control) · Priority: high (proposal) |
| **Evidence** | Screen recording of steps 1–3; request ID of the transfer call *(to attach)* |
| **Traces to** | REQ-3.2 / TC-APRT-2 |

### DEF-202 · Transfers: account debited twice when Confirm is tapped twice on the SMS code screen

| Field | Content |
|---|---|
| **Title** | Transfers: account debited twice when Confirm is tapped twice quickly on the SMS code screen |
| **Environment** | iOS 18.2, app 4.11.0 build 2291, test env 2 *(mock)* |
| **Preconditions** | Test customer TC-014, balance 1,000,000 KZT, daily total 0 |
| **Steps to reproduce** | 1. Open Transfers → Between my accounts<br>2. Select the deposit ending 4417<br>3. Enter 150,000 and tap Continue<br>4. Enter the 6-digit code from the SMS gateway log<br>5. Tap Confirm twice within one second |
| **Expected result** | One transfer of 150,000; balance 850,000; one statement entry; daily total 150,000 |
| **Actual result** | Two statement entries of 150,000; balance 700,000; daily total 300,000 *(mock)* |
| **Reproducibility** | 3 of 5 attempts; intermittent, depends on tap timing *(mock)* |
| **Severity / priority** | Severity: high (customer is charged twice) · Priority: high (proposal) |
| **Evidence** | Screen recording at 60 fps showing both taps; two statement entries; request IDs of both confirm calls *(to attach)* |
| **Traces to** | Product risk R3; state table cell Confirmed + correct code; checklist item "Confirm tapped twice debits once" |

### DEF-203 · Requirements: REQ-3.4 names "insufficient balance" but defines no outcome

*Written from a lack of requirements. This is a specification defect, so the steps are document steps, not app steps.*

| Field | Content |
|---|---|
| **Title** | REQ-3.4: expected behaviour for amount greater than balance is not specified |
| **Environment** | Week 3 practice brief for the money transfer feature; no app build involved |
| **Preconditions** | Brief available; a customer with balance 50,000 KZT defined for the case |
| **Steps to reproduce** | 1. Open the brief and look for any rule about insufficient balance<br>2. Take the case: balance 50,000, amount 60,000 (valid under REQ-3.1, below the SMS threshold, above the balance)<br>3. Try to write the expected result of that test from the brief alone |
| **Expected result** | The brief defines: whether Continue is blocked, the error text, whether an SMS code is requested for amounts above 100,000, and whether the balance check comes before or after the daily-limit check |
| **Actual result** | The brief does not mention balance. None of the four outcomes is defined, so the expected result cannot be written and no test case could be derived |
| **Reproducibility** | 100%: the text is the same on every reading |
| **Severity / priority** | Severity: medium (a core rule is untestable) · Priority: medium (proposal; to be settled before the release exit decision) |
| **Evidence** | The brief text; the traceability matrix row marked NOT COVERED |
| **Traces to** | REQ-3.4; traceability matrix, row 4 |

---

## 6. AI Appendix (Level 1)

**Tool:** Claude (Anthropic), used to assist in structuring the documentation pack, converting raw test cases into standardized IEEE 29119-3 test specifications, and drafting defect reports.

**Prompts used (verbatim):**
1. "Act as a Senior QA Lead. I am preparing the Week 4 Documentation Pack for an iOS money transfer feature based on our course requirements. Review the attached lecture deck Week_4_Masters_ST.pptx and generate a structured Markdown outline covering: 1) Test Plan Section (Scope, Approach, Top 3 Product Risks, Entry/Exit criteria), 2) Traceability Matrix structure, and 3) SMS Code Release Checklist. Apply ISO/IEC/IEEE 29119-3 terminology. Do not invent project specifics beyond the provided deck."
2. "Act as an Expert Test Engineer. I am attaching my Week 3 test design homework (HW1_by_Makhymetova_Alima-2.pdf). Convert my original test cases (Task A: Amount, Task B: Approval Rules, Task C: SMS Code) into 12 concrete, runnable test cases following IEEE 29119-3 standards. Requirements for each test case: 1) Keep my exact IDs and inputs, 2) Define explicit preconditions (customer TC-014, initial balance 1,000,000 KZT, starting daily total), 3) State precise, checkable postconditions (sender balance, receiver deposit balance, statement entry, updated daily total), and 4) Trace directly to REQ-3.1–REQ-3.3. Flag any requirement gaps as NOT COVERED."
3. Act as a QA Analyst. Draft 3 realistic mock defect reports based on our transfer feature: 1) Functional defect: Daily limit breach permitted, 2) Technical/Race condition defect: Double-debit on rapid double-tap of the Confirm button, and 3) Specification defect: Missing handling rule for REQ-3.4 (Insufficient Balance).

**Raw output:** a first draft built only from the two decks. It contained 12 test cases the model had invented from the deck's running example (IDs TR-AMT-001…, TR-DAY-…, TR-OTP-…), customers TC-021/022/023/031, and a checklist using the deck's own example items.

**What changed after I supplied my own Week 3 work:**

| Item | First draft | Final version | Reason |
|---|---|---|---|
| Test cases | 12 invented cases (TR-AMT, TR-DAY, TR-OTP) | 12 of my own Week 3 cases (TC-AMT, TC-APRT, TC-SMS), IDs kept | The assignment asks for cases from my Week 3 design work |
| Test data | Invented daily totals and customers | One customer TC-014; daily total set per case from my Task B examples | My Task B arrows ("990,000 to 1,040,000") mean total before → total after |
| TC-AMT-03 | Not applicable | SMS code step added | 500,000 is above 100,000, so a code is required; my Week 3 sheet omitted it |
| Traceability | Based on invented cases | Based on my cases; REQ-3.4 NOT COVERED; SMS-threshold boundary listed as a gap | Honest coverage of my own work, including the gap I found in my Week 3 comparison |
| Checklist | Deck's example items (30 s arrival, KZ/RU/EN) | Items derived from the brief and my state table (11 items) | Items must trace to the brief, not to the lecture example |
| Open questions | Few | Six, including my own Week 3 questions and the brief's planted gaps | They come from my Task B and Task C |

**Assumptions the model made that I checked against the brief or kept marked:**
1. Customer TC-014, deposit ending 4417 and the balance 1,000,000 come from the Week 4 deck examples, not from the brief.
2. Access to the SMS gateway log and the admin view for the daily total.
3. The three defect reports contain invented illustrative values (mock).

**My own corrections:**

Traceability & Gap Analysis (REQ-3.4): The initial draft generated by the AI marked REQ-3.4 (Insufficient balance) as covered. I manually updated its status to Not Covered (Gap) in the Traceability Matrix because the practice brief lacks defined requirements for handling insufficient balance, and I added a corresponding open question for the business analyst.

Release Checklist & Regional Context: I added specific regional and system edge cases to the Release Checklist, such as verifying the Asia/Almaty timezone reset at midnight (00:00:00 vs. 23:59:59) and validating SMS gateway log entries.