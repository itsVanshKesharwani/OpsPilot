# 📽️ Demo Script — OpsPilot (30 Seconds for Judges)

**Narrator:** Team ShiftSpark  
**Event:** Flip the Switch Hackathon — WeMakeDevs × DevTools Academy × Switch+  
**Track:** 01 — Best Business Workflow  
**Total time:** 2-3 minutes

---

## 🎬 Scene 1: Dashboard Opening (0:00-0:15)

**Action:** Open browser to `http://127.0.0.1:8000`

**Narrator says:**
> "Namaste judges! Hum hain Team ShiftSpark, aur aaj hum dikha rahe hain OpsPilot — ek AI Incident Command Center. Jab production down ho, toh jawab kitni der mein milega? OpsPilot iska jawab hai: 5 minute mein resolve, 1 hour mein nahi."

**Visual:** Dashboard loads — live incidents, AI agents status, Switch Bridge showing simulated mode, uptime 99.94%.

---

## ⚡ Scene 2: Simulate Production Alert (0:15-0:30)

**Action:** Click top-right **"⚡ Simulate Production Alert"** button

**Narrator says:**
> "Production mein aagayi — HTTP 500 flood! Hum ek click mein incident simulate karte hain. Dekhiye kaise apne aap chalta hai."

**Visual:** Toast notification appears: "Incident #9 injected — detection started". Incident appears in Live Incidents list with severity "Critical" and status "Detected".

---

## 🔍 Scene 3: The 5-Stage Auto Flow (0:30-1:30)

**Action:** Click on the incident to open Incident Detail. Watch the timeline auto-advance.

**Narrator says (step by step as timeline advances):**

1. **Detection** — "Sentinel agent ne alert detect kiya — cart-service mein 500 errors aa rahe hain."
2. **AI Triage** — "Atlas ne severity critical mark ki, blast radius identified — sirf payment module affected."
3. **Debugging** — "Sherlock ne logs analyze kiye, root cause nikal liya — v2.14.0 deploy mein regression tha."
4. **Approval** — "Forge ne rollback plan banaya. Lekin ye destructive action hai, isliye human approval wait kar raha hai."
5. **Resolution** — "Hum Approval Center mein jaate hain, Approve & Execute karte hain. Pilot rollback execute karta hai. Incident resolved!"

**Visual:** Timeline stages turn from pending → active → done with green checkmarks. Console output shows color-coded logs. Approval card shows risk level and approve/reject buttons.

---

## 💬 Scene 4: War Room — Switch in Action (1:30-2:00)

**Action:** Navigate to War Room page

**Narrator says:**
> "Sab kuch Switch ke through hota hai. War Room mein AI agents aur humans ek saath chat karte hain. Sentinel, Atlas, Sherlock sab teammates ki tarah switch room mein hain. Har event Switch par routed hota hai."

**Visual:** War Room shows agent messages (cyan) and human messages (violet). Switch Event Log shows incident.opened, approval.requested, approval.decided, action.executed events.

---

## 📊 Scene 5: Analytics (2:00-2:30)

**Action:** Navigate to Analytics page

**Narrator says:**
> "Analytics se pata chalta hai ki MTTR kitna kam hua — pehle 1 hour, ab 5 minute. Agent productivity, severity split, sab dikhta hai."

**Visual:** MTTR trend chart, severity split pie chart, agent productivity bar chart, service reliability table.

---

## 🏁 Closing (2:30-3:00)

**Narrator says:**
> "OpsPilot — AI agents + humans, Switch ke through milkar production incidents resolve karte hain. Human approval gate ke bina kuch bhi destructive nahi chalta. Thank you!"

**Visual:** Back to Overview dashboard showing resolved incident count increased.

---

## 📋 Demo Checklist for Narrator

- [ ] Backend running on port 8000
- [ ] Frontend built and accessible
- [ ] At least 1 incident simulated during demo
- [ ] Show Approval Center approve action
- [ ] Show War Room chat
- [ ] Show Analytics charts
- [ ] Mention Switch integration explicitly

---

## 🐛 If Something Breaks During Demo

| Issue | Fix |
|-------|-----|
| Backend not responding | Restart: `cd backend && python -m uvicorn main:app --port 8000` |
| Frontend blank | Hard refresh (Ctrl + F5) |
| Incident not appearing | Click "Simulate Production Alert" again |
| Approval button not working | Check backend console for errors |

---

## 🔗 Links

- **Demo Video:** _(Add Loom/YouTube link here)_
- **Live Demo:** http://127.0.0.1:8000
- **GitHub Repo:** https://github.com/itsVanshKesharwani/OpsPilot
- **PR:** https://github.com/itsVanshKesharwani/OpsPilot/pull/1