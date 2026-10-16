# Detailed Use Case Specifications
## UniPulse: Next-Generation Campus Academic & Intelligent Registration Platform
**Course:** SWR302 - Software Requirements Engineering  
**Class:** SE2059-NJ | **Team:** Assignment Group 4  
**Pedagogical Guidance:** Karl E. Wiegers & Joy Beatty (*Software Requirements*, 3rd Edition, Chapter 8)  
**Standard:** Cockburn Style Formal Use Case Templates  

---

## Use Case Index

| Use Case ID | Use Case Name | Primary Actor | Priority | Business Rules Referenced |
|:---:|:---|:---:|:---:|:---|
| **UC-01** | Plan Semester Timetable & Verify Prerequisites | Student | High [M] | BR-PRE-001, BR-PRE-002, BR-CRED-001 |
| **UC-02** | Register for Course Sections under Peak Concurrency | Student | Critical [M] | BR-CAP-001, BR-TIME-001, BR-CRED-001, BR-WAIT-001 |
| **UC-03** | Drop Enrolled Course Section | Student | High [M] | BR-TIME-002, BR-FEE-002, BR-CAP-002 |
| **UC-04** | Atomically Swap Course Sections | Student | High [M] | BR-CAP-001, BR-TIME-002 |
| **UC-05** | Join Waitlist & Receive Auto-Promotion | Student | High [M] | BR-WAIT-001, BR-WAIT-002, BR-WAIT-003 |
| **UC-06** | Calculate and Settle Tuition Fees Online | Student | High [M] | BR-FEE-001, BR-FEE-003 |
| **UC-07** | Review Section Viability & Approve Merges/Cancellations | Academic Registrar | High [M] | BR-CAP-002, BR-CAP-003 |
| **UC-08** | Process Prerequisite Override Appeal | Academic Advisor | Medium [S] | BR-PRE-003, BR-AUD-001 |

---

## UC-01: Plan Semester Timetable & Verify Prerequisites

### 1. Overview
- **Use Case ID:** UC-01
- **Use Case Name:** Plan Semester Timetable & Verify Prerequisites
- **Primary Actor:** Student
- **Secondary Actors:** Academic Advisor (optional consultation)
- **Description:** Allows a student to browse available course sections for the upcoming semester, test timetable combinations on an interactive 7-day grid, automatically evaluate prerequisite and co-requisite eligibility, and save a validated tentative schedule draft prior to the registration window opening.
- **Trigger:** Student navigates to the "Schedule Planner" module on the student portal.

### 2. Preconditions & Postconditions
- **Preconditions:**
  1. Student is authenticated via University SSO.
  2. Student academic record and transcript are loaded.
  3. Upcoming semester course timetable has been published by the Academic Office.
- **Postconditions (Success):**
  1. A validated, clash-free tentative schedule draft is saved to the student profile.
  2. The student's shopping cart is primed for one-click checkout when their registration window opens.
- **Postconditions (Failure):**
  1. Conflicting or ineligible courses remain flagged with actionable correction guidance; no invalid draft is finalized.

### 3. Normal Flow of Events (Main Success Scenario)
| Step | Actor Action | System Response |
|:---:|:---|:---|
| 1 | Student selects the target academic semester. | System loads the student's Degree Audit status and active course catalog. |
| 2 | Student enters search criteria (e.g., Course Code "SWR302", Instructor, or Time Slot). | System filters and displays matching course sections along with credit count, faculty, schedule, and live seat capacity. |
| 3 | Student selects a target course section to preview. | System executes prerequisite validation engine against student's transcript: verifies prerequisite courses passed with Grade >= 5.0/10.0. |
| 4 | Student clicks "Add to Timetable Grid". | System performs time collision check against already selected tentative sections. |
| 5 | System verifies zero time collisions exist. | System plots the course block onto the interactive weekly calendar grid in distinct color. |
| 6 | Student repeats Steps 2–5 until desired semester courses are selected (total credits between 10 and 20). | System continuously recalculates total credits and tuition estimate. |
| 7 | Student clicks "Save & Prime Registration Cart". | System validates total credit boundaries (BR-CRED-001) and saves the pre-registration cart into Redis session cache. |

