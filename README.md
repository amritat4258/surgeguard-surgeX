# SurgeGuard

**Predictive crowd command center for a 50,000-person concert.**
SurgeGuard doesn't just show where crowds are. It predicts where they are
about to become dangerous, recommends what to do, lets the manager act in one
click, and measures whether it worked.

**MONITOR -> PREDICT -> RECOMMEND -> ACT -> MEASURE IMPACT**

All data is simulated locally. There is no backend.

## Run it

```bash
npm install
npm run dev
```

## 60-second demo script

1. **Monitor.** Six zones (three gates, main arena, food court, parking) with
   live occupancy, queue times and staffing. Click **Run Surge Scenario**.
2. **Predict.** Gate B starts filling fast. SurgeGuard turns the growth rate
   into a time-to-capacity, and shows its math on the Gate B card.
3. **Recommend.** Gate B goes HIGH, then CRITICAL (about 9 minutes to breach).
   An alert fires and the system proposes a plan: redirect arrivals to the
   calmer Gate C, deploy 3 staff, open an extra lane, update signage.
4. **Act.** The manager clicks **EXECUTE RESPONSE PLAN**.
5. **Measure impact.** Gate B drops from 96% to about 78%, the queue from
   18 to 9 minutes, staff goes from 8 to 11, and the alert is RESOLVED.
   Gate C absorbs the redirected crowd and stays safe.

## How prediction works (explainable, no black box)

- Growth rate = average change in crowd over the last 3 readings.
- Time to capacity = remaining space / growth rate.
- Risk level = occupancy thresholds (70 / 85 / 95%), escalated one level when
  a breach is under 10 minutes away.

Every number is shown on screen so an operator can trust it.

## Live mode (real-time data)

By default SurgeGuard runs the scripted Gate B scenario. To run on a real-time
feed instead, point it at a WebSocket that sends sensor readings:

```bash
npm install
npm run feed                       # terminal 1: mock sensor gateway (ws://localhost:8080)
cp .env.example .env.local         # sets VITE_FEED_URL
npm run dev                        # terminal 2
```

With `VITE_FEED_URL` unset, nothing changes and the simulation runs as before.

**Message format** (one object, or an array of them):

```json
{ "zoneId": "gate-b", "timestamp": 1767225600000, "count": 4260, "queueMin": 13, "staff": 8 }
```

`zoneId` must be one of the six ids in `src/config/scenario.ts`. `timestamp` is
epoch ms from the sensor. `queueMin` and `staff` are optional.

**What changes in live mode**

- Growth rate is a least-squares fit over the last 5 minutes of *sensor time*
  (not "last 3 readings"), so irregular or noisy sensors still give a sensible
  time-to-capacity. Tunable in `config/scenario.ts` (`LIVE_*`).
- Out-of-order or duplicate readings are dropped; malformed messages are ignored.
- The top bar shows CONNECTING / LIVE FEED / RECONNECTING / STALE DATA. If no data
  arrives for 10 s the dashboard warns, and **Execute Response Plan is disabled**.
- Execute sends `{"cmd":"execute", ...}` to the gateway. The impact panel's
  "after" numbers then follow what the sensors report, not a scripted value.

A browser should not hold real sensor credentials. For a real deployment, put a
small backend between the sensors and this dashboard that exposes the feed above.

## Stack

Vite, React 18, TypeScript, Tailwind CSS v3, Recharts, lucide-react.

## Project layout

```
src/
  config/scenario.ts     all tunable numbers (thresholds, zones, hero scenario)
  engine/                pure logic: simulation, prediction, alerts, recommendations
  state/                 CommandCenterProvider (React context)
  components/            layout, metrics, zones, map, charts, alerts,
                         recommendations, impact
```

live demo: https://surgeguard.vercel.app/