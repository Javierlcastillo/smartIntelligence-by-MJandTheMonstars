# Gategroup Inventory Management System

**Team:** MJandtheMonstars (Code: Y2KRZvC736DJg)  
**Names**: Javier Luis Castillo, Gabriel Villanueva, Rodrigo Narvaez y Pablo Pérez  
**Project:** Gategroup Inventory Management System  
**Focus:** Business value & implementation practicality  
**Stack:** React (frontend), Node/Express (API), Python (utilities), Supabase (DB & auth)

---

## 1) Executive Summary (Read This First)
**Problem:** Once items leave the warehouse, Gategroup loses item‐level traceability, forcing manual checks to know expiry dates and availability.  
**Our insight:** The gap isn’t software alone; it’s the **methodology**—no unique unit tracking exists after pallets are split.  
**Solution:** Introduce **unit‐level tracking** using a low‑cost **QR label per item** that encodes expiry, product, pallet, and a unique item ID. Our web app:
- **Scans** an item and instantly returns **Expired / OK / Near expiry**.
- **Creates** pallets in seconds (operators answer 4 prompts; items inherit pallet attributes).
- **Orchestrates** the daily **MasterPlan** (flight–cart assignments, readiness, inventory status, and basic KPIs).

**Why it matters:** This closes the traceability gap end‑to‑end, enabling FEFO (First Expire, First Out), reducing waste, surfacing demand patterns, and restoring accurate inventory in real time.

---

## 2) What’s Different About Our Approach
**Method, not just app**. We pair a **proven warehouse practice**(unit labels + FEFO) with the minimal software required—already built and **ready to deploy** to enforce it.
- **Per‑item identity**: Every physical unit gets a unique serial (QR).  
- **Denormalized expiry** on each item to enable instant checks without joins.  
- **Lifecycle statuses** (In_Warehouse → On_Cart → Consumed/Returned/Expired) to preserve history.  
- **Dashboard and summary** (templates) separated from actual loaded items for speed and auditability. So Master Plan becomes easier to execute and trace 

**Immediate value:**
- **Waste ↓** via FEFO and better waste prediction at pick time.
- **Stockouts ↓** via real‑time counts and fast reconciliation post‑flight.
- **Labor ↓** vs. manual checks; **errors ↓** vs. batch‐level assumptions.
- **Forecasting ↑** by knowing **which items move fastest**, per route, time, and cart type.
- **Normalization ↑** Tracebility of al items and process, so we can further standarize them.

---

3) Implementation Delivered (Methodology Enforced)

We didn’t just design a concept—we built the components needed to institutionalize FEFO and unit-level traceability end‑to‑end:

### A. Unit Identity & Labeling

- QR schema (JSON): { item_id, product_id, pallet_id, expiration_date } with human‑readable fallback on every sticker.

- Python label generator for batch QR creation per pallet.

- Thermal label print‑ready output.

### B. Scan‑to‑Decision Workflow

- React scanner (device camera) resolves QR → calls API → returns Expired / OK / Near‑expiry in <1s.

- FEFO guardrails: UI prioritizes near‑expiry items at pick time and blocks loading expired items.

- Status transition: In_Warehouse → On_Cart → Consumed/Returned/Expired, all time‑stamped and user‑attributed.

### C. Rapid Pallet Intake (4 Prompts)

- Operator flow: Product • Quantity • Expiry • Storage zone → creates INVENTORY_PALLET and auto‑generates PRODUCT_ITEM rows with inherited expiry.

- Input validation for dates, product IDs, and location flags.

### D. MasterPlan & Operations

- Daily MasterPlan: flights, cart assignments, cart readiness, and near‑expiry heatmap.

- Exceptions queue: items missing return scans, expired stock, and planogram variances.

### E. API & Data Contracts

- Endpoints for pallet creation, item bulk‑generation, item scan, load, consume, and return.

- Denormalized expiry on items for fast lookups (no heavy joins).

- WAREHOUSE_INVENTORY maintained for instant counts.

### F. Security & Governance

- Supabase Row‑Level Security with limited privileges only.

- Audit log on every state change (who/when/what).

- No PII in QR payload.

---

## 4) Architecture Overview
**Frontend:** React SPA (camera access for QR scanning, forms for pallet intake, dashboard).  
**Backend:** Node/Express REST API (QR decode & validation, business logic), with a small **Python** helper for batch label generation and analytics scripts.  
**Database:** Supabase (Postgres, row‑level security, auth).  
**Hosting/CI:** Supabase for DB/auth; Vercel/Netlify (or similar) for frontend; Render/Fly.io (or similar) for API.

