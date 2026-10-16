# Business Rules Catalog
## UniPulse: Next-Generation Campus Academic & Intelligent Registration Platform
**Course:** SWR302 - Software Requirements Engineering  
**Class:** SE2059-NJ | **Team:** Assignment Group 4  
**Pedagogical Guidance:** Karl E. Wiegers & Joy Beatty (*Software Requirements*, 3rd Edition, Chapter 9)  
**Classification Standard:** Facts, Constraints, Action Enablers, Inferences, Computations  

---

## 1. Executive Overview & Taxonomical Structure

The UniPulse academic registration engine is governed by a rigorous catalog of non-negotiable Business Rules. Following the Karl Wiegers taxonomy, every business rule is categorized as:
- **Constraint:** A restriction that limits the actions of the system or its users.
- **Computation:** A formula or mathematical algorithm transforming inputs into outputs.
- **Inference:** A logical condition that derives a new fact from existing facts.
- **Action Enabler:** A rule that triggers a specific system action when designated preconditions are satisfied.

```
       +-----------------------------------------------------------+
       |               Business Rules Taxonomy                    |
       +-----------------------------+-----------------------------+
                                     |
         +---------------------------+---------------------------+
         |                           |                           |
         v                           v                           v
  [BR-PRE] Prerequisites      [BR-CRED] Credit Limits     [BR-CAP] Capacities
  - Grade Threshold >= 5.0    - Min 10, Max 20 Credits    - Min 15, Max 35 Students
  - Co-requisite Sync         - Overload Criteria (GPA)   - Zero Overbooking Policy
  - Retake Grade Policy       - Probation Caps (Max 12)   - Section Split/Merge Rule
         |                           |                           |
         +---------------------------+---------------------------+
                                     |
         +---------------------------+---------------------------+
         |                           |                           |
         v                           v                           v
  [BR-TIME] Registration      [BR-WAIT] Waitlists         [BR-FEE] Financial/Refunds
  - Staggered Windows         - FIFO Priority Queue       - Tuition Rate Assessment
  - Add/Drop Week 1 Limit     - 12h Claim Window          - Sliding Refund Scale
  - W Grade Week 7 Deadline   - Auto-advance on expiry    - Late Fee Surcharges
```

---

## 2. Prerequisite & Curriculum Graph Rules (BR-PRE)

### BR-PRE-001: Prerequisite Passing Threshold
- **Type:** Constraint & Inference
- **Statement:** A student is eligible to enroll in a course only if the student has completed every mandatory prerequisite course with a passing grade of **Grade >= 5.0 on a 10.0 scale** (or Grade != 'F' for pass/fail courses).
- **Formal Logic:**
  $$\forall p \in \text{Prerequisites}(C): \exists r \in \text{Transcript}(S) \text{ such that } r.\text{CourseCode} = p \land r.\text{FinalGrade} \ge 5.0$$
- **Exception:** If an authorized Academic Advisor has recorded a formal override in the system (`BR-PRE-003`), the rule evaluates to `TRUE`.
- **System Action:** If rule evaluates to `FALSE`, the system prevents addition of the section to the registration cart and highlights the exact missing prerequisite course.

### BR-PRE-002: Co-Requisite Synchronization
- **Type:** Constraint & Action Enabler
- **Statement:** If Course A specifies Course B as a Co-Requisite, a student may enroll in Section of Course A if and only if Course B is either:
  1. Already successfully completed by the student ($\text{Grade} \ge 5.0$), OR
  2. Concurrently present in the student's registration cart or enrolled schedule for the identical academic semester.
- **System Action:** If a student attempts to drop Course B during Add/Drop while remaining enrolled in Course A, the system displays an alert: *"Cannot drop Course B: It is a mandatory co-requisite for enrolled Course A. Both must be dropped together."*

### BR-PRE-003: Administrative Prerequisite Override
- **Type:** Action Enabler
- **Statement:** An Academic Advisor or Department Chair may grant a prerequisite waiver for a student if the student demonstrates equivalent competencies (e.g., credit transfer from accredited university or verified industry certification).
- **Auditing Requirement:** The override action MUST record: Advisor ID, Student ID, Target Course Code, Mandatory Justification Note ($\ge 20$ characters), and Timestamp. This record is immutable and non-deletable.

### BR-PRE-004: Course Retake & Grade Replacement Policy
- **Type:** Computation & Inference
- **Statement:** A student may retake any course in which they received a grade $< 7.0$ (Grade C or lower).
- **Computation:** Upon retaking the course, the latest grade replaces the previous grade in the Cumulative Grade Point Average (CGPA) computation. However, all historical attempts remain visible on the official student transcript marked as `RETAKEN`.
- **Constraint:** A course may not be retaken more than 3 times without written permission from the Academic Dean.

