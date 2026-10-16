# Analysis Models
## UniPulse: Next-Generation Campus Academic & Intelligent Registration Platform
**Course:** SWR302 - Software Requirements Engineering  
**Class:** SE2059-NJ | **Team:** Assignment Group 4  
**Pedagogical Guidance:** Karl E. Wiegers & Joy Beatty (*Software Requirements*, 3rd Edition, Chapter 12: *A Picture Is Worth 1024 Words*)  
**Modeling Standard:** Unified Modeling Language (UML 2.5) Diagrams rendered in Mermaid  

---

## Table of Models
1. [System Context Diagram & Boundary](#1-system-context-diagram--boundary)
2. [Comprehensive Use Case Diagram](#2-comprehensive-use-case-diagram)
3. [High-Concurrency Registration Activity Diagram](#3-high-concurrency-registration-activity-diagram)
4. [End-to-End Registration & Seat Hold Sequence Diagram](#4-end-to-end-registration--seat-hold-sequence-diagram)
5. [Class Section Lifecycle State Machine Diagram](#5-class-section-lifecycle-state-machine-diagram)
6. [Enrollment Record State Machine Diagram](#6-enrollment-record-state-machine-diagram)
7. [Domain Model Class Diagram](#7-domain-model-class-diagram)

---

## 1. System Context Diagram & Boundary

The Context Diagram defines the operational boundary of the UniPulse platform and its interactions with external human actors and external software systems.

```mermaid
flowchart TB
    subgraph External_Actors ["Human Stakeholders"]
        Student["fa:fa-user-graduate Student"]
        Registrar["fa:fa-user-tie Academic Registrar"]
        Advisor["fa:fa-chalkboard-teacher Academic Advisor"]
        Faculty["fa:fa-user Lecturer"]
        Finance["fa:fa-coins Bursar / Finance"]
    end

    subgraph System_Boundary ["UniPulse Core System Boundary"]
        UniPulseCore["fa:fa-server UniPulse Academic Operations & Registration Platform"]
    end

    subgraph External_Systems ["External Enterprise Services"]
        SSO["fa:fa-key University SSO / Google Workspace (OIDC)"]
        BankGateway["fa:fa-credit-card VietQR / VNPay Payment Gateway"]
        LMS["fa:fa-book Canvas / Moodle LMS"]
        NotifyGateway["fa:fa-bell Twilio SMS / FCM Push Notification"]
    end

    Student <-->|Course Registration, Schedule Planning, Fee Payment| UniPulseCore
    Registrar <-->|Section Management, Capacity Adjustment, Roster Audit| UniPulseCore
    Advisor <-->|Degree Progress Review, Prerequisite Overrides| UniPulseCore
    Faculty <-->|Class Rosters, Grade Submissions| UniPulseCore
    Finance <-->|Tuition Reconciliation, Fee Schedules| UniPulseCore

    UniPulseCore <-->|OAuth2 Identity & Role Claims| SSO
    UniPulseCore <-->|Dynamic QR Codes & Webhook Callbacks| BankGateway
    UniPulseCore -->|Finalized Student Rosters LTI 1.3| LMS
    UniPulseCore -->|Waitlist SMS & Push Alerts| NotifyGateway
```

---

## 2. Comprehensive Use Case Diagram

Illustrates the actor interactions, primary use cases, and `<<include>>` / `<<extend>>` behavioral relationships within the academic registration subsystem.

```mermaid
flowchart LR
    %% Actors
    ActorStudent((Student))
    ActorRegistrar((Academic Registrar))
    ActorAdvisor((Academic Advisor))
    ActorFinance((Finance Officer))

    %% Use Cases
    subgraph Academic_Registration_System ["UniPulse Academic System Boundary"]
        UC01([UC-01: Plan Semester Timetable])
        UC02([UC-02: Register for Course Sections])
        UC03([UC-03: Drop Course Section])
        UC04([UC-04: Atomically Swap Sections])
        UC05([UC-05: Join Course Waitlist])
        UC06([UC-06: Settle Tuition Fees Online])
        UC07([UC-07: Review & Merge Sections])
        UC08([UC-08: Process Prerequisite Override])

        subgraph Sub_Behaviors ["Internal Included Behaviors"]
            ValidatePrereq([Validate Prerequisites DAG])
            DetectClash([Detect Time Collisions])
            AtomicSeatLock([Execute Atomic Lua Seat Lock])
            AssessTuition([Compute Assessed Fees])
            LogAudit([Record Immutable Audit Log])
        end
    end

    %% Student Relationships
    ActorStudent --> UC01
    ActorStudent --> UC02
    ActorStudent --> UC03
    ActorStudent --> UC04
    ActorStudent --> UC05
    ActorStudent --> UC06

    %% Operational Relationships
    ActorRegistrar --> UC07
    ActorAdvisor --> UC08
    ActorFinance --> UC06

    %% Includes
    UC01 -.->|<<include>>| ValidatePrereq
    UC01 -.->|<<include>>| DetectClash
    UC02 -.->|<<include>>| AtomicSeatLock
    UC02 -.->|<<include>>| AssessTuition
    UC04 -.->|<<include>>| DetectClash
    UC04 -.->|<<include>>| AtomicSeatLock
    UC08 -.->|<<include>>| LogAudit
    UC07 -.->|<<include>>| LogAudit

    %% Extends
    UC05 -.->|<<extend>>\n[if section full]| UC02
```

---

## 3. High-Concurrency Registration Activity Diagram

*Note for Course Evaluators:* This diagram details the multi-stage traffic mitigation workflow designed to handle 25,000+ concurrent requests during the initial rush without database locks or server crashes.

```mermaid
flowchart TD
    Start([Student clicks 'Submit Registration']) --> EdgeCheck{Traffic Surge > 3,500 req/s?}
    
    %% Virtual Waiting Room Path
    EdgeCheck -- Yes --> QueueTicket[Issue Signed Token Bucket Queue Ticket]
    QueueTicket --> WaitRoom[Render Virtual Waiting Room Screen with Live Countdown]
    WaitRoom --> Admitted{Queue Turn Arrived?}
    Admitted -- No --> WaitRoom
    Admitted -- Yes --> IssueToken[Issue 10-Minute Registration Pass Token]
    IssueToken --> WindowCheck
    
    %% Direct Path
    EdgeCheck -- No --> WindowCheck{Student Window Active?\n(BR-TIME-001)}
    
    WindowCheck -- No --> RejectWindow[Display 'Registration Window Not Open Yet' Countdown] --> EndFailed([Terminated])
    WindowCheck -- Yes --> CreditCheck{10 <= Total Credits <= 20?\n(BR-CRED-001)}
    
    CreditCheck -- No --> RejectCredit[Display Credit Boundary Violation Alert] --> EndFailed
    CreditCheck -- Yes --> PrereqCheck{Prerequisites Passed?\n(BR-PRE-001)}
    
    PrereqCheck -- No --> RejectPrereq[Highlight Missing Prerequisites with Appeal Option] --> EndFailed
    PrereqCheck -- Yes --> ClashCheck{Time Clash Detected?\n(FR-SCH-002)}
    
    ClashCheck -- Yes --> RejectClash[Highlight Conflicting Grid Slot in Red] --> EndFailed
    ClashCheck -- No --> ExecuteLua[Execute In-Memory Atomic Redis Lua Script]
    
    ExecuteLua --> SeatCheck{Remaining Seats > 0?\n(Atomic DECRBY)}
    
    %% Seat Available
    SeatCheck -- Yes --> LockSeat[Atomically Decrement Seat & Bind Student ID\nTTL = 5 Minutes]
    LockSeat --> AsyncKafka[Publish RegistrationConfirmedEvent to Kafka Queue]
    AsyncKafka --> WriteDB[(Worker writes to PostgreSQL with Optimistic Lock)]
    WriteDB --> UpdateTuition[Append Course Fees to Tuition Invoice]
    UpdateTuition --> SendToast[Broadcast Green Success Toast & Update Official Timetable]
    SendToast --> EndSuccess([Registration Successfully Confirmed])
    
    %% Seat Full
    SeatCheck -- No --> CheckWaitlist{Waitlist Available?\n(< 25% Capacity)}
    CheckWaitlist -- Yes --> OfferWaitlist[Prompt: 'Section Full. Join Waitlist Queue #N?']
    OfferWaitlist --> EndWaitlist([Waitlist Choice Rendered])
    CheckWaitlist -- No --> PromptAlternate[Alert: 'Section & Waitlist Full. Choose Alternate Section']
    PromptAlternate --> EndFailed
```

---

## 4. End-to-End Registration & Seat Hold Sequence Diagram

Demonstrates the asynchronous decoupled interaction between the client browser, API gateway, Redis caching tier, message broker, and relational storage.

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student Browser
    participant WAF as Cloudflare WAF / Token Bucket
    participant Gateway as API Gateway (Spring Cloud Gateway / Java 17)
    participant Redis as Redis Cluster (In-Memory Lua)
    participant Kafka as Apache Kafka Broker
    participant Worker as Spring Boot Persistence Worker (Java 17)
    participant Postgres as PostgreSQL Primary DB
    participant Notify as Notification Service

    Student->>WAF: POST /api/v1/registrations (SectionID, Nonce)
    WAF->>WAF: Verify Rate-Limit & Session Nonce
    WAF->>Gateway: Forward Request
    
    Note over Gateway,Redis: Microsecond Atomic Reservation Phase (Non-blocking)
    Gateway->>Redis: EVALSHA seat_decrement.lua (SectionID, StudentID)
    alt Seat Available (Capacity > 0)
        Redis-->>Gateway: 1 (Reserved, Lease TTL: 300s)
        Gateway-->>Student: HTTP 200 OK {status: "RESERVED", hold_seconds: 300}
        
        Note over Gateway,Kafka: Asynchronous Persistence Phase
        Gateway->>Kafka: Emit "CourseEnrolledEvent" (TxID, StudentID, SectionID)
        Kafka->>Worker: Consume Event
        Worker->>Postgres: INSERT INTO ENROLLMENT_RECORDS (Status='ENROLLED')
        Postgres-->>Worker: Commit Success
        Worker->>Notify: Dispatch Confirmation Email & Receipt
        Notify-->>Student: Push Notification: "Enrolled in SWR302-SE1804"
    else Section Full (Capacity == 0)
        Redis-->>Gateway: 0 (OutOfCapacity)
        Gateway-->>Student: HTTP 409 Conflict {status: "FULL", waitlist_available: true}
    end
```

---

## 5. Class Section Lifecycle State Machine Diagram

Models the formal states of a course section from initial semester curriculum scheduling through final grade archiving.

```mermaid
stateDiagram-v2
    [*] --> Planned: Department schedules course & sets MaxCapacity (35)
    
    Planned --> Open: Registration Window Opens for Semester
    
    Open --> AtCapacity: EnrolledCount == MaxCapacity (35/35)
    AtCapacity --> Open: Enrolled student drops course (EnrolledCount < 35)
    
    AtCapacity --> WaitlistActive: Students join overflow waitlist (up to 9 spots)
    WaitlistActive --> Open: Dropped seat causes waitlist promotion
    
    Open --> UnderEnrolledCandidate: Day 4 Review: EnrolledCount < 15
    UnderEnrolledCandidate --> CancelledMerged: Registrar merges into parallel section
    UnderEnrolledCandidate --> Open: Capacity sustained or special dean approval granted
    
    Open --> Closed: Add/Drop Deadline Reached (End of Week 1)
    AtCapacity --> Closed: Add/Drop Deadline Reached
    WaitlistActive --> Closed: Add/Drop Deadline Reached (Waitlists Purged)
    
    Closed --> Running: Classes Active (Weeks 2 to 10)
    Running --> Completed: Final grades submitted & verified by Academic Office
    
    CancelledMerged --> [*]
    Completed --> [*]
```

---

## 6. Enrollment Record State Machine Diagram

Details the state transitions of an individual student's course enrollment record.

```mermaid
stateDiagram-v2
    [*] --> TentativeDraft: Student adds section to Schedule Planner Grid
    
    TentativeDraft --> ReservedHold: Registration submitted & Atomic Redis seat locked (TTL: 5m)
    
    ReservedHold --> TentativeDraft: 5-minute hold expires without submission
    ReservedHold --> Enrolled: Confirmed by student & persisted in Database
    
    Enrolled --> Dropped: Student drops section before Week 1 deadline (100%/80% refund)
    Enrolled --> Withdrawn: Student drops section between Week 2 and Week 7 ('W' grade)
    Enrolled --> Completed: Term finishes & final numerical grade is assigned
    
    Dropped --> [*]
    Withdrawn --> [*]
    Completed --> [*]
```

---

## 7. Domain Model Class Diagram

Specifies the core object-oriented domain classes, structural relationships, attributes, and operational contracts.

```mermaid
classDiagram
    class Student {
        -String studentId
        -String fullName
        -int cohort
        -double cgpa
        -AcademicStanding standing
        -boolean isOverloadApproved
        +canRegister(int requestedCredits) boolean
        +validatePrerequisites(Course c) boolean
        +viewDegreeAudit() DegreeAuditReport
    }

    class Course {
        -String courseCode
        -String courseTitle
        -int credits
        -int lectureHours
        -int labHours
        +getPrerequisites() List~Course~
        +getCoRequisites() List~Course~
    }

    class ClassSection {
        -long sectionId
        -String sectionCode
        -int maxCapacity
        -int enrolledCount
        -int waitlistCount
        -SectionStatus status
        -long version
        +hasAvailableSeats() boolean
        +reserveSeatAtomic(String studentId) boolean
        +releaseSeat(String studentId) void
        +promoteNextWaitlist() WaitlistEntry
    }

    class TimeSlot {
        -DayOfWeek day
        -int slotIndex
        -LocalTime startTime
        -LocalTime endTime
        +isCollidingWith(TimeSlot other) boolean
    }

    class EnrollmentRecord {
        -UUID enrollmentId
        -String studentId
        -long sectionId
        -EnrollmentStatus status
        -Instant registeredAt
        -Double finalGrade
        -String txHash
        +drop(Instant dropTime) RefundAssessment
        +assignGrade(double grade) void
    }

    class WaitlistEntry {
        -long waitlistId
        -int position
        -WaitlistStatus status
        -Instant joinedAt
        -Instant offerExpiresAt
        +offerPromotion(Duration lease) void
        +expire() void
    }

    class TuitionInvoice {
        -String invoiceId
        -BigDecimal totalAmount
        -BigDecimal paidAmount
        -PaymentStatus status
        -LocalDate dueDate
        +calculateFees(List~Course~ courses) BigDecimal
        +applyPayment(BigDecimal amount, String txRef) void
    }

    Student "1" --> "*" EnrollmentRecord : registers
    Student "1" --> "*" WaitlistEntry : waits for
    Student "1" --> "*" TuitionInvoice : billed
    Course "1" --> "*" ClassSection : offers
    Course "*" --> "*" Course : requires Prerequisite
    ClassSection "1" --> "*" EnrollmentRecord : enrolls
    ClassSection "1" --> "*" WaitlistEntry : queues
    ClassSection "*" --> "*" TimeSlot : occupies
```

---
*End of Analysis Models Document - UniPulse Platform*