**Key Flows:**
- **Reception → Pallet → Items**: Create pallet → auto‑generate item records → print labels.  
- **Pick/Load to Cart**: Scan items → FEFO enforced by UI warnings → set **On_Cart** with cart ID.  
- **In‑Flight & Return**: Items sold set to **Consumed**; returns scanned back to **In_Warehouse** or **Returned**; expired auto‑flagged.

---

## 5) Data Model (Practical View)
Core entities supporting FEFO and traceability:
- **PRODUCT**: master catalog (name, description, unit_cost).
- **INVENTORY_PALLET**: batch of one product with shared **expiration_date** and location flag.
- **PRODUCT_ITEM**: **unique serial per unit**; inherits pallet expiry; statuses (**In_Warehouse**, **On_Cart**, **Consumed**, **Expired**, **Returned**); optional **cart_id**.
- **CART / CART_LIST**: physical carts and their **planogram templates** (what should be loaded).
- **FLIGHT / SCHEDULED_FLIGHT**: route definitions and **dated assignments** linking carts to flights.
- **WAREHOUSE_INVENTORY**: fast summary of available units per product (materialized or maintained via triggers).

*(A UML ER diagram is included in the repo to illustrate all relationships.)*

---

## 6) Implementation Plan (Weeks to Days)
**Day 0–2 (Pilot Prep):**
- Define **label spec** (QR content schema + human‑readable fallback: product, expiry, pallet).  
- Create **1 pallet type** and **2–3 products** as pilot SKUs.  
- Configure Supabase tables + row‑level security.

**Day 3–5 (Floor Trial):**
- Train operators on **4‑prompt pallet intake** and **scan‑to‑load**.  
- Run 1–2 flight cycles; reconcile returns.

**Day 6–10 (Stabilize):**
- Tune FEFO thresholds (e.g., “Near Expiry ≤ 7 days”).  
- Rollout to additional SKUs and 1 more route.  
- Turn on basic KPIs (waste, near‑expiry stock, pick errors, stockouts).

**Change Management (Minimal):**  
- Add a **label printer** at goods‑in; QR stickers applied during palletization or at break‑bulk.  
- 15‑minute operator training; 1‑page SOP.

---

## 7) Security, Privacy, and Reliability
- **Supabase RLS** with least‑privilege policies; service key only for backend.  
- **Signed URLs** for label assets; no PII in QR codes.  
- **Audit trails** on item status changes (by user ID, timestamp).  
- **Offline‑friendly** scanning (local result cache) with server reconciliation on reconnect.

---

## 8) Limitations & Mitigations
- **Label compliance:** Stickers must be applied consistently. *Mitigation:* SOP + gate checks at cart load.  
- **Camera access constraints:** Some devices block camera; *Mitigation:* supervisors have a fallback scanner.  
- **Human error on returns:** Missed scans on return; *Mitigation:* reconcile counts vs. cart manifest, exception queue.

---

## 9) Demo Script (Time‑Boxed to 2 Minutes)
**00:00–00:20** — Problem framing: Traceability vanishes after warehouse; expiry checks become manual; waste and stockouts follow.  
**00:20–00:50** — Methodology: QR per unit + FEFO; status lifecycles; cart planograms.  
**00:50–01:20** — Live scan: Show **Expired/OK/Near Expiry** result; load item to a cart.  
**01:20–01:40** — Add pallet flow (4 prompts → items auto‑created).  
**01:40–02:00** — MasterPlan: flights, cart readiness, near‑expiry heatmap; close with ROI.

---

## 10) Representative information well preserved and accesible
- `POST /pallets` → { product_id, quantity, expiration_date, warehouseStorage }  
- `POST /items/bulk` → auto‑create items for a pallet  
- `GET /scan/:item_id` → returns { status, product, expiry, days_to_expiry, pallet_id, cart_id? }  
- `POST /items/:item_id/load` → { cart_id } → sets **On_Cart**  
- `POST /items/:item_id/consume` → sets **Consumed**  
- `POST /items/:item_id/return` → sets **In_Warehouse** or **Returned**  
- `GET /dashboard/masterplan?date=YYYY‑MM‑DD` → flights, carts, readiness, KPIs

---

## 11) Label & QR Specification (Pilot)
- **Human‑readable:** Product name, expiry (YYYY‑MM‑DD), pallet ID, item ID (shortened).  
- **QR payload (JSON):** `{ item_id, product_id, pallet_id, expiration_date }`  
- **FEFO threshold:** Near‑expiry ≤ **7 days** .  

