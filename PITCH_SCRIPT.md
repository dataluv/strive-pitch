# STRIVE Health — Investor Pitch Script

**Speaker:** Emily Chan, CEO
**Format:** Conversational script synced to interactive web demo (scrolling website)
**Duration:** ~10 minutes
**Setting:** Zoom or in-person, with screen share of demo site

---

## Pre-Meeting Setup

- Have the STRIVE demo site loaded and ready to screen share
- Position yourself so you can scroll naturally while maintaining eye contact (camera or in-person)
- Keep scrolling smooth and deliberate — let the visuals land before you talk over them

---

## HERO SECTION
**[0:00–0:45] — 45 seconds**

*Site loads on the hero screen. Pause for a beat to let the visual register.*

Thanks for making the time. Before I get into what we're building, I want to give you a quick piece of context that shapes everything about this company.

I'm a three-time sepsis survivor. The last time it happened, I was in an ICU, and the decisions being made about my treatment — the drugs, the dosing, the timing — were being made by brilliant but exhausted clinicians working off guidelines that haven't fundamentally changed in decades. And I remember thinking: there has to be a better way to do this.

So that's what STRIVE is. We build autonomous AI agents that make real-time clinical treatment decisions in critical care. Not recommendations buried in a dashboard. Actual treatment decisions — what drug, what dose, what time, for this specific patient, right now.

**[scroll to Problem section]**

---

## PROBLEM SECTION
**[0:45–1:45] — 60 seconds**

Let me frame the problem with one number: sepsis is the number one cause of death in hospitals globally. It kills more people than heart attacks, more than strokes. In the US alone, it's a $100 billion burden on the healthcare system every year.

And here's the thing that's hard to accept — a significant number of those deaths are potentially preventable. The issue isn't that we don't know how to treat sepsis. The issue is that optimal treatment requires hundreds of micro-decisions over hours and days: which fluid, how much, which vasopressor, when to titrate, when to stop. Every patient is different. Every hour the clinical picture changes.

No human can process all of that data continuously and optimally. It's not a knowledge problem — it's a computation problem. And computation problems have a solution.

**[scroll to Technology section]**

---

## TECHNOLOGY — RL vs LLM
**[1:45–3:15] — 90 seconds**

So this is the part where I need to draw a very clear line, because the market is full of noise right now.

Most companies calling themselves clinical AI agents are running LLMs. Large language models. They summarize notes, they draft letters, they help with documentation. That's useful work, but it is not what we do.

Our agent doesn't generate text. It generates treatment decisions.

*[Pause — let that land.]*

We use reinforcement learning — the same class of AI that powered AlphaGo and taught robots to walk. The way it works: our system was trained on five million hours of real ICU data from over 60,000 patients. It learned, through trial and error across that massive dataset, which sequences of treatment actions lead to the best outcomes.

Think of it this way. An LLM reads textbooks and predicts the next word. Our agent has effectively treated 60,000 patients and learned what actually works.

And this wasn't invented in a lab somewhere and handed to us. My co-founder, Matthieu Komorowski, invented the application of reinforcement learning to clinical medicine. His 2018 paper in Nature Medicine has over 1,500 citations and has been independently replicated more than 50 times. He's in the top 0.8% of cited scientists globally. This is foundational, peer-validated science.

> **[For Healthcare VCs, add:]** "Matthieu didn't just publish a paper — he created the field. Every serious academic group working on RL for clinical decisions is building on his work."

> **[For Generalist/AI VCs, add:]** "The reason this matters: in the LLM agent world, everyone has access to the same foundation models. In RL for medicine, we have the inventor, the dataset, and an eight-year head start. This isn't a wrapper — it's a moat."

**[scroll to Live ICU Demo]**

---

## LIVE ICU DEMO SIMULATION
**[3:15–4:45] — 90 seconds**

*Let the demo section load. Walk through it as it animates.*

So now let me show you what this actually looks like at the bedside.

