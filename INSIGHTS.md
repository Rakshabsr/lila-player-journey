# Insights — LILA BLACK Player Behaviour Analysis

Data source: 5 days (Feb 10–14, 2026) · 796 matches · 89,104 events · 3 maps

---

## Insight 1 — LILA BLACK is a solo vs. bots game in practice, not PvP

### What caught my eye
In the match selector, every match showed "1 player · N bots." After seeing this across dozens of matches I queried the full dataset.

### The numbers
- **779 out of 796 matches (97.9%)** contained exactly 1 human player
- **16 matches had 0 humans** (pure bot lobbies — likely testing)
- **Only 1 match in 5 days had more than 1 human player**
- **Total human-vs-human kills: 3** (out of 89,104 events = 0.003%)
- By contrast: **2,415 BotKill events** — humans kill bots 805× more than they kill each other

### What this means for a level designer
The map is being experienced as a **solo exploration + bot-combat environment**, not as a PvP arena. Design decisions built around player-vs-player chokepoints, sightlines for duels, or PvP-focused cover placement are currently invisible to the actual player base. Any "death trap" zones on the map that were designed for PvP are likely just killing bots, not creating memorable human moments.

**Actionable items:**
- Audit PvP-oriented zones (narrow corridors, tower positions, bridge chokepoints) — track whether bot kills cluster there; if yes, the zone works mechanically but lacks the intended human tension
- Metric to watch: `Kill` event rate over time — if human population grows, these zones will activate
- Consider whether the current bot density (avg 13 bots per match) creates sufficient combat pressure as a solo experience

---

## Insight 2 — Players loot more than they fight

### What caught my eye
The event type breakdown showed Loot was the third most common event — more than all combat events combined.

### The numbers
- **Loot pickups: 12,885 events (14.5% of all data)**
- **All combat events combined: 3,160** (Kill + Killed + BotKill + BotKilled + KilledByStorm)
- Loot-to-kill ratio: **4.1 loot pickups per bot kill**
- On the Traffic heatmap, loot clusters are visible around specific structures — particularly the large compound in the centre of Ambrose Valley

### What this means for a level designer
Player movement is being **driven by loot density**, not by combat pressure. Players route through the map to hit loot spawns, not to hunt enemies. This means loot placement is currently the primary lever for controlling player flow.

**Actionable items:**
- If loot clusters heavily in one zone, players funnel there regardless of bot placement — this creates predictable, repetitive routes
- Metric to watch: ratio of Loot events to Position events per map zone — zones with high loot density but low player traffic may have a pathing or visibility problem
- Cross-reference loot hotspots with BotKill hotspots: if they overlap heavily, loot is co-located with combat, which is engaging; if they're separate, players may be looting safely without any risk

---

## Insight 3 — Grand Rift has a visibility/engagement problem

### What caught my eye
Switching between maps in the tool, AmbroseValley was dense with activity while GrandRift looked sparse — even on its busiest day.

### The numbers
- **AmbroseValley: 60,013 events — 67% of all data**
- **Lockdown: 21,238 events — 24% of all data**
- **GrandRift: 6,853 events — only 7.7% of all data**
- GrandRift has the fewest events across every single day in the dataset
- The kill and death heatmap on GrandRift shows activity concentrated in a very small corner of the map — large portions appear almost entirely unused

### What this means for a level designer
GrandRift is either **under-rotated in the matchmaking pool** or players who land there disengage faster (die earlier, extract sooner, or simply avoid it). The concentration of activity in one small zone suggests the rest of the map is not drawing players in — possibly due to poor loot distribution, unclear navigation, or lack of interesting combat landmarks.

**Actionable items:**
- Investigate whether GrandRift appears less frequently in the match rotation — if so, that's a matchmaking setting, not a design problem
- If rotation is equal, audit loot density across the full GrandRift map — empty zones may signal that players find no reason to explore them
- Metric to watch: average match duration and BotKill count on GrandRift vs other maps — shorter matches with fewer kills suggest players extract quickly rather than exploring