### 4. Alternative Flows
- **4a. Prerequisite Deficiency Detected:**
  - *At Step 3:* If student has not passed the prerequisite course (e.g., attempting to register SWR302 without passing PRJ301 with Grade >= 5.0):
    1. System displays red warning badge: "Prerequisite Unsatisfied: PRJ301 (Java Web Development) required."
    2. System disables the "Add to Grid" button for this section.
    3. System renders an "Appeal Prerequisite" button routing to UC-08.
- **4b. Schedule Collision (Time Clash):**
  - *At Step 4:* If selected section overlaps with an already plotted section:
    1. System highlights the overlapping time slot in pulsing red.
    2. System generates modal dialog: "Time Clash Detected: This section conflicts with [SWT301 - Slot 2 Tue/Fri]."
    3. System suggests alternative sections of the same course that fit cleanly into the student's schedule.
    4. Student selects an alternative section, and the flow resumes at Step 5.

### 5. Exception Flows
- **5a. Course Syllabus or Section Cancelled mid-session:**
  - System notifies student with toast alert: "Section cancelled by Department. Please choose an alternate section."
  - System refreshes the section listing.

---

## UC-02: Register for Course Sections under Peak Concurrency

### 1. Overview
- **Use Case ID:** UC-02
- **Use Case Name:** Register for Course Sections under Peak Concurrency
- **Primary Actor:** Student
- **Secondary Actors:** Payment Gateway, Notification Service
- **Description:** Enables a student to convert their planned shopping cart into confirmed course enrollments at the moment their registration window opens, utilizing distributed atomic reservation to eliminate race conditions and guarantee zero seat overselling.
- **Trigger:** Student clicks "Confirm & Submit Registration" during their active registration window.

### 2. Preconditions & Postconditions
- **Preconditions:**
  1. Student is authenticated and current timestamp matches the student's authorized registration appointment window (BR-TIME-001).
  2. Student has no active financial or disciplinary holds on their account.
  3. Student has >= 1 valid course sections in their registration cart.
- **Postconditions (Success):**
  1. Exact course seats are atomically reserved in Redis inventory.
  2. Enrolled records are persisted in PostgreSQL database with status `ENROLLED`.
  3. Class section capacity count is decremented by 1.
  4. Real-time confirmation receipt with unique transaction hash is generated.
  5. Tuition invoice is updated with newly registered credit balance.
- **Postconditions (Failure):**
  1. If sections are full, seats are not oversold; student is prompted with instant waitlist option. No phantom locks remain.

### 3. Normal Flow of Events (Main Success Scenario)
| Step | Actor Action | System Response |
|:---:|:---|:---|
| 1 | Student clicks "Submit Course Registration". | System verifies that the current timestamp is within student's designated registration window (BR-TIME-001). |
| 2 | System checks active server load telemetry. | Traffic is within standard threshold (or student has passed the Virtual Waiting Room queue). |
| 3 | System executes distributed atomic reservation Lua script across all carted sections in Redis: | |
| | - Atomically checks if `remaining_seats > 0` for each section. | |
| | - Decrements `remaining_seats` by 1 (`DECRBY`). | |
| | - Binds `Student_ID` to `Reserved_Seats` set with a 5-minute lease TTL. | Script returns `SUCCESS` for all requested sections in < 45ms. |
| 4 | System dispatches `RegistrationSuccessEvent` to Kafka message queue. | Background persistence worker writes `Enrollment` records to PostgreSQL database within database transaction. |
| 5 | System calculates updated semester tuition fee and appends line items to student invoice. | System renders green celebration modal: "Registration Successful! 5 Course Sections Enrolled." |
| 6 | Student views confirmed official timetable and receives confirmation email with registration receipt. | Use case ends successfully. |

### 4. Alternative Flows
- **4a. System Under Extreme Surge (Virtual Waiting Room Engaged):**
  - *At Step 2:* If system ingress exceeds 3,500 requests/sec:
    1. System redirects student to the Virtual Waiting Room queue.
    2. System issues a cryptographically signed FIFO ticket with estimated wait time (e.g., "Queue Position: #48 - Est. Wait: 8 seconds").
    3. Once student reaches head of queue, system issues a 10-minute pass token and transparently redirects student to Step 3.