---

## 3. Academic Credit Load & Overload Rules (BR-CRED)

### BR-CRED-001: Standard Semester Credit Thresholds
- **Type:** Constraint
- **Statement:** For regular Fall and Spring semesters, an undergraduate student must enroll within the established credit boundaries:
  - **Minimum Credit Load:** 10 credits (maintaining full-time student status).
  - **Maximum Credit Load:** 20 credits (standard maximum workload).
- **Decision Table:**

| Student Academic Standing | Cumulative GPA | Min Allowed Credits | Max Allowed Credits | Required Approval |
|:---|:---:|:---:|:---:|:---|
| **Academic Probation** | $< 2.00$ | 10 | 12 | Academic Advisor Mandatory Counseling |
| **Standard Good Standing** | $2.00 \le \text{GPA} < 3.20$ | 10 | 20 | None (Standard Registration) |
| **Dean's Honor / Overload** | $\ge 3.20$ | 10 | 24 | Automated Approval upon GPA Verification |
| **Graduating Senior** | Final Semester | 3 | 24 | Registrar Graduation Audit Check |

### BR-CRED-002: Summer Term Workload Cap
- **Type:** Constraint
- **Statement:** During the accelerated summer term (8 weeks), the maximum allowable credit load is capped at **8 credits** (equivalent to 2 standard lecture courses or 1 course + 1 lab).

---

## 4. Class Section Capacities & Lifecycle Rules (BR-CAP)

### BR-CAP-001: Absolute Zero-Overselling Constraint
- **Type:** Invariant Constraint
- **Statement:** Under no operational or concurrent execution conditions shall the total number of students with status `ENROLLED` in a class section exceed the configured `MaxCapacity` of that section.
- **Formal Invariant:**
  $$\text{EnrolledCount}(\text{Section}_i) \le \text{MaxCapacity}(\text{Section}_i) \quad \forall i$$
- **Enforcement Mechanism:** Enforced in memory via atomic Redis Lua scripts (`DECRBY remaining_seats`) and backed by relational database table constraints (`CHECK (enrolled_count <= max_capacity)`).

### BR-CAP-002: Minimum Enrollment Viability & Auto-Flagging
- **Type:** Inference & Action Enabler
- **Statement:** A course section requires a minimum enrollment of **15 students** to remain economically and pedagogically viable.
- **Trigger:** At 23:59:59 on Registration Day 4 (T-3 days before semester starts), the system automatically flags all sections with $\text{EnrolledCount} < 15$ as `UNDER_ENROLLED_CANDIDATE`.
- **System Action:** Generates an automated recommendation report for the Academic Registrar suggesting section mergers or faculty reallocations.

### BR-CAP-003: Section Split & Capacity Expansion Trigger
- **Type:** Action Enabler
- **Statement:** If all scheduled sections of a mandatory core course reach 100% capacity, and the aggregate waitlist count across all sections reaches **$\ge 20$ qualified students**, the system triggers an urgent `CAPACITY_DEFICIT_ALERT` to the Department Chair recommending the opening of an additional section.

---

## 5. Registration Timelines & Window Staggering (BR-TIME)

### BR-TIME-001: Cohort-Staggered Registration Appointment Windows
- **Type:** Constraint & Action Enabler
- **Statement:** To prevent unfair monopolization of elective seats and distribute peak computational load, registration access is phased over 4 consecutive calendar days based on completed academic credits:
  - **Day 1 (09:00):** Graduating Seniors ($\ge 105$ completed credits) and Honor Program students.
  - **Day 2 (09:00):** Juniors ($70 \le \text{Credits} < 105$).
  - **Day 3 (09:00):** Sophomores ($35 \le \text{Credits} < 70$).
  - **Day 4 (09:00):** Freshmen ($< 35$ completed credits).
  - **Days 5 to 7:** Open Adjustment Period (all students with active standing).
- **System Action:** If a student attempts registration prior to their designated window start time, the system rejects all write operations and displays an active countdown timer.

### BR-TIME-002: Add / Drop Period Deadline
- **Type:** Constraint
- **Statement:** Students may add new sections, drop enrolled sections, or execute atomic swaps until **23:59:59 on Sunday of Academic Week 1** (Day T+7).
- **Consequence:** After this deadline, the "Add/Drop" functionality is locked. Dropped courses after Week 1 are governed by the Course Withdrawal policy (`BR-TIME-003`).