What you're seeing here is a simulation of our system running in real time. Patient data is flowing in — vitals, labs, medications — and our agent is continuously processing that data and generating treatment recommendations.

See this here — the system is recommending a specific vasopressor dose adjustment for this patient. It's not saying "consider adjusting vasopressors." It's saying: this drug, this dose, this moment. And it's updating as new data comes in.

The clinician sees this at the bedside. They can accept or override. But the key insight — and this is from our clinical work — 97% of the time, clinicians agree with the agent's recommendation. That's not because we're forcing compliance. It's because the recommendations are genuinely good, and clinicians recognize that immediately.

This is what a real clinical AI agent looks like. Not a chatbot. Not a summarizer. A system that's doing the hardest cognitive work in medicine — sequential treatment optimization under uncertainty — better than any human can do it alone.

**[scroll to Clinical Evidence]**

---

## CLINICAL EVIDENCE
**[4:45–5:45] — 60 seconds**

Now, I know the question in your mind is: does it actually work?

*Let the stats animate on screen.*

In our clinical studies: 41% reduction in mortality. 18% shorter ICU stays. 97% clinician adoption.

We just won the Star Research Award at SCCM 2026 — that's the Society of Critical Care Medicine, the largest critical care conference in the world. That's not a startup pitch competition. That's the global medical community recognizing this work.

And here's the line I want you to remember: the people who write the global treatment guidelines for sepsis are now the people validating our tool.

> **[For Healthcare VCs, expand:]** "These aren't retrospective numbers from a controlled dataset. Our evidence includes prospective clinical data, and we're now running the world's first randomized controlled trial of actionable AI in critical care — meaning AI that doesn't just flag risk but actually directs treatment. Cleveland Clinic, Harvard, and UC Health are the trial sites. These are not institutions that put their names on things lightly."

**[scroll to Catalysts]**

---

## CATALYSTS TIMELINE
**[5:45–6:30] — 45 seconds**

*Let the timeline visual appear.*

So here's what makes the next 12 months extremely compelling.

We have a Tier 1 publication coming this summer — think New England Journal, Lancet, JAMA, that caliber. Our CE Mark is approximately three months out. FDA clearance, roughly six months. And the randomized controlled trial is already underway.

Each of these is a value inflection point. Any one of them would be significant. We have all of them converging in the same window.

I want to be direct about what that means for this conversation: this is pre-publication, pre-trial, pre-regulatory pricing. After these catalysts land, we will run a competitive process, and the terms will look very different.

**[scroll to Partnerships]**

---

## PARTNERSHIPS
**[6:30–7:15] — 45 seconds**

Let me talk about distribution, because this is where it gets very real very fast.

Philips — they own 85% of the ICU monitoring market globally. They are our distribution partner. That means our agent can be deployed through infrastructure that's already at the bedside in virtually every major hospital.

Baxter has committed a $1 million in-kind sponsorship. Mayo Clinic is a distribution partner. Cleveland Clinic and Harvard are running our trial.

We're not a startup trying to get our first meeting with a health system. We're already embedded with the institutions that define the standard of care.

> **[For Strategic/Corporate VCs, emphasize:]** "The distribution infrastructure already exists. We're not building a sales team to go door to door. We're plugging into platforms that are already in 85% of ICUs worldwide."

**[scroll to Platform Expansion]**

---

## PLATFORM EXPANSION
**[7:15–7:45] — 30 seconds**

And sepsis is just the first use case.

The platform generalizes. We're already expanding into heart failure with Harvard and Unity Health Toronto, and into diabetes management with Northwestern. Same core RL engine, new clinical domains.

Our first use case alone represents $100 million-plus in ARR potential. Every additional condition we add expands the addressable market dramatically — using the same underlying technology.

**[scroll to Team]**

---

## TEAM
**[7:45–8:30] — 45 seconds**

Let me tell you about the team, because in a company this early, the team is the thesis.

We're seven people. Four PhDs. Five MDs. Over 17,000 citations collectively. This is probably the most concentrated team in clinical AI anywhere.

