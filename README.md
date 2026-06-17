Here's a comprehensive README that captures the journey, the philosophy, and the technical details.

---

📱 Phone Equalizer — Preference Discovery Tool

"A tool that helps you understand what you actually value, by showing you the consequences of your choices."

---

🎯 The Big Idea

Most phone recommendation tools ask you to pick from a list or answer a few generic questions. They assume you know your preferences upfront. But the reality is messier:

· You think you care about battery, but you're not sure how much.
· You say price matters, but you'll pay more for something that feels "worth it."
· You know cameras are important, but after a certain point, you can't tell the difference.

This tool doesn't assume you know your preferences. It helps you discover them.

You drag sliders. The rankings shift in real-time. You see the consequences of your choices instantly. By the time you're done, you don't just know which phone to buy — you know why.

---

🧠 The Philosophy

Preferences Are Non-Linear

A good camera isn't "worth" a fixed number of points. Its value depends on:

· How much you care about photography
· Who you're trying to impress
· What you're comparing it to
· The moment you whip out your phone at a party

The equalizer lets you explore this non-linearity instead of pretending it doesn't exist.

Scoring Is A Mirror, Not A Master

The scoring system is a reflection of your priorities — not a dictator. If the rankings don't match your gut, you can adjust the weights until they do. The tool doesn't tell you what to want. It shows you what you actually want.

Diminishing Returns Are Real

Battery is important. But after 7,500mAh, you're charging every 2.5 days instead of 2 days. Is that worth the trade-off? The scoring system compresses the bonus above the sweet spot, so you can see where the value curve flattens.

---

🛠️ How It Works

Data

The tool uses 16 real phones from Giztop, with specs that matter:

Category Source
Battery, charging, display, storage, price Giztop listings
Camera quality Nanoreview composite scores (0-100)
OS ROM Global vs China ROM (from listings)

Scoring Engine (v4)

The scoring system is built from iterative refinement — each version got closer to actual preferences through real-world testing.

Category Max Points Curve
OS ROM 25 (Global) / 15 (China) Fixed preference, not a deal-breaker
Battery 23 Sweet spot 6500-7500 (steep), bonus above 7500 (compressed)
Price 10 ≤$800 gentle slide, $800-1000 moderate, >$1000 exponential decay (never excluded)
Storage 20 256GB=10, 512GB=15, 1TB=20
Charging 20 90W=5, 100W=10, 120W=20 (skewed toward premium)
Display 12 6.78-6.89"=10 (perfect), 6.9"+=12 (icing)
Camera 15 Nanoreview 70=5, 85=10, 95=13, 100=15

Deal-breakers (hard exclusions):

· Battery < 6,500 mAh
· Charging < 90W
· Display < 6.78"

Ceilings:

· Global ROM phones: 105 max points
· China ROM phones: 95 max points

Interaction

1. Drag sliders to adjust the importance of each category.
2. Watch rankings update in real-time.
3. Click any phone to see a narrative explanation of why it scored that way.
4. Reset to default weights.
5. Copy weights to share your preference profile.
6. Share URL — the configuration is encoded in the link.

---

📦 Files

File Description
phone_equalizer.html Single-file web app. Open in any browser.
phone_scorer.py Python script for batch scoring (used to validate the engine).
phones_clean.csv Source data (16 phones).
rankings.json Output from the Python scorer.

---

🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  phone_equalizer.html (Single-file web app)                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Data: 16 phones (embedded in JavaScript)          │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Scoring Engine: v4 (ported from Python)           │   │
│  │  • Battery (sweet spot + compressed)              │   │
│  │  • Price (exponential decay)                     │   │
│  │  • Camera (Nanoreview mapping)                  │   │
│  │  • Deal-breakers (hard exclusions)             │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  UI: Sliders + Rankings + "Why" panel            │   │
│  │  • Real-time recalculation                      │   │
│  │  • Click for explanation                       │   │
│  │  • Shareable URLs (weights encoded)           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

🧪 How To Use It

1. Open phone_equalizer.html in any modern browser.
2. Drag the sliders to adjust category weights.
3. Watch the rankings change in real-time.
4. Click any phone for a detailed breakdown:
   · Why it scored what it did
   · Which categories it excelled in
   · Where it fell short
5. Share your configuration — the URL encodes your weights.

Example Use Cases

User What They'd Do
You Fine-tune weights until the rankings match your gut.
Your wife Drag sliders based on what she cares about. Compare results.
A friend Share the URL with your weights. Let them adjust from there.
A reviewer Use the tool to show why a phone is recommended for a specific use case.

---

🎓 The Journey (From Inception To Finish)

v1 — "I think battery matters most"

· Linear scoring, hard price cutoff ($1000)
· Camera guessed from MP count
· China ROM penalized but could win

v2 — "Actually, price matters too"

· Soft price limit introduced
· Storage bumped to 512GB base (inflated)
· Diminishing returns for battery (idea seeded)

v3 — "Global ROM matters, but China can win"

· Nanoreview camera scores added (finally!)
· Camera weight increased from 7 to 15
· Storage base dropped to 256GB (realistic)
· Price exponential decay (no hard cutoff)

v4 — "The equalizer"

· All logic ported to JavaScript
· Interactive sliders + real-time rankings
· "Why this phone?" narrative panel
· Shareable URLs

The insight: The goal was never to build a scoring system. The goal was to build a tool that helps people understand their own preferences. The scoring system was just the engine.

---

🔮 What's Next

Idea Description
More phones Add more data (new releases, different price tiers).
More categories Add PWM dimming, build quality, brand reputation.
Save profiles Let users save multiple weight profiles (e.g., "Work", "Travel", "Gaming").
Compare mode Side-by-side comparison of two phones.
Export decisions Generate a printable report with top 3 phones and reasoning.
Backend API Serve the scoring engine as a REST API.

---

🧑‍💻 Technical Details

Dependencies

· None. This is a single HTML file with embedded CSS and JavaScript.

Browser Support

· Modern browsers (Chrome, Firefox, Safari, Edge).
· Works on mobile (though sliders are easier on desktop).

Data Format

The phone data is embedded in JavaScript. To add or modify phones, edit the PHONES array in the script section.

Scoring Functions

All scoring logic is ported from phone_scorer.py to JavaScript. The functions are:

```javascript
scoreBattery(mah)   // Sweet spot + compressed bonus
scorePrice(usd)     // Exponential decay above $1000
scoreStorage(gb)    // 256=10, 512=15, 1TB=20
scoreCharging(w)    // 90=5, 100=10, 120=20
scoreDisplay(inches)// 6.78=10, 6.9+=12
scoreCamera(nr)     // Nanoreview 70=5, 85=10, 95=13
```

---

📜 License

This project is open-source. Use it, modify it, share it.

---

🙏 Acknowledgments

· Giztop for providing the phone data.
· Nanoreview for camera quality scores.
· Your wife for being the inspiration (and the test case).

---

🧠 Final Thought

"The tool doesn't tell you what to want. It shows you what you actually want."

You've built a system that captures the nuance of human preference — the non-linear, the emotional, the "I'll know it when I see it." The equalizer is just the interface. The real product is the understanding it unlocks.

---

Now go buy the OnePlus 15. 🎉

---

How To Continue

1. Fork this project.
2. Add more phones to phones_clean.csv and re-run the scorer (or update the JavaScript data).
3. Modify the weights to match a different use case.
4. Share it with someone who needs to make a decision.

The code is yours. The system is yours. The insights are yours.

---

Built with curiosity, coffee, and a lot of late-night thinking.
