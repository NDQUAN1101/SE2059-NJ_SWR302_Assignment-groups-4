# Requirements Traceability Matrix & Analytical Prioritization
## UniPulse: Next-Generation Campus Academic & Intelligent Registration Platform
**Course:** SWR302 - Software Requirements Engineering  
**Class:** SE2059-NJ | **Team:** Assignment Group 4  
**Pedagogical Guidance:** Karl E. Wiegers & Joy Beatty (*Software Requirements*, 3rd Edition, Chapter 16: *Setting Requirement Priorities* & Chapter 29: *Links in the Requirements Chain*)  

---

## 1. Requirements Prioritization Model (Karl Wiegers Analytical Framework)

To move beyond subjective debate, UniPulse employs the semi-quantitative prioritization spreadsheet method developed by Karl Wiegers. Each candidate feature is scored across four dimensions:
1. **Relative Benefit (1–9):** Value delivered to students, faculty, or administrators.
2. **Relative Penalty (1–9):** Damage or institutional friction incurred if the feature is absent.
3. **Relative Cost (1–9):** Engineering complexity and development effort.
4. **Relative Risk (1–9):** Technical uncertainty, concurrency challenges, and third-party dependency risks.

### Prioritization Weights (Standard Course Baseline)
- Benefit Weight = **2**
- Penalty Weight = **1**
- Cost Weight = **0.5**
- Risk Weight = **0.5**

### Formulae:
- $\text{Total Value} = (\text{Benefit} \times \text{Benefit Weight}) + (\text{Penalty} \times \text{Penalty Weight})$
- $\text{Value \%} = \frac{\text{Total Value}}{\sum \text{Total Values}} \times 100$
- $\text{Cost \%} = \frac{\text{Cost}}{\sum \text{Costs}} \times 100$
- $\text{Risk \%} = \frac{\text{Risk}}{\sum \text{Risks}} \times 100$
- $\text{Priority Rating} = \frac{\text{Value \%}}{(\text{Cost \%} \times \text{Cost Weight}) + (\text{Risk \%} \times \text{Risk Weight})}$

### Prioritization Spreadsheet Matrix

| Feature ID | Feature Description | Relative Benefit (1-9) | Relative Penalty (1-9) | Total Value | Value % | Relative Cost (1-9) | Cost % | Relative Risk (1-9) | Risk % | Priority Rating | MoSCoW Ranking |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **FEAT-1** | Distributed Atomic Registration Engine (Lua & Redis) | 9 | 9 | 27 | 18.2% | 8 | 17.8% | 9 | 22.0% | **0.91** | **[Must Have]** |
| **FEAT-2** | Prerequisite & Co-Requisite DAG Validation Engine | 8 | 8 | 24 | 16.2% | 6 | 13.3% | 5 | 12.2% | **1.27** | **[Must Have]** |
| **FEAT-3** | Interactive Timetable Matrix with Real-Time Clash Checker | 8 | 7 | 23 | 15.5% | 5 | 11.1% | 4 | 9.8% | **1.48** | **[Must Have]** |
| **FEAT-4** | Dynamic Waitlist FIFO Queue with 12h Auto-Promotion | 7 | 6 | 20 | 13.5% | 6 | 13.3% | 6 | 14.6% | **0.97** | **[Must Have]** |
| **FEAT-5** | Tuition Assessment & Instant Banking VietQR Settlement | 7 | 8 | 22 | 14.9% | 5 | 11.1% | 5 | 12.2% | **1.28** | **[Must Have]** |
| **FEAT-6** | Academic Operations Dashboard (Under-enrolled Merges) | 6 | 6 | 18 | 12.2% | 5 | 11.1% | 4 | 9.8% | **1.17** | **[Should Have]**|
| **FEAT-7** | Degree Audit Visual Graduation Pathway Tracker | 5 | 4 | 14 | 9.5% | 4 | 8.9% | 3 | 7.3% | **1.17** | **[Should Have]**|
| **FEAT-8** | AI-Powered Personalized Schedule Optimizer | 4 | 1 | 9 | 6.1% | 7 | 15.6% | 7 | 17.1% | **0.37** | **[Could Have]** |
| **Totals** | | **54** | **49** | **157** | **100%**| **46** | **100%**| **43** | **100%**| | |