- **4b. Target Section Reaches Capacity (Section Full):**
  - *At Step 3:* If Redis atomic script finds `remaining_seats == 0`:
    1. System reserves all other available sections in the cart.
    2. System flags the full section in orange: "Section SE104-02 reached capacity. 0 seats remaining."
    3. System prompts: "Would you like to join the Waitlist (Queue #4) or select an alternate section?"
    4. If student chooses "Join Waitlist", trigger UC-05.
- **4c. Credit Limit Exceeded:**
  - *At Step 1:* If total credits exceed student's allowed limit (e.g., 22 credits without Dean's Overload permission):
    1. System blocks submission and displays: "Exceeds credit limit (Max 20 credits allowed). Please remove 1 course or submit Dean's Overload Appeal."

### 5. Exception Flows
- **5a. Network Disconnection During Submission:**
  - If client disconnects while transaction is processing, the atomic Redis operation either completed or did not execute.
  - Upon reconnection, student portal queries Redis hold state; if reservation succeeded, student sees "Registration Confirmed" without duplicate booking.
- **5b. Temporary Reservation Hold Expires (5-minute TTL):**
  - If student abandons checkout after provisional hold, Redis TTL expires; seats are automatically returned to public inventory without manual administrative intervention.

---

## UC-03: Drop Enrolled Course Section

### 1. Overview
- **Use Case ID:** UC-03
- **Use Case Name:** Drop Enrolled Course Section
- **Primary Actor:** Student
- **Secondary Actors:** Waitlist Engine, Financial Billing Subsystem
- **Description:** Allows an enrolled student to drop a course section within the university add/drop deadline, triggering automated inventory release, waitlist promotion, and tuition adjustment.
- **Trigger:** Student clicks "Drop Section" on their enrolled timetable.

### 2. Preconditions & Postconditions
- **Preconditions:**
  1. Student is actively enrolled in the target section.
  2. Current date is within the university Add/Drop deadline (BR-TIME-002: end of Academic Week 1).
  3. Dropping the course does not violate the minimum credit threshold (10 credits) unless an authorized partial leave is approved.
- **Postconditions (Success):**
  1. Student enrollment record is updated to `DROPPED`.
  2. Section capacity is atomically incremented by 1 in Redis and PostgreSQL.
  3. Waitlist service is notified to promote the next candidate in line.
  4. Tuition balance is recalculated according to the refund schedule (BR-FEE-002).

### 3. Normal Flow of Events (Main Success Scenario)
| Step | Actor Action | System Response |
|:---:|:---|:---|
| 1 | Student clicks "Drop Section" next to an enrolled course. | System prompts confirmation dialog with consequences: "Dropping this section will reduce your semester load to 14 credits. Refund rate: 100%." |
| 2 | Student confirms by typing password or clicking "Confirm Drop". | System validates that post-drop credits >= 10 (minimum load rule BR-CRED-001). |
| 3 | System executes atomic drop transaction: | |
| | - Updates database enrollment record to `DROPPED` with timestamp. | |
| | - Increments Redis section capacity (`INCRBY`). | System returns success confirmation. |
| 4 | System calculates tuition credit refund and updates invoice. | System updates tuition balance. |
| 5 | System triggers asynchronous waitlist promotion event (UC-05). | Top waitlisted student is offered the newly vacated seat. |
| 6 | Student views updated timetable with course removed. | Use case ends. |

### 4. Alternative Flows
- **4a. Drop Violates Minimum Credit Limit (< 10 credits):**
  - *At Step 2:* If dropping drops total credits below 10:
    1. System warns: "Cannot drop: Course drop would leave you with 8 credits (Minimum full-time load is 10 credits)."
    2. System offers: "To drop, you must first register for another course or request an Academic Underload Exception."

---

## UC-04: Atomically Swap Course Sections

### 1. Overview
- **Use Case ID:** UC-04
- **Use Case Name:** Atomically Swap Course Sections
- **Primary Actor:** Student
- **Description:** Allows a student to exchange Section A for Section B of the same course (or exchange two distinct elective courses) in a single atomic transaction, guaranteeing that the original seat is NEVER lost if the target seat cannot be secured.
- **Trigger:** Student selects "Swap Section" on an enrolled course.

