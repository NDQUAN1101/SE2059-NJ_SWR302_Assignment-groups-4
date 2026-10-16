# Software Requirements Specification (SRS)
## UniPulse: Next-Generation Campus Academic & Intelligent Registration Platform
**Document Version:** 1.0 Baseline  
**Course:** SWR302 - Software Requirements Engineering  
**Class:** SE2059-NJ | **Team:** Assignment Group 4  
**Authoring Standard:** IEEE Std 830-1998 / ISO/IEC/IEEE 29148:2018  
**Pedagogical Guidance:** Karl E. Wiegers & Joy Beatty (*Software Requirements*, 3rd Edition, Chapter 10)  
**Date:** Fall Semester 2026  

---

## Table of Contents
1. [Introduction](#1-introduction)
   - 1.1 Purpose
   - 1.2 Document Conventions
   - 1.3 Intended Audience and Reading Suggestions
   - 1.4 Project Scope
   - 1.5 References
2. [Overall Description](#2-overall-description)
   - 2.1 Product Perspective
   - 2.2 Product Functions
   - 2.3 User Classes and Characteristics
   - 2.4 Operating Environment
   - 2.5 Design and Implementation Constraints
   - 2.6 User Documentation
   - 2.7 Assumptions and Dependencies
3. [System Features & Functional Requirements](#3-system-features--functional-requirements)
   - 3.1 Course Catalog & Curriculum Explorer (FR-CAT)
   - 3.2 Prerequisite & Degree Audit Engine (FR-PRE)
   - 3.3 Visual Timetable Planner & Conflict Detector (FR-SCH)
   - 3.4 High-Performance Course Registration Engine (FR-REG)
   - 3.5 Course Drop, Add & Section Swap (FR-SWP)
   - 3.6 Automated Waitlist & Promotion Engine (FR-WTL)
   - 3.7 Tuition Calculation & Payment Settlement (FR-FIN)
   - 3.8 Academic Operations & Capacity Management (FR-OPS)
4. [External Interface Requirements](#4-external-interface-requirements)
   - 4.1 User Interfaces (UI)
   - 4.2 Hardware Interfaces
   - 4.3 Software Interfaces
   - 4.4 Communications Interfaces
5. [Non-Functional Requirements & Quality Attributes](#5-non-functional-requirements--quality-attributes)
   - 5.1 Performance & High-Concurrency Specification (Crucial Focus)
   - 5.2 Availability & Reliability
   - 5.3 Security & Data Protection
   - 5.4 Usability & Accessibility
   - 5.5 Maintainability & Scalability
6. [Other Requirements & Appendices](#6-other-requirements--appendices)
   - Appendix A: Glossary & Terminology
   - Appendix B: Analysis Models Cross-Reference

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) establishes a complete, unambiguous, and verifiable specification for the **UniPulse Campus Academic & Intelligent Registration Platform**. It details the functional and non-functional requirements for the core system, providing the definitive contract between stakeholders, academic authorities, software engineers, and test automation teams for Class SE2059-NJ, Group 4.

### 1.2 Document Conventions
- **Requirement Identifiers:** Every functional requirement is designated with a unique hierarchical ID following the pattern: `FR-[SUB-SYSTEM]-[NUMBER]` (e.g., `FR-REG-001`).
- **Priority Designations:** Priorities are assigned based on the MoSCoW framework:
  - **[M]** = Must Have (Mandatory for system go-live).
  - **[S]** = Should Have (Highly desired; essential for optimal operation).
  - **[C]** = Could Have (Desirable enhancement if time and resources permit).
  - **[W]** = Won't Have (Deferred to future major releases).
- **Standards:** Formatted in strict compliance with Karl Wiegers' requirements engineering best practices, specifying inputs, processing, outputs, and validation rules.

### 1.3 Intended Audience and Reading Suggestions
- **Academic Lecturers & Evaluators:** Review Chapter 3 (System Features), Chapter 5.1 (Concurrency Architecture), and the Business Rules catalog to assess requirements completeness, logical rigor, and technical depth.
- **Software Developers & Architects:** Focus on Chapter 3 (Functional Requirements), Chapter 4 (External Interfaces), and Chapter 5 (Quality Attributes).
- **Quality Assurance & Testers:** Utilize Section 3 and Section 5 to construct boundary value analysis test suites, concurrency stress tests, and traceability matrices.
- **Registrar Staff & Business Analysts:** Review Section 2.3 (User Classes), Section 3.8 (Academic Operations), and the Business Rules.

### 1.4 Project Scope
UniPulse replaces the legacy monolithic university academic portal (e.g., FAP/EduSoft). The platform encompasses student academic planning, real-time course registration under peak concurrency, waitlist automation, prerequisite verification, tuition calculation, and registrar capacity balancing. It explicitly excludes student dorm housing, campus parking, and proctored examination software.

### 1.5 References
1. Wiegers, K., & Beatty, J. (2013). *Software Requirements (3rd Edition)*. Microsoft Press.
2. IEEE Std 830-1998: *IEEE Recommended Practice for Software Requirements Specifications*.
3. ISO/IEC/IEEE 29148:2018: *Systems and software engineering — Life cycle processes — Requirements engineering*.
4. FPT University Academic Regulations & Credit-Based Degree Guidelines (Quy chế Đào tạo Đại học theo hệ thống Tín chỉ).

---

## 2. Overall Description

### 2.1 Product Perspective
UniPulse is a modern cloud-native academic information system operating within the university's enterprise IT ecosystem. It connects directly with the University Identity Provider (SSO), Banking/Payment Gateways, Learning Management System (LMS), and SMS/Email Notification Services.

```
       +--------------------------------------------------------------+
       |                  UniPulse Client Web App                    |
       |  (Student Portal / Faculty Portal / Registrar Admin Console) |
       +------------------------------+-------------------------------+
                                      | HTTPS / WSS
                                      v
       +--------------------------------------------------------------+
       |               Cloudflare CDN / Turnstile / WAF               |
       +------------------------------+-------------------------------+
                                      |
                                      v
       +--------------------------------------------------------------+
       |                 API Gateway & Virtual Queue                  |
       +--------------+-------------------------------+---------------+
                      |                               |
                      v                               v
       +------------------------------+ +-----------------------------+
       | High-Throughput In-Memory    | |  Core Academic Services     |
       | Registration Engine (Redis)  | |  (Prerequisite, Degree,     |
       | - Atomic Lua Seat Locks      | |   Timetable, Invoicing)     |
       +--------------+---------------+ +--------------+--------------+
                      |                                |
                      +---------------+----------------+
                                      |
                                      v
       +--------------------------------------------------------------+
       |       Distributed Message Queue (Kafka / RabbitMQ)           |
       +------------------------------+-------------------------------+
                                      |
                                      v
       +--------------------------------------------------------------+
       |    Relational Database Primary & Read Replicas (PostgreSQL)  |
       +--------------------------------------------------------------+
```

### 2.2 Product Functions
- **Curriculum & Prerequisite Graph Exploration:** Dynamic search of course catalogs, prerequisites, co-requisites, syllabi, and credit values.
- **Interactive Timetable Construction:** Visual weekly matrix with real-time clash warning and alternative section suggestions.
- **High-Concurrency Instant Registration:** Atomically locks seats in sub-second timeframes with zero overselling.
- **Automated Waitlist Promotion:** FIFO waiting queue with timed seat reservation acceptance alerts.
- **Degree Audit & Graduation Tracker:** Real-time visual progress tree showing completed, in-progress, and outstanding degree requirements.
- **Tuition & Payment Integration:** Dynamic tuition computation, scholarship adjustment, and instant VietQR/VNPay settlement.
- **Registrar Operations Dashboard:** Real-time traffic analytics, low-enrollment warnings (<15 students), and one-click section adjustment tools.

### 2.3 User Classes and Characteristics

| User Class | Description & Characteristics | Technical Acuity | Frequency of Use |
|:---|:---|:---:|:---:|
| **Student (Undergraduate/Postgraduate)** | Primary beneficiary; enrolls in courses, views grades, monitors degree progress, pays fees. Expects instantaneous feedback on mobile/desktop. | High (Digital natives) | Intermittent: Extreme spikes during registration week; weekly during semester. |
| **Academic Registrar (Phòng Đào tạo)** | Institutional power users; manages course sections, room allocation, instructor assignment, capacity overrides, and enrollment approvals. | Medium to High | Daily operational use. |
| **Department Chair / Dean** | Academic executive; reviews curriculum demand, approves new sections, monitors departmental fill rates and faculty teaching loads. | Medium | Weekly / Seasonal. |
| **Faculty Lecturer** | Academic instructor; views student rosters, tracks course enrollment statistics, submits grades, flags student attendance. | Medium | Weekly during teaching semesters. |
| **Bursar / Finance Officer** | Financial operator; reviews tuition collection totals, reconciles bank gateway transactions, processes fee waivers and refunds. | Medium to High | Daily during payment collection windows. |
| **System Administrator (DevOps/SRE)** | Technical custodian; monitors server latency, manages database replicas, configures Redis clusters, oversees security logs. | Expert | Continuous (24/7/365). |

### 2.4 Operating Environment
- **Client Side:** Modern HTML5/CSS3/ES6 web browsers (Google Chrome >= 115, Microsoft Edge >= 115, Apple Safari >= 16, Mozilla Firefox >= 115) across desktop, tablet, and mobile viewport resolutions (320px to 3840px).
- **Server Side:** Enterprise Java Platform: Java 17 LTS / Java 21, Spring Boot 3.x (Spring WebFlux for reactive non-blocking concurrency, Spring Data JPA / Hibernate, Redisson distributed locking engine), Spring Security with OIDC/OAuth2 SSO; PostgreSQL 16.x with HikariCP connection pooling; Apache Kafka event streaming.
- **Network Requirements:** Standard Internet connection; client interface optimized for low-bandwidth 3G/4G cellular connections (initial bundle payload < 350 KB gzipped).

### 2.5 Design and Implementation Constraints
- **CON-1 (Authentication):** The system MUST integrate exclusively with the university's central Single Sign-On (Google Workspace OAuth2 / Microsoft Entra ID). No separate local password stores are permitted for student/faculty accounts.
- **CON-2 (Zero Overselling Guarantee):** The database and memory cache MUST enforce transactional isolation preventing any course section from exceeding its declared maximum capacity under any concurrent load scenario.
- **CON-3 (Regulatory Compliance):** The platform MUST comply with Vietnam Education Law and MOET Higher Education credit-system guidelines, including strict audit logging of all grade and enrollment changes.
- **CON-4 (Payment Gateway Standards):** Online transactions MUST adhere to SBV (State Bank of Vietnam) circulars and PCI-DSS compliance via licensed intermediaries (VNPay, Napas, Momo).

### 2.6 User Documentation
- Interactive on-screen onboarding walkthrough for first-time students.
- Context-sensitive help tooltips explaining prerequisite blocks, corequisites, and registration errors.
- Comprehensive Administrator & Registrar Operations Manual (PDF and searchable web knowledge base).
- RESTful OpenAPI / Swagger documentation for all backend endpoints.

### 2.7 Assumptions and Dependencies
- **AS-1:** University student and faculty records are pre-populated and synchronized from the central University ERP.
- **DE-1:** External banking payment gateways (VNPay/VietQR) maintain an availability SLA >= 99.9%.
- **DE-2:** University campus Wi-Fi infrastructure provides sufficient ingress bandwidth during on-campus registration phases.

---

## 3. System Features & Functional Requirements

### 3.1 Course Catalog & Curriculum Explorer (FR-CAT)
*Description:* Enables students and staff to browse, search, and inspect courses, academic syllabi, prerequisites, and historical grade distributions.

- **FR-CAT-001 [M]: Course Search & Filtering**
  - *Input:* Keywords (course code, course title, instructor name, department, credit count, delivery mode).
  - *Processing:* Perform indexed, full-text sub-string search returning matched active courses within 100ms.
  - *Output:* Paginated list of courses displaying course code, title, credits, department, and prerequisite overview.
- **FR-CAT-002 [M]: Prerequisite Chain Visualization**
  - *Input:* Course selection by user.
  - *Processing:* Traverse the curriculum graph to retrieve direct prerequisites, co-requisites, and subsequent dependent courses.
  - *Output:* Interactive visual node graph displaying the course's position in the degree curriculum.
- **FR-CAT-003 [S]: Section Availability Inspection**
  - *Input:* Course selection and active semester.
  - *Processing:* Query current capacity, active enrollments, and waitlist counts across all scheduled sections.
  - *Output:* List of available sections showing section code, instructor, time slot, classroom, available seats, and waitlist depth.

### 3.2 Prerequisite & Degree Audit Engine (FR-PRE)
*Description:* Evaluates academic eligibility before permitting student enrollment into any course section.

- **FR-PRE-001 [M]: Automated Prerequisite Graph Evaluation**
  - *Input:* Student ID, Target Course Code.
  - *Processing:* System queries student's historical transcript. System checks whether all prerequisite courses have been completed with a passing grade (Grade >= 5.0 on a 10.0 scale, or Grade != 'F').
  - *Output:* Eligibility status: `ELIGIBLE` or `INELIGIBLE` accompanied by specific missing prerequisite codes.
- **FR-PRE-002 [M]: Co-Requisite Validation**
  - *Input:* Student ID, Target Course Section.
  - *Processing:* If Course X requires Course Y as a co-requisite, verify that Course Y is either already passed or present in the student's current registration cart.
  - *Output:* `VALID` or `BLOCKED` with message: "Must enroll in co-requisite course Y concurrently."
- **FR-PRE-003 [M]: Degree Audit Progress Calculation**
  - *Input:* Student ID.
  - *Processing:* Map student's earned credits against major graduation requirements across 4 categories: General Education, Major Core, Major Electives, and Graduation Thesis/OJT.
  - *Output:* Percentage completion rate, completed credit count, outstanding credit count, and interactive checklist of unmet requirements.
- **FR-PRE-004 [S]: Administrative Prerequisite Override**
  - *Input:* Student ID, Course Code, Approving Advisor ID, Justification text.
  - *Processing:* Verify advisor authorization; record immutable audit log; mark prerequisite as `OVERRIDDEN_BY_STAFF`.
  - *Output:* Confirmation ticket and immediate unlocking of course registration for the student.

### 3.3 Visual Timetable Planner & Conflict Detector (FR-SCH)
*Description:* Provides an interactive weekly schedule matrix where students drag-and-drop or select sections, with instantaneous schedule collision detection.

- **FR-SCH-001 [M]: Interactive Weekly Grid Display**
  - *Input:* Student ID or selected tentative section list.
  - *Processing:* Render a 7-day grid (Monday to Sunday) partitioned into standard university time slots (Slot 1 to Slot 6: 07:30 to 21:00).
  - *Output:* Color-coded calendar blocks displaying course code, section, room number, and lecturer name.
- **FR-SCH-002 [M]: Real-Time Time Clash Detection**
  - *Input:* Tentative section selection.
  - *Processing:* Compare start time, end time, and day-of-week against all currently enrolled or carted sections.
  - *Output:* If collision occurs, system highlights conflicting time blocks in red, displays immediate warning modal, and prevents simultaneous enrollment.
- **FR-SCH-003 [S]: Physical Travel Buffer Validation**
  - *Input:* Consecutive class selections on the same calendar day.
  - *Processing:* Check if classes are scheduled in physically distinct campus buildings with less than a 15-minute inter-class buffer.
  - *Output:* Display yellow informational warning: "Tight transfer time between Building Alpha and Building Gamma."
- **FR-SCH-004 [S]: Timetable Export Service**
  - *Input:* User request to export schedule.
  - *Processing:* Generate standard `.ics` (iCalendar) feed compatible with Google Calendar, Apple Calendar, and Microsoft Outlook.
  - *Output:* Downloadable `.ics` file and calendar subscription URL.

### 3.4 High-Performance Course Registration Engine (FR-REG)
*Description:* The mission-critical distributed registration subsystem handling extreme concurrent booking transactions.

- **FR-REG-001 [M]: Staggered Registration Window Enforcement**
  - *Input:* Student ID, Current System Timestamp.
  - *Processing:* Check student cohort (e.g., Year 4 Senior vs. Year 1 Freshman) and registration appointment window.
  - *Output:* Grant access to registration actions if window is active; otherwise render countdown timer until student's permitted window opens.
- **FR-REG-002 [M]: Virtual Waiting Room & Token Generation**
  - *Input:* Incoming registration HTTP request during surge periods.
  - *Processing:* If system ingress exceeds 3,500 requests/second, route student into Virtual Waiting Room; issue cryptographically signed FIFO queue ticket with estimated wait time.
  - *Output:* Real-time queue progress indicator screen with dynamic position updates via WebSocket.
- **FR-REG-003 [M]: Atomic In-Memory Seat Reservation (Lua Scripting)**
  - *Input:* Student ID, Section ID.
  - *Processing:* Execute single atomic Redis Lua script:
    1. Check if Section key exists.
    2. Check if remaining capacity > 0.
    3. If yes, decrement remaining capacity by 1 (`DECRBY`); push Student ID to `Section_Reservations` set; set 5-minute reservation TTL.
    4. If capacity == 0, return `OUT_OF_STOCK`.
  - *Output:* Reservation success with 5-minute hold token, or `SECTION_FULL` notice.
- **FR-REG-004 [M]: Credit Limit Boundary Enforcement**
  - *Input:* Student ID, Total Credits in Cart + New Section Credits.
  - *Processing:* Validate that total semester credits satisfy: `10 <= Total Credits <= 20` (or `<= 24` if student has approved Dean's Overload permission).
  - *Output:* Allow reservation if within bounds; block and display error if exceeding maximum or below minimum limit.
- **FR-REG-005 [M]: Asynchronous Enrollment Confirmation & Persistence**
  - *Input:* Confirmed reservation token from student.
  - *Processing:* Publish `EnrollmentConfirmedEvent` to message broker (Kafka/RabbitMQ); background worker persists record to PostgreSQL with optimistic lock validation; deducts tuition balance.
  - *Output:* Final confirmed enrollment receipt with cryptographic confirmation hash sent via UI toast and email.

### 3.5 Course Drop, Add & Section Swap (FR-SWP)
*Description:* Handles mid-registration modifications, section exchanges, and course drops within regulatory deadlines.

- **FR-SWP-001 [M]: Direct Course Drop Execution**
  - *Input:* Student ID, Enrolled Section ID.
  - *Processing:* Verify current date is within the official Add/Drop period (Week 1 of semester). If valid, remove enrollment record; increment available section capacity in Redis and PostgreSQL; trigger refund calculation; notify waitlist manager.
  - *Output:* Updated schedule and confirmation message: "Course successfully dropped."
- **FR-SWP-002 [M]: Atomic Section Swap (No Risk of Seat Loss)**
  - *Input:* Student ID, Current Section ID, Target Section ID.
  - *Processing:* Perform atomic two-phase transaction:
    1. Attempt reservation on Target Section.
    2. If successful, release Current Section and confirm Target Section.
    3. If Target Section reservation fails, retain Current Section without dropping.
  - *Output:* "Swap successful" or "Target section full; original schedule preserved intact."

### 3.6 Automated Waitlist & Promotion Engine (FR-WTL)
*Description:* Manages overflow demand when course sections reach maximum capacity.

- **FR-WTL-001 [M]: Waitlist Enrollment Option**
  - *Input:* Student ID, Full Section ID.
  - *Processing:* If Section capacity is full and Waitlist count < 25% of class capacity, permit student to join waitlist; assign sequential FIFO queue number.
  - *Output:* Waitlist confirmation ticket displaying: "You are #3 on the waitlist for SE104-Class 02."
- **FR-WTL-002 [M]: Automated Seat Promotion Trigger**
  - *Input:* Seat vacated event (due to drop or capacity increase).
  - *Processing:* System queries highest-priority waitlisted student; assigns temporary 12-hour reservation hold; dispatches high-priority push notification and email.
  - *Output:* Notification to student with 12-hour countdown action link to accept or decline.
- **FR-WTL-003 [M]: Waitlist Hold Expiry Automation**
  - *Input:* System cron trigger every 60 seconds.
  - *Processing:* If student fails to accept within 12 hours, revoke hold; promote next student in FIFO queue.
  - *Output:* Log hold expiration; advance waitlist queue.

### 3.7 Tuition Calculation & Payment Settlement (FR-FIN)
*Description:* Computes semester tuition fees, applies scholarship waivers, and processes electronic payment.

- **FR-FIN-001 [M]: Dynamic Tuition Assessment**
  - *Input:* Student ID, Enrolled Course Sections.
  - *Processing:* Calculate total fees: `Sum(Course Credits * Base Credit Rate) + Lab Fees - Scholarship Discount`.
  - *Output:* Itemized tuition invoice showing course breakdown, due date, and payment status (`UNPAID`, `PARTIAL`, `PAID`).
- **FR-FIN-002 [M]: Dynamic VietQR / VNPay Payment Generation**
  - *Input:* Student initiates payment.
  - *Processing:* Generate dynamic VietQR code incorporating bank account, exact payable amount, and transaction invoice reference code.
  - *Output:* Visual QR code display and redirection option to VNPay / Momo banking app.
- **FR-FIN-003 [M]: Instant Payment Webhook Reconciliation**
  - *Input:* Secure payment gateway webhook callback.
  - *Processing:* Validate HMAC-SHA512 digital signature; match invoice reference; update tuition status to `PAID`; unlock final official enrollment status.
  - *Output:* Instant real-time UI confirmation and digital electronic invoice (E-Invoice) receipt.

### 3.8 Academic Operations & Capacity Management (FR-OPS)
*Description:* Administrative capabilities for Registrar staff and Department Chairs to manage university-wide enrollment health.

- **FR-OPS-001 [M]: Real-Time Enrollment Telemetry Heatmap**
  - *Input:* Registrar views operational console.
  - *Processing:* Aggregate live registration counts across all departments, courses, and time slots.
  - *Output:* Color-coded heatmap (Green = Healthy, Yellow = Near Full, Red = 100% Full with Waitlist, Blue = Under-enrolled <15 students).
- **FR-OPS-002 [M]: Under-Enrolled Section Alert & Merge Tool**
  - *Input:* Sections with enrollment < 15 students after registration Day 4.
  - *Processing:* Flag under-enrolled sections; provide recommendation engine to merge compatible sections without schedule clashes for enrolled students.
  - *Output:* One-click administrative proposal to merge Section A into Section B with automated student notification.
- **FR-OPS-003 [M]: Emergency Capacity Expansion Override**
  - *Input:* Section ID, New Capacity, Authorizing Officer ID.
  - *Processing:* Validate classroom physical seat limit; update section maximum capacity in database and Redis; auto-trigger promotion of top waitlisted students.
  - *Output:* Capacity updated; automated promotion batch initiated.

---

## 4. External Interface Requirements

### 4.1 User Interfaces (UI)
- **Visual Design Standard:** Premium modern campus design utilizing high-contrast typography (Inter / Outfit font family), dark/light mode toggle, clean card-based layouts, and glassmorphic modal overlays.
- **Responsiveness:** Dynamic responsive breakpoint scaling for Mobile (360px - 767px), Tablet (768px - 1023px), and Desktop (1024px - 1920px+).
- **Accessibility:** Full compliance with W3C Web Content Accessibility Guidelines (WCAG 2.1 Level AA), including ARIA tags, keyboard tab navigation, and screen reader labels.

### 4.2 Hardware Interfaces
- No direct specialized client hardware required. The system interfaces standard personal computing hardware, smartphone biometric sensors (FaceID/TouchID via WebAuthn for quick student login), and barcode/QR scanners for campus kiosk integration.

### 4.3 Software Interfaces
- **SI-1 (Identity Management):** University Single Sign-On via OpenID Connect (OIDC) / OAuth 2.0 (Google Workspace for Education / Microsoft Entra ID).
- **SI-2 (Payment Gateway):** VNPay / VietQR Open Banking API over HTTPS with HMAC-SHA512 cryptographic verification.
- **SI-3 (Learning Management System - LMS):** REST API / LTI 1.3 protocol synchronizing final course rosters to Canvas/Moodle 24 hours prior to semester start.
- **SI-4 (Notification Service):** Integration with Twilio/Firebase Cloud Messaging (FCM) and SendGrid for real-time transactional SMS, push, and email notifications.

### 4.4 Communications Interfaces
- **CI-1 (Secure Transport):** All external and inter-service communications MUST be encrypted in transit via HTTPS / TLS 1.3.
- **CI-2 (Real-Time Push):** WebSockets (WSS) protocol utilized for real-time live seat inventory broadcasts, waiting room queue countdowns, and instant payment confirmations.
- **CI-3 (Inter-Service RPC):** Internal microservices communicate via high-performance binary gRPC over HTTP/2.

---

## 5. Non-Functional Requirements & Quality Attributes

### 5.1 Performance & High-Concurrency Specification (Crucial Evaluation Focus)
*Note for Course Evaluators: This section specifically addresses the lecturer's scrutiny regarding how the team resolves portal crashes and race conditions during high-concurrency registration rushes.*

- **NFR-PERF-001 (Peak Concurrency Capacity):** The system MUST sustain **25,000 active concurrent user sessions** during the initial 30-minute surge of a course registration cycle without service failure.
- **NFR-PERF-002 (Transaction Throughput):** The distributed reservation engine MUST process a sustained throughput of **>= 3,500 course registration requests per second**.
- **NFR-PERF-003 (Sub-Second Latency):**
  - **P90 Latency:** <= 400 milliseconds.
  - **P95 Latency:** <= 800 milliseconds.
  - **P99 Latency:** <= 1,500 milliseconds under full synthetic benchmark load.
- **NFR-PERF-004 (Zero-Overselling Concurrency Guarantee):** Under no circumstance shall any class section admit more students than its configured maximum capacity. The system guarantees exact-once atomic seat allocation using Redis distributed Lua scripts executing in a single thread per Redis partition.
- **NFR-PERF-005 (Traffic Shaper & Queue Protection):** When incoming HTTP request volume exceeds server cluster processing capacity, the Virtual Waiting Room MUST automatically engage, buffering excess requests in a prioritized FIFO queue without dropping connections or returning HTTP 500/502/504 errors.

### 5.2 Availability & Reliability
- **NFR-AVAIL-001 (High Availability):** System uptime MUST equal or exceed **99.99%** throughout the designated 14-day university registration and add/drop period (maximum allowable unplanned downtime: < 2.0 minutes).
- **NFR-REL-002 (Data Consistency & Recovery):** Recovery Point Objective (RPO) = **0 seconds** (zero lost confirmed registration records). Recovery Time Objective (RTO) <= **5 minutes** utilizing automated multi-region database failover.

### 5.3 Security & Data Protection
- **NFR-SEC-001 (Anti-Bot & Scripting Defense):** All registration submissions MUST validate a dynamic cryptographic token (nonce) generated per session, supplemented by Cloudflare Turnstile invisible CAPTCHA to block automated registration bots and macro scripts.
- **NFR-SEC-002 (Role-Based Access Control - RBAC):** Strict least-privilege role separation enforced across Student, Lecturer, Academic Staff, Registrar Admin, and Financial Officer roles.
- **NFR-SEC-003 (Encryption at Rest and in Transit):** Student transcripts, grades, and personal identifying information (PII) MUST be encrypted at rest using AES-256 and in transit using TLS 1.3.
- **NFR-SEC-004 (Immutable Audit Logging):** Every administrative override, grade modification, capacity change, and manual enrollment MUST be recorded in an append-only, tamper-evident audit table containing Actor ID, Timestamp, IP Address, Previous Value, and New Value.

### 5.4 Usability & Accessibility
- **NFR-USE-001 (Learnability):** A first-year undergraduate student MUST be capable of planning a conflict-free schedule and completing registration in under **5 minutes** without requiring prior technical instruction.
- **NFR-USE-002 (Error Prevention & Clarity):** When a registration action is rejected (e.g., prerequisite missing or time clash), the interface MUST provide a clear, plain-language explanation identifying the exact conflict and suggesting one-click remediation.

### 5.5 Maintainability & Scalability
- **NFR-MAINT-001 (Modular Decoupling):** Core business rule validators (Prerequisites, Credit Limits, Capacities) MUST be implemented as decoupled domain rule modules to allow rule modifications without recompiling the core transactional engine.
- **NFR-SCALE-002 (Horizontal Auto-Scaling):** Application container pods MUST automatically scale out based on CPU/Memory thresholds (scaling trigger at 70% CPU utilization within 60 seconds).

---

## 6. Other Requirements & Appendices

### Appendix A: Glossary & Terminology
- **FAP (Fast Academic Portal):** The legacy university student academic portal.
- **Prerequisite (Môn tiên quyết):** A course that a student must have successfully completed with a passing grade before being permitted to enroll in an advanced course.
- **Co-requisite (Môn song hành):** A course that must be taken concurrently with or prior to another course (e.g., Physics Lecture and Physics Laboratory).
- **Degree Audit:** An automated evaluation of a student's academic history against established curriculum requirements for their degree program.
- **Race Condition:** A software flaw where multiple threads or requests compete to modify the same resource (e.g., last seat in a class) simultaneously, potentially causing data corruption.
- **Atomic Operation:** An indivisible operation that either completes entirely or has no effect at all, preventing partial or inconsistent states.
- **Virtual Waiting Room:** An architectural traffic-shaping layer that holds users in a virtual queue during traffic spikes, admitting them to the application at a controlled, sustainable rate.

### Appendix B: Analysis Models Cross-Reference
All analytical UML diagrams (Use Case Diagram, Activity Flow for High-Concurrency Registration, Sequence Diagrams, State Transition Diagrams, and ERD) are specified in full visual detail in [`06_Analysis_Models.md`](file:///d:/SWR302/SE2059-NJ_SWR302_Assignment%20groups%204/06_Analysis_Models.md).

---
*End of Software Requirements Specification - UniPulse Platform*