### BR-TIME-003: Course Withdrawal with 'W' Grade
- **Type:** Constraint & Inference
- **Statement:** A student may officially withdraw from a course between **Monday of Week 2 and Sunday of Week 7**.
- **Consequence:**
  - The course grade is permanently recorded as **'W' (Withdrawn)** on the transcript.
  - The grade 'W' has **zero impact** on the calculation of Term or Cumulative GPA.
  - After Sunday of Week 7, withdrawals are disallowed; the student must receive an earned academic grade (A through F).

---

## 6. Waitlist Queue & Auto-Promotion Rules (BR-WAIT)

### BR-WAIT-001: Deterministic First-Come-First-Served (FCFS) Ordering
- **Type:** Constraint
- **Statement:** When a section reaches maximum capacity, students who satisfy all prerequisites and have zero time collisions may enter the waitlist. Students are ordered strictly by timestamp of entry with microsecond precision.
- **Constraint:** The maximum allowable waitlist size is **25% of the section's maximum capacity** (e.g., maximum 9 waitlist spots for a 35-seat classroom).

### BR-WAIT-002: 12-Hour Promotional Claim Window
- **Type:** Action Enabler & Constraint
- **Statement:** When an enrolled student drops a section, the system immediately places a 12-hour reservation hold on the vacated seat for Waitlist Position #1 and sends automated SMS, Push, and Email alerts.
- **Expiration:** The student has exactly **12 hours (43,200 seconds)** from the notification timestamp to log in and confirm enrollment.
- **Auto-Advance:** If the student fails to confirm before the countdown reaches 00:00:00, the reservation hold expires, the student is removed from the waitlist, and the seat is immediately offered to Waitlist Position #2.

---

## 7. Tuition Billing, Surcharges & Sliding Refund Rules (BR-FEE)

### BR-FEE-001: Tuition Computation Formula
- **Type:** Computation
- **Statement:** Total assessed tuition for a semester is calculated deterministically as:
  $$\text{TotalTuition} = \left( \sum_{i=1}^{n} \text{Credits}(C_i) \times \text{BaseRate} \right) + \sum_{i=1}^{n} \text{LabFee}(C_i) - \text{ScholarshipDiscount}$$
  - Standard Undergraduate Base Rate = **520,000 VND / Credit**.
  - Specialized Software Engineering / AI Computer Lab Fee = **1,200,000 VND / Laboratory Course**.

### BR-FEE-002: Sliding-Scale Tuition Refund Amortization
- **Type:** Computation & Constraint
- **Statement:** If an enrolled student drops a course section, the tuition financial credit refunded to the student's institutional account is calculated based on the calendar timestamp of the drop action:

| Timestamp of Course Drop | Tuition Refund Percentage | Academic Record Entry |
|:---|:---:|:---:|
| **Prior to Day 1 of Semester (Pre-Semester)** | **100% Refund** | Course completely expunged; zero transcript record. |
| **Academic Week 1 (Days 1 to 7)** | **80% Refund** | Course completely expunged; 20% retained as admin fee. |
| **Academic Week 2 (Days 8 to 14)** | **50% Refund** | Grade recorded as 'W'; 50% tuition refunded. |
| **After Academic Week 2 (Day 15 onwards)** | **0% Refund** | Grade recorded as 'W'; 100% tuition liability retained. |

### BR-FEE-003: Overdue Tuition Penalty & Registration Freeze
- **Type:** Action Enabler
- **Statement:** If a student has an outstanding tuition balance after the final fee deadline (Day 10 of semester), a **5% late surcharge** is assessed, and an automated `FINANCIAL_HOLD` is applied to the student profile, blocking grade viewing and subsequent semester course registration.

---

## 8. Academic Standing & Disciplinary Holds (BR-ACAD)

### BR-ACAD-001: Academic Standing Classification
- **Type:** Inference & Action Enabler
- **Truth Table:**

| Term GPA | Cumulative GPA | Consecutive Warning Semesters | Academic Standing Status | Permitted Action |
|:---:|:---:|:---:|:---|:---|
| $\ge 2.00$ | $\ge 2.00$ | 0 | **Good Standing** | Standard registration up to 20 credits. |
| $< 2.00$ | $\ge 2.00$ | 1 | **Academic Warning Level 1** | Registration restricted to max 12 credits; advisor meeting mandatory. |
| $< 2.00$ | $< 2.00$ | 2 | **Academic Suspension (Probation)** | Suspension from registration for 1 full semester. |

---
*End of Business Rules Catalog - UniPulse Platform*