---

## 2. Requirements Traceability Matrix (RTM)

The Requirements Traceability Matrix maps business objectives through user requirements, functional requirements, architectural components, and verification test cases, guaranteeing zero orphaned or unverified requirements.

| Business Objective ID | User Need / Use Case ID | Functional Requirement ID | Business Rule ID | Architectural Component / Microservice | Verification / Test Case ID | Status |
|:---|:---|:---|:---|:---|:---|:---:|
| **BO-1** (Zero Downtime) | **UC-02** (Peak Registration) | **FR-REG-002** (Waiting Room)<br>**FR-REG-003** (Redis Lua) | **BR-TIME-001** (Staggering)<br>**BR-CAP-001** (Zero Oversell) | Cloudflare WAF, Redis Cluster, Virtual Queue Service | **TC-PERF-01** (25,000 Concurrent User Surge Benchmark) | Verified |
| **BO-2** (Zero Overselling) | **UC-02** (Peak Registration)<br>**UC-04** (Atomic Swap) | **FR-REG-003** (Atomic Lock)<br>**FR-SWP-002** (Atomic Swap) | **BR-CAP-001** (Invariant Seat Cap) | Redis In-Memory Engine, PostgreSQL Constraint Engine | **TC-CONC-02** (500 Simultaneous Requests for 1 Final Seat) | Verified |
| **BO-3** (Sub-Second Latency) | **UC-01** (Planner Grid)<br>**UC-02** (Registration) | **FR-SCH-002** (Clash Detector)<br>**FR-REG-003** (Lua Lock) | **BR-TIME-001** | Redis Cache Layer, React/Client-Side Collision Engine | **TC-LAT-03** (P95 Latency < 800ms under 3,500 req/s load) | Verified |
| **BO-4** (Completion < 4m) | **UC-01** (Schedule Planner)<br>**UC-06** (Online Tuition) | **FR-SCH-001** (Interactive Grid)<br>**FR-FIN-002** (VietQR Pay) | **BR-CRED-001** (Credit Limits)<br>**BR-FEE-001** (Tuition Calculation) | UI Timetable Studio, Payment Gateway Webhook Receiver | **TC-E2E-04** (End-to-End Registration Flow Usability Test) | Verified |
| **BO-5** (Reduce Admin 75%) | **UC-08** (Prereq Override)<br>**UC-05** (Auto-Promotion) | **FR-PRE-004** (Advisor Override)<br>**FR-WTL-002** (Auto-Promotion) | **BR-PRE-003** (Override Audit)<br>**BR-WAIT-002** (12h Window) | Prerequisite Service, Automated Waitlist Promotion Daemon | **TC-OPS-05** (Automated Waitlist Promotion & Expire Cycle) | Verified |
| **BO-6** (Capacity Optimization) | **UC-07** (Section Viability) | **FR-OPS-001** (Heatmap)<br>**FR-OPS-002** (Auto-Merge) | **BR-CAP-002** (Min 15 Rule)<br>**BR-CAP-003** (Split Trigger) | Academic Operations Analytics Service, Roster Manager | **TC-OPS-06** (Under-Enrolled Section Alert & Merge Execution) | Verified |

---

## 3. Verification Test Suite Matrix (Exemplary Concurrency Tests)

### Test Case: `TC-CONC-02` (High-Concurrency Final-Seat Race Condition)
- **Objective:** Verify that when 500 concurrent students submit a registration request for a section with only 1 remaining seat at the exact same millisecond, exactly ONE student is enrolled, 499 students are cleanly rejected/offered waitlist, and the section capacity never exceeds maximum limit.
- **Test Methodology:** Automated Distributed Load Test using k6 executing 500 parallel virtual user threads against `/api/v1/registrations`.
- **Expected Results:**
  - HTTP 200 OK returned: Exactly 1.
  - HTTP 409 Conflict (Section Full): Exactly 499.
  - Database Audit query: `SELECT enrolled_count FROM class_sections WHERE section_id = X` equals exactly `max_capacity`.
  - Zero database deadlocks or HTTP 500 errors.

---
*End of Requirements Traceability Matrix & Analytical Prioritization - UniPulse Platform*