### 2. Preconditions & Postconditions
- **Preconditions:**
  1. Student is enrolled in Source Section.
  2. Target Section is different from Source Section.
  3. Swap request occurs within the Add/Drop deadline.
- **Postconditions (Success):**
  1. Student is enrolled in Target Section.
  2. Student is dropped from Source Section.
  3. Zero net seat loss occurred.

### 3. Normal Flow of Events (Main Success Scenario)
| Step | Actor Action | System Response |
|:---:|:---|:---|
| 1 | Student selects "Swap" on enrolled Section 01 of Course X. | System displays alternative available sections of Course X. |
| 2 | Student selects Target Section 02. | System verifies zero time collisions with remaining enrolled schedule. |
| 3 | Student clicks "Execute Atomic Swap". | System executes atomic two-phase Redis Lua transaction: |
| | | - Tries atomic reservation on Target Section 02. |
| | | - If target secured, releases seat on Source Section 01. |
| | | - Commits both changes to database in single transaction. |
| 4 | Transaction succeeds. | System displays: "Swap Successful: Moved to Section 02." |
| 5 | System updates timetable and notifies waitlist for Source Section 01. | Use case ends. |

### 4. Alternative Flows
- **4a. Target Section Becomes Full Before Swap Executes:**
  - *At Step 3:* If Target Section 02 has 0 seats remaining:
    1. System aborts transaction.
    2. System guarantees student retains Source Section 01.
    3. System alerts: "Swap Failed: Target section 02 is now full. Your original enrollment in Section 01 is preserved."

---

## UC-05: Join Waitlist & Receive Auto-Promotion

### 1. Overview
- **Use Case ID:** UC-05
- **Use Case Name:** Join Waitlist & Receive Auto-Promotion
- **Primary Actor:** Student
- **Secondary Actors:** Background Notification Daemon
- **Description:** When a section reaches capacity, allows students to join a FIFO waitlist. When a seat is vacated, the system automatically reserves the seat for the top waitlisted student and grants a 12-hour confirmation window.
- **Trigger:** Student clicks "Join Waitlist" on a full section.

### 2. Preconditions & Postconditions
- **Preconditions:**
  1. Section is at 100% capacity.
  2. Waitlist cap (maximum 10 students or 25% of section capacity) is not exceeded.
  3. Student is not already enrolled or waitlisted for another section of the same course.
- **Postconditions (Success):**
  1. Student is assigned a deterministic waitlist position `#N`.
  2. Upon seat vacancy, student receives high-priority notification with 12-hour reservation hold.