Matthieu, my co-founder — I already mentioned his credentials. Inventor of RL in medicine, Nature Medicine, top 0.8% cited globally.

My background — I spent my career in healthcare investing at Goldman Sachs and Apollo, deploying over a billion dollars into the sector. I did my degrees at Cambridge and Oxford. And as I mentioned, I'm a three-time sepsis survivor. This is not abstract for me.

We are a small team that is disproportionately credentialed and deeply motivated. We move fast because we don't have layers. We execute because we've done this before.

**[scroll to Investment section]**

---

## INVESTMENT
**[8:30–9:30] — 60 seconds**

So here's the ask.

We raised $3.5 million in our pre-seed in June 2025. We have 18 months of runway. We are raising $5 to $6 million now.

I want to be clear — we are not raising out of necessity. We have runway. We are raising because we are about to enter the most critical window in this company's life — the catalysts I just walked you through — and we want to enter that window fully capitalised. Fully staffed. Fully ready to execute.

We're having a small number of conversations. This is not a broad fundraise. We're looking for partners who understand what it means to be pre-catalyst in a company with this kind of evidence base, these partnerships, and this team.

*[Pause.]*

The way I think about it is this: you can invest in an LLM wrapper today and hope the moat holds. Or you can invest in the only company with the inventor, the data, the clinical evidence, the regulatory pathway, the distribution partnerships, and a team that's been building this for eight years — at a price that reflects the fact that the world hasn't seen the RCT results or the Tier 1 publication yet.

That window closes soon.

**[9:30–10:00] — Closing**

I'll stop there. Happy to go deeper on any section — the science, the regulatory path, the commercial model, the clinical evidence, whatever's most useful for you.

---

## POST-SCRIPT: Audience-Specific Adjustments

### Healthcare VCs
- Spend more time on the Clinical Evidence and Catalysts sections
- Be prepared to go deep on the RCT design, endpoints, and regulatory pathway
- Emphasize the SCCM award and the guideline-writer validation line
- They will ask about reimbursement — have the CPT/DRG answer ready

### Generalist / AI VCs
- Spend more time on the Technology section — the RL vs LLM differentiation is your hook
- Frame this as "the real AI agent" — autonomous, decision-making, not text-generating
- Emphasize the moat: inventor, proprietary data, eight-year head start
- They will ask about defensibility and why not big tech — answer: the data is locked inside hospitals, the regulatory path takes years, and the clinical relationships can't be replicated by throwing compute at the problem

### Strategic / Corporate VCs
- Lead with the Partnerships section — Philips, Baxter, Mayo, Cleveland Clinic
- Frame the investment as distribution acceleration, not R&D risk
- Emphasize platform expansion — this is a multi-condition play, not a single-product bet
- They will ask about integration with existing infrastructure — the Philips relationship is your answer

---

## Timing Summary

| Section | Duration | Cumulative |
|---|---|---|
| Hero | 0:45 | 0:45 |
| Problem | 1:00 | 1:45 |
| Technology (RL vs LLM) | 1:30 | 3:15 |
| Live ICU Demo | 1:30 | 4:45 |
| Clinical Evidence | 1:00 | 5:45 |
| Catalysts | 0:45 | 6:30 |
| Partnerships | 0:45 | 7:15 |
| Platform Expansion | 0:30 | 7:45 |
| Team | 0:45 | 8:30 |
| Investment + Close | 1:30 | 10:00 |

---

## Quick Reference — Lines Worth Memorizing

1. "Our agent doesn't generate text. It generates treatment decisions."
2. "The people who write the global treatment guidelines are now the people validating our tool."
3. "This is pre-publication, pre-trial, pre-regulatory pricing. After these catalysts land, the terms will look very different."
4. "We're not raising out of necessity. We want to enter the critical window fully capitalised."
5. "Five million hours of ICU data. Sixty thousand patients. The agent has effectively treated more patients than any clinician alive."
