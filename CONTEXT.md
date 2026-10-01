# SurgeGuard — Predictive Command Center for Mega Events

> **Hackathon MVP (7 hours total)**
> Tagline: _"Predictive Command Center for Mega Events"_

All data is **simulated locally**. No backend, no auth, no external APIs, no ML.

---

## Product Concept

A predictive command center web dashboard for a **50,000-person concert**.

The workflow follows five phases:

1. **MONITOR** — live view of crowd zones with occupancy, queue times, staff, risk status.
2. **PREDICT** — extrapolate growth from recent readings; estimate time-to-capacity.
3. **RECOMMEND** — engine generates prioritized, actionable recommendations.
4. **ACT** — the manager executes a response plan (redirect crowd, deploy staff, open lanes, update signage).
5. **MEASURE IMPACT** — before-vs-after comparison showing how the response improved the situation.

---

## Zones

| Zone         | Kind   | Capacity | Initial Occupancy | Staff | Notes                                     |
| ------------ | ------ | -------- | ----------------- | ----- | ----------------------------------------- |
| Gate A       | gate   | 5,000    | ~58%              | 6     | Normal flow                               |
| Gate B       | gate   | 5,000    | 72% → 96%         | 8     | **Hero scenario zone** — surges to critical |
| Gate C       | gate   | 5,000    | ~42%              | 5     | Spare capacity, used for redirection       |
| Main Arena   | arena  | 30,000   | ~64%              | 40    | Fills as gates discharge                  |
| Food Court   | venue  | 4,000    | ~55%              | 10    | Midday/intermission peaks                 |
| Parking      | parking| 12,000   | ~70%              | 15    | Inbound flow early, outbound late         |

Each zone has: **capacity, current crowd, occupancy %, trend, queue time (min), staff count, risk status**.

---

## Risk Levels (by occupancy %)

| Level     | Range          | Color  |
| --------- | -------------- | ------ |
| NORMAL    | < 70%          | green  |
| WARNING   | 70% – 85%      | amber  |
| HIGH      | 85% – 95%      | orange |
| CRITICAL  | > 95%          | red    |

**Prediction also escalates risk** when time-to-capacity is short (even if current occupancy hasn't crossed a threshold yet).

---

## Prediction Engine

- **Growth rate** (people/min) derived from recent readings in `history[]`.
- **Time to capacity** = `(capacity − current) / growthRate`.
- If `growthRate ≤ 0`, time-to-capacity is `Infinity` (no breach predicted).
- Explainable, **no ML** — purely linear extrapolation with clear inputs.

---

## Hero Scenario (Gate B Surge)

Gate B (capacity 5,000) surges over 6 ticks:

| Tick | Occupancy | People |
| ---- | --------- | ------ |
| 0    | 72%       | 3,600  |
| 1    | 76%       | 3,800  |
| 2    | 81%       | 4,050  |
| 3    | 86%       | 4,300  |
| 4    | 91%       | 4,550  |
| 5    | 96%       | 4,800  |

System **predicts breach in ~8 min** and recommends:
1. **Redirect** incoming crowd to Gate C.
2. **Deploy 3 staff** to Gate B (8 → 11).
3. **Open secondary lane** at Gate B.
4. **Update signage** to guide attendees to Gate C.

After **EXECUTE RESPONSE PLAN**:
- Gate B drops to ~78%, queue 18 → ~9 min, risk returns to **Normal**.
- Gate C rises moderately (still safe).
- Alert becomes **RESOLVED**.
- Impact snapshot shows before-vs-after.

---

## Staff Pool

- **Total staff**: 120
- **Deployed**: 84
- **Available**: 36

---

## Design

- **Premium dark control-room dashboard.** Near-black navy background, subtle borders, semantic colors.
- Green = normal, amber = warning, orange = high, red = critical, cyan/blue = info/action.
- **Must NOT look like a generic AI dashboard.**
- Display font: distinctive Google Font pairing (not Inter/Roboto).
- Monospace font for all numeric readouts.

---

## Architecture Rules

- **Single source of truth** in a React context/reducer (`src/state/`).
- **Engine logic** lives in pure functions under `src/engine/`.
- **UI components** stay presentational (receive props, dispatch actions).
- **All tunable numbers** live in `src/config/scenario.ts`.
- No backend, no auth, no external APIs, no ML.