### 3. Normal Flow of Events (Main Success Scenario)
| Step | Actor Action | System Response |
|:---:|:---|:---|
| 1 | Student clicks "Join Waitlist" on full Section 01. | System checks student eligibility (prerequisites met, no duplicate waitlists). |
| 2 | System verifies waitlist queue has space. | System pushes `Student_ID` to Redis sorted set / FIFO queue for this section. |
| 3 | System assigns waitlist position (e.g., Position #2). | System displays confirmation badge and adds course to "Waitlisted Courses" card. |
| 4 | *(Later Event)* Another student drops their seat in Section 01. | System triggers waitlist promotion daemon. |
| 5 | System pops top waitlist student (Position #1). | System places a 12-hour temporary hold on the vacated seat for this student. |
| 6 | System dispatches multi-channel notification (SMS, Push, Email). | Message: "Seat available in Section 01! You have 12 hours (until 21:00) to claim your seat." |
| 7 | Student clicks "Accept Seat" within 12 hours. | System confirms enrollment and moves student to `ENROLLED` status. |

### 4. Alternative Flows
- **4a. Student Declines Seat or 12-Hour Timer Expires:**
  - *At Step 7:* If student clicks "Decline" or timer reaches 00:00:00:
    1. System cancels the reservation hold.
    2. System removes student from waitlist.
    3. System automatically evaluates the next student in the FIFO queue (Step 5).

---

## UC-06: Calculate and Settle Tuition Fees Online

### 1. Overview
- **Use Case ID:** UC-06
- **Use Case Name:** Calculate and Settle Tuition Fees Online
- **Primary Actor:** Student
- **Secondary Actors:** VNPay / VietQR Banking Gateway, University Bursar Office
- **Description:** Calculates semester tuition based on registered credit hours and applicable laboratory fees, displays dynamic QR code, and reconciles electronic payments in real time.
- **Trigger:** Student navigates to the "Tuition & Payment" tab.

### 2. Normal Flow of Events
| Step | Actor Action | System Response |
|:---:|:---|:---|
| 1 | Student opens "Tuition Summary". | System queries registered course list and applies tuition formula: `Sum(Credits * 520,000 VND) + Lab Fees - Scholarships`. |
| 2 | Student clicks "Pay with VietQR / VNPay". | System requests a unique transaction reference from the payment gateway and generates a dynamic VietQR code on screen. |
| 3 | Student scans QR code using any banking mobile app (Vietcombank, MB, Techcombank, Momo) and authorizes transfer. | Bank processes payment and dispatches instantaneous webhook callback to UniPulse API. |
| 4 | UniPulse webhook receiver validates HMAC-SHA512 cryptographic signature. | System marks invoice status as `PAID`, records transaction reference, and unlocks full enrollment confirmation. |
| 5 | Student portal screen auto-refreshes via WebSocket. | Displays green checkmark: "Tuition Payment Confirmed. E-Invoice #INV-2026-9481 issued." |

---

## UC-07: Review Section Viability & Approve Merges/Cancellations

### 1. Overview
- **Use Case ID:** UC-07
- **Use Case Name:** Review Section Viability & Approve Merges/Cancellations
- **Primary Actor:** Academic Registrar Staff (Phòng Đào tạo)
- **Secondary Actors:** Department Chair
- **Description:** Enables academic staff to monitor live enrollment fill rates, identify under-enrolled sections (< 15 students) 3 days prior to semester start, and execute automated section merges or cancellations with zero schedule disruption for students.
- **Trigger:** Registrar views the "Academic Operations" dashboard after registration Day 4.

### 2. Normal Flow of Events
| Step | Actor Action | System Response |
|:---:|:---|:---|
| 1 | Registrar filters course sections by status: "Under-enrolled (< 15 students)". | System displays table of 12 sections failing minimum enrollment threshold (BR-CAP-002). |
| 2 | Registrar selects Section CS101-04 (Enrollment: 9/35). | System runs automated conflict-checker against Section CS101-02 (Enrollment: 18/35). |
| 3 | System confirms Section CS101-02 has 17 available seats and 0 schedule conflicts for the 9 students. | System presents one-click option: "Merge Section 04 into Section 02". |
| 4 | Registrar clicks "Execute Section Merge". | System atomically migrates 9 students into Section 02, marks Section 04 as `CANCELLED_MERGED`, and dispatches personalized schedule update emails to all affected students. |
| 5 | Registrar marks review complete. | Operational dashboard reflects updated healthy section statistics. |

---

## UC-08: Process Prerequisite Override Appeal

### 1. Overview
- **Use Case ID:** UC-08
- **Use Case Name:** Process Prerequisite Override Appeal
- **Primary Actor:** Academic Advisor
- **Secondary Actors:** Student, Dean of Academic Affairs
- **Description:** Allows an Academic Advisor or Dean to grant a documented, audited exception for a student to register for a course despite missing a formal prerequisite (e.g., student transferring credits from another university or taking an equivalent MOOC).
- **Trigger:** Advisor opens pending student prerequisite override tickets.

### 2. Normal Flow of Events
| Step | Actor Action | System Response |
|:---:|:---|:---|
| 1 | Advisor selects pending appeal from Student SE180123 for course SWR302. | System displays student transcript, GPA, submitted transfer credit documents, and advisor notes. |
| 2 | Advisor verifies equivalent coursework and clicks "Approve Override". | System prompts for mandatory academic justification note (min 20 characters). |
| 3 | Advisor enters justification: "Equivalent credit transferred from National University; syllabus verified." | System writes immutable record to `Audit_Log` and sets prerequisite flag for Student+Course to `OVERRIDDEN`. |
| 4 | System immediately unlocks course registration capability for the student. | Student receives notification: "Prerequisite Override Approved for SWR302. You may now register." |

---
*End of Detailed Use Case Specifications - UniPulse Platform*
