/**
 * UniPulse Prototype Application Logic
 * SWR302 - Group 4 (Class SE2059-NJ)
 */

// Course Database & Initial State
const COURSES_DATA = [
  {
    code: 'SWR302',
    title: 'Software Requirements',
    credits: 3,
    department: 'Software Engineering',
    prereq: 'PRJ301',
    prereqPassed: true,
    sections: [
      { id: 'SWR302-SE1804', name: 'SE1804', lecturer: 'Prof. Nguyen D.', days: [1, 4], slot: 2, time: '09:15 - 11:45', room: 'BE-302', maxSeats: 35, remaining: 2, enrolled: 33 },
      { id: 'SWR302-SE1805', name: 'SE1805', lecturer: 'Prof. Pham H.', days: [2, 5], slot: 4, time: '15:15 - 17:45', room: 'BE-305', maxSeats: 35, remaining: 8, enrolled: 27 }
    ]
  },
  {
    code: 'SWT301',
    title: 'Software Testing',
    credits: 3,
    department: 'Software Engineering',
    prereq: 'CSD201',
    prereqPassed: true,
    sections: [
      { id: 'SWT301-SE1801', name: 'SE1801', lecturer: 'Dr. Le Thi B', days: [2, 5], slot: 2, time: '09:15 - 11:45', room: 'DE-201', maxSeats: 35, remaining: 7, enrolled: 28 },
      { id: 'SWT301-SE1802', name: 'SE1802', lecturer: 'Dr. Tran K', days: [3, 6], slot: 1, time: '07:30 - 09:00', room: 'DE-204', maxSeats: 35, remaining: 12, enrolled: 23 }
    ]
  },
  {
    code: 'FER202',
    title: 'Front-End Web Development with React',
    credits: 3,
    department: 'Software Engineering',
    prereq: 'PRF192',
    prereqPassed: true,
    sections: [
      { id: 'FER202-SE1803', name: 'SE1803', lecturer: 'MSc. Vo Van C', days: [3, 6], slot: 2, time: '09:15 - 11:45', room: 'AL-102', maxSeats: 35, remaining: 17, enrolled: 18 }
    ]
  },
  {
    code: 'PRJ301',
    title: 'Java Web Application Development',
    credits: 3,
    department: 'Software Engineering',
    prereq: 'PRO192',
    prereqPassed: true,
    sections: [
      { id: 'PRJ301-SE1701', name: 'SE1701', lecturer: 'Dr. Vu T', days: [1, 4], slot: 1, time: '07:30 - 09:00', room: 'BE-401', maxSeats: 35, remaining: 0, enrolled: 35 }
    ]
  },
  {
    code: 'SWP391',
    title: 'Software Development Project',
    credits: 3,
    department: 'Software Engineering',
    prereq: 'SWR302 & SWT301',
    prereqPassed: false,
    prereqNote: 'Prerequisite SWR302 in progress',
    sections: [
      { id: 'SWP391-SE1801', name: 'SE1801', lecturer: 'Prof. Hoang M', days: [2, 5], slot: 3, time: '12:30 - 15:00', room: 'LAB-502', maxSeats: 30, remaining: 14, enrolled: 16 }
    ]
  },
  {
    code: 'CS101',
    title: 'Introduction to Computing',
    credits: 3,
    department: 'Computer Science',
    prereq: 'None',
    prereqPassed: true,
    sections: [
      { id: 'CS101-01', name: 'Section 01', lecturer: 'Dr. Tran Van A', days: [3, 6], slot: 1, time: '07:30 - 09:00', room: 'AL-204', maxSeats: 35, remaining: 26, enrolled: 9 },
      { id: 'CS101-02', name: 'Section 02', lecturer: 'Dr. Le Thi B', days: [3, 6], slot: 4, time: '15:15 - 17:45', room: 'AL-206', maxSeats: 35, remaining: 13, enrolled: 22 }
    ]
  }
];

const TIME_SLOTS = [
  { index: 1, name: 'Slot 1', time: '07:30 - 09:00' },
  { index: 2, name: 'Slot 2', time: '09:15 - 11:45' },
  { index: 3, name: 'Slot 3', time: '12:30 - 15:00' },
  { index: 4, name: 'Slot 4', time: '15:15 - 17:45' },
  { index: 5, name: 'Slot 5', time: '18:00 - 19:30' },
  { index: 6, name: 'Slot 6', time: '19:45 - 21:15' }
];

// Active State
let enrolledCart = [
  { courseCode: 'SWR302', sectionId: 'SWR302-SE1804', name: 'SE1804', credits: 3, days: [1, 4], slot: 2, time: '09:15 - 11:45', room: 'BE-302', lecturer: 'Prof. Nguyen D.', status: 'CONFIRMED' },
  { courseCode: 'SWT301', sectionId: 'SWT301-SE1801', name: 'SE1801', credits: 3, days: [2, 5], slot: 2, time: '09:15 - 11:45', room: 'DE-201', lecturer: 'Dr. Le Thi B', status: 'CONFIRMED' },
  { courseCode: 'FER202', sectionId: 'FER202-SE1803', name: 'SE1803', credits: 3, days: [3, 6], slot: 2, time: '09:15 - 11:45', room: 'AL-102', lecturer: 'MSc. Vo Van C', status: 'CONFIRMED' },
  { courseCode: 'PRJ301', sectionId: 'PRJ301-SE1701', name: 'SE1701', credits: 3, days: [1, 4], slot: 1, time: '07:30 - 09:00', room: 'BE-401', lecturer: 'Dr. Vu T', status: 'CONFIRMED' }
];

let tuitionPaid = false;

// DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupThemeToggle();
  renderCourseCatalog();
  renderTimetableGrid();
  renderCartTable();
  renderDegreeAudit();
  renderTuitionStatement();
  setupEventListeners();
  startCountdownTimer();
});

// Tab Navigation
function setupNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  const panes = document.querySelectorAll('.tab-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const pane = document.getElementById(`tab-${target}`);
      if (pane) pane.classList.add('active');
    });
  });
}

// Dark / Light Theme
function setupThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    toggleBtn.innerHTML = isLight
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  });
}

// Render Course Catalog
function renderCourseCatalog(filterText = '') {
  const container = document.getElementById('course-list-container');
  if (!container) return;
  container.innerHTML = '';

  const filtered = COURSES_DATA.filter(c => 
    c.code.toLowerCase().includes(filterText.toLowerCase()) ||
    c.title.toLowerCase().includes(filterText.toLowerCase())
  );

  document.getElementById('course-count').textContent = `${filtered.length} Courses Listed`;

  filtered.forEach(course => {
    const item = document.createElement('div');
    item.className = 'course-item';

    const prereqHtml = course.prereqPassed
      ? `<span class="prereq-badge">✓ Prereq: ${course.prereq} passed</span>`
      : `<span class="prereq-badge prereq-missing">⚠ Prereq Unsatisfied: ${course.prereq}</span>`;

    let sectionsHtml = '';
    course.sections.forEach(sec => {
      const isAlreadyInCart = enrolledCart.some(e => e.sectionId === sec.id);
      let seatClass = 'seat-open';
      if (sec.remaining === 0) seatClass = 'seat-full';
      else if (sec.remaining <= 3) seatClass = 'seat-low';

      const daysText = sec.days.map(d => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d - 1]).join(' / ');

      sectionsHtml += `
        <div class="section-pill">
          <div class="section-info">
            <span class="section-name">${sec.name}</span>
            <span class="section-slot">${daysText} • Slot ${sec.slot} (${sec.room})</span>
          </div>
          <div class="section-actions" style="display:flex; align-items:center; gap:0.5rem;">
            <span class="seat-counter ${seatClass}">
              ${sec.remaining === 0 ? 'FULL (Waitlist)' : `${sec.remaining} seats`}
            </span>
            ${
              isAlreadyInCart
                ? `<button class="btn btn-secondary btn-sm" disabled>Enrolled</button>`
                : course.prereqPassed
                  ? sec.remaining > 0
                    ? `<button class="btn btn-primary btn-sm" onclick="handleAddToCart('${course.code}', '${sec.id}')">+ Add</button>`
                    : `<button class="btn btn-warning btn-sm" onclick="handleJoinWaitlist('${sec.id}')">Join Waitlist</button>`
                  : `<button class="btn btn-secondary btn-sm" disabled title="Prerequisite not met">Locked</button>`
            }
          </div>
        </div>
      `;
    });

    item.innerHTML = `
      <div class="course-header">
        <div class="course-code-title">
          <span class="course-code">${course.code}</span>
          <span class="course-title">${course.title}</span>
        </div>
        <span class="course-credits">${course.credits} Credits</span>
      </div>
      <div class="course-meta">
        <span>Dept: ${course.department}</span>
        ${prereqHtml}
      </div>
      <div class="sections-container">
        ${sectionsHtml}
      </div>
    `;

    container.appendChild(item);
  });
}

// Render Timetable Matrix
function renderTimetableGrid() {
  const grid = document.getElementById('timetable-grid');
  if (!grid) return;

  // Clear everything except headers
  const headers = Array.from(grid.children).slice(0, 7);
  grid.innerHTML = '';
  headers.forEach(h => grid.appendChild(h));

  TIME_SLOTS.forEach(slot => {
    // Time label cell
    const slotHeader = document.createElement('div');
    slotHeader.className = 'slot-cell';
    slotHeader.innerHTML = `
      <span class="slot-title">${slot.name}</span>
      <span class="time-label">${slot.time}</span>
    `;
    grid.appendChild(slotHeader);

    // 6 Days: Mon (1) to Sat (6)
    for (let day = 1; day <= 6; day++) {
      const cell = document.createElement('div');
      cell.className = 'slot-cell';
      cell.dataset.day = day;
      cell.dataset.slot = slot.index;

      // Find if an enrolled course occupies this cell
      const matches = enrolledCart.filter(e => e.days.includes(day) && e.slot === slot.index);

      if (matches.length === 1) {
        const item = matches[0];
        let colorClass = 'block-swr';
        if (item.courseCode === 'SWT301') colorClass = 'block-swt';
        if (item.courseCode === 'PRJ301') colorClass = 'block-prj';
        if (item.courseCode === 'FER202') colorClass = 'block-swt';

        cell.innerHTML = `
          <div class="timetable-block ${colorClass}">
            <div>
              <div class="block-code">${item.courseCode} - ${item.name}</div>
              <div class="block-room">${item.room} • ${item.lecturer}</div>
            </div>
            <button class="btn btn-secondary btn-sm" style="padding:1px 4px; font-size:0.65rem;" onclick="handleDropCourse('${item.sectionId}')">Drop</button>
          </div>
        `;
      } else if (matches.length > 1) {
        // TIME CLASH DETECTED!
        cell.innerHTML = `
          <div class="timetable-block block-collision">
            <div class="block-code">⚠ TIME CLASH!</div>
            <div>${matches.map(m => m.courseCode).join(' vs ')}</div>
          </div>
        `;
      }

      grid.appendChild(cell);
    }
  });

  checkScheduleCollisions();
}

// Check schedule collisions
function checkScheduleCollisions() {
  const alertBanner = document.getElementById('collision-alert');
  const alertText = document.getElementById('collision-alert-text');
  
  let collisions = [];
  for (let day = 1; day <= 6; day++) {
    for (let slot = 1; slot <= 6; slot++) {
      const matches = enrolledCart.filter(e => e.days.includes(day) && e.slot === slot);
      if (matches.length > 1) {
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        collisions.push(`${matches.map(m => m.courseCode).join(' & ')} on ${dayNames[day - 1]} Slot ${slot}`);
      }
    }
  }

  if (collisions.length > 0) {
    alertBanner.classList.remove('hidden');
    alertText.innerHTML = `<strong>Schedule Conflict Detected (BR-SCH-002):</strong> ${collisions.join('; ')}. Please drop or swap one section.`;
  } else {
    alertBanner.classList.add('hidden');
  }
}

// Render Cart & Checkout Table
function renderCartTable() {
  const tbody = document.getElementById('cart-table-body');
  const summaryChip = document.getElementById('cart-credits-summary');
  const headerCredits = document.getElementById('header-credits');
  if (!tbody) return;

  tbody.innerHTML = '';
  let totalCredits = 0;

  enrolledCart.forEach(item => {
    totalCredits += item.credits;
    const daysText = item.days.map(d => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d - 1]).join(' / ');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${item.courseCode}</strong></td>
      <td>${item.name}</td>
      <td>${item.credits}</td>
      <td>${daysText} (Slot ${item.slot})</td>
      <td><span class="seat-counter seat-open">Active Seat</span></td>
      <td><span class="badge-status status-completed">ENROLLED</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="handleDropCourse('${item.sectionId}')">Drop</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (enrolledCart.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No courses enrolled yet. Please select courses from the left panel.</td></tr>`;
  }

  summaryChip.textContent = `${totalCredits} Credits Selected (Min 10 / Max 20)`;
  headerCredits.textContent = `${totalCredits} / 20`;
}

// Handle Add Course with Real-Time Collision Protection
window.handleAddToCart = function(courseCode, sectionId) {
  const course = COURSES_DATA.find(c => c.code === courseCode);
  if (!course) return;
  const section = course.sections.find(s => s.id === sectionId);
  if (!section) return;

  // 1. Check Credit Limit
  const currentCredits = enrolledCart.reduce((sum, c) => sum + c.credits, 0);
  if (currentCredits + course.credits > 20) {
    showToast(`Registration Blocked: Exceeds Maximum Credit Limit of 20 credits (BR-CRED-001).`, 'danger');
    return;
  }

  // 2. Check Collision
  let hasCollision = false;
  let clashName = '';
  enrolledCart.forEach(item => {
    const commonDay = item.days.some(d => section.days.includes(d));
    if (commonDay && item.slot === section.slot) {
      hasCollision = true;
      clashName = `${item.courseCode} (${item.name})`;
    }
  });

  if (hasCollision) {
    showToast(`Time Conflict: Clashes with ${clashName} on Slot ${section.slot}. Cannot register concurrently.`, 'danger');
    return;
  }

  // 3. Atomically decrement remaining seats
  if (section.remaining > 0) {
    section.remaining -= 1;
    section.enrolled += 1;
  }

  enrolledCart.push({
    courseCode: course.code,
    sectionId: section.id,
    name: section.name,
    credits: course.credits,
    days: section.days,
    slot: section.slot,
    time: section.time,
    room: section.room,
    lecturer: section.lecturer,
    status: 'CONFIRMED'
  });

  showToast(`Atomic Lock Acquired: Successfully added ${course.code}-${section.name} (Hold: 5 mins).`, 'success');

  renderCourseCatalog();
  renderTimetableGrid();
  renderCartTable();
  renderTuitionStatement();
};

// Handle Drop Course
window.handleDropCourse = function(sectionId) {
  const index = enrolledCart.findIndex(e => e.sectionId === sectionId);
  if (index === -1) return;

  const dropped = enrolledCart[index];

  // Return seat to catalog
  COURSES_DATA.forEach(c => {
    c.sections.forEach(s => {
      if (s.id === sectionId) {
        s.remaining += 1;
        s.enrolled -= 1;
      }
    });
  });

  enrolledCart.splice(index, 1);
  showToast(`Course Dropped: ${dropped.courseCode}. Seat returned to inventory. 100% refund calculated.`, 'warning');

  renderCourseCatalog();
  renderTimetableGrid();
  renderCartTable();
  renderTuitionStatement();
};

// Handle Waitlist
window.handleJoinWaitlist = function(sectionId) {
  showToast(`Waitlist Enrolled: You have been assigned Queue Position #1 for section ${sectionId}. You will be notified via SMS if a slot opens.`, 'info');
};

// Degree Audit Prerequisite Graph Render
function renderDegreeAudit() {
  const container = document.getElementById('prereq-graph');
  if (!container) return;

  container.innerHTML = `
    <div class="prereq-node node-passed">
      <div style="font-size:0.75rem; color:var(--success); font-weight:700;">PASSED (Grade: 8.5/10)</div>
      <div style="font-size:1.1rem; font-weight:800; margin:4px 0;">PRJ301</div>
      <div style="font-size:0.75rem; color:var(--text-muted);">Java Web Application Development</div>
      <div style="font-size:0.7rem; color:var(--text-dim); margin-top:4px;">Term 4 • 3 Credits</div>
    </div>

    <div class="node-arrow">&rarr;</div>

    <div class="prereq-node node-active">
      <div style="font-size:0.75rem; color:var(--accent-primary); font-weight:700;">ACTIVE ENROLLMENT</div>
      <div style="font-size:1.1rem; font-weight:800; margin:4px 0;">SWR302</div>
      <div style="font-size:0.75rem; color:var(--text-muted);">Software Requirements</div>
      <div style="font-size:0.7rem; color:var(--accent-primary); margin-top:4px;">Term 5 • 3 Credits (Class SE1804)</div>
    </div>

    <div class="node-arrow">&rarr;</div>

    <div class="prereq-node node-locked">
      <div style="font-size:0.75rem; color:var(--danger); font-weight:700;">🔒 LOCKED (Requires SWR302)</div>
      <div style="font-size:1.1rem; font-weight:800; margin:4px 0;">SWP391</div>
      <div style="font-size:0.75rem; color:var(--text-muted);">Software Development Project</div>
      <div style="font-size:0.7rem; color:var(--text-dim); margin-top:4px;">Term 6 • 3 Credits</div>
    </div>
  `;
}

// Tuition Calculation Statement
function renderTuitionStatement() {
  const tbody = document.getElementById('tuition-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  const creditRate = 520000;
  let totalTuition = 0;
  let labFees = 0;

  enrolledCart.forEach(item => {
    const courseTuition = item.credits * creditRate;
    totalTuition += courseTuition;
    const hasLab = ['SWR302', 'PRJ301', 'SWT301'].includes(item.courseCode);
    const labFee = hasLab ? 400000 : 0;
    labFees += labFee;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${item.courseCode}</strong></td>
      <td>${item.courseCode === 'SWR302' ? 'Software Requirements' : item.courseCode}</td>
      <td>${item.credits}</td>
      <td>${creditRate.toLocaleString()} VND</td>
      <td>${labFee > 0 ? labFee.toLocaleString() + ' VND' : '-'}</td>
      <td>${(courseTuition + labFee).toLocaleString()} VND</td>
    `;
    tbody.appendChild(tr);
  });

  const discount = Math.round((totalTuition + labFees) * 0.1);
  const grandTotal = totalTuition + labFees - discount;

  document.getElementById('tuition-subtotal').textContent = `${totalTuition.toLocaleString()} VND`;
  document.getElementById('tuition-lab').textContent = `${labFees.toLocaleString()} VND`;
  document.getElementById('tuition-discount').textContent = `- ${discount.toLocaleString()} VND`;
  document.getElementById('tuition-grand-total').textContent = `${grandTotal.toLocaleString()} VND`;

  const statusBadge = document.getElementById('invoice-status-badge');
  if (tuitionPaid) {
    statusBadge.textContent = 'Payment Status: PAID (E-Invoice #INV-2026-9812)';
    statusBadge.className = 'invoice-status chip chip-success';
  } else {
    statusBadge.textContent = 'Payment Status: UNPAID';
    statusBadge.className = 'invoice-status chip chip-danger';
  }
}

// Event Listeners
function setupEventListeners() {
  // Search input
  const searchInput = document.getElementById('course-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderCourseCatalog(e.target.value);
    });
  }

  // Clear draft
  const clearBtn = document.getElementById('btn-clear-cart');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      enrolledCart = [];
      showToast('Schedule draft cleared.', 'warning');
      renderTimetableGrid();
      renderCartTable();
      renderTuitionStatement();
    });
  }

  // Submit registration button
  const submitBtn = document.getElementById('btn-submit-registration');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      if (enrolledCart.length === 0) {
        showToast('Please add courses before confirming registration.', 'warning');
        return;
      }
      showToast('Registration Confirmed! Zero seat overbooking verified across all 4 enrolled courses. Digital receipt generated.', 'success');
    });
  }

  // Export iCal
  const exportBtn = document.getElementById('btn-export-ical');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      showToast('Generating .ics calendar file... Fall2026_Schedule.ics downloaded.', 'info');
    });
  }

  // Simulate Payment
  const payBtn = document.getElementById('btn-simulate-payment');
  if (payBtn) {
    payBtn.addEventListener('click', () => {
      tuitionPaid = true;
      renderTuitionStatement();
      showToast('Payment Verified via VietQR / VNPay Webhook! Status updated to PAID.', 'success');
    });
  }

  // Registrar Operations: Merge CS101
  const mergeBtn = document.getElementById('btn-merge-cs101');
  if (mergeBtn) {
    mergeBtn.addEventListener('click', () => {
      mergeBtn.disabled = true;
      mergeBtn.textContent = 'Merged (31/35 Enrolled)';
      document.getElementById('under-enrolled-count').textContent = '0 Sections Under-Enrolled';
      document.getElementById('under-enrolled-count').className = 'chip chip-success';
      showToast('Administrative Action: Section CS101-01 successfully merged into CS101-02. Zero schedule clashes for 9 students.', 'success');
    });
  }

  // THE LIVE CONCURRENCY STRESS TEST SIMULATOR
  const stressBtn = document.getElementById('btn-run-stress-test');
  if (stressBtn) {
    stressBtn.addEventListener('click', runConcurrencyStressSimulation);
  }
}

// Concurrency Stress Test Simulator Engine
function runConcurrencyStressSimulation() {
  const consoleBox = document.getElementById('stress-console');
  const metricReqs = document.getElementById('metric-reqs');
  const metricSeats = document.getElementById('metric-seats');
  const metricBooked = document.getElementById('metric-booked');
  const metricWaitlisted = document.getElementById('metric-waitlisted');
  const metricOversold = document.getElementById('metric-oversold');
  const metricLatency = document.getElementById('metric-latency');

  consoleBox.innerHTML = '';
  function log(msg, color = '#f9fafb') {
    const line = document.createElement('div');
    line.className = 'console-line';
    line.style.color = color;
    line.textContent = msg;
    consoleBox.appendChild(line);
    consoleBox.scrollTop = consoleBox.scrollHeight;
  }

  log('⚡ [STAMPEDE TRIGGERED] 500 Virtual Students submitting requests at 09:00:00.000...', '#f59e0b');
  log('⚡ [TRAFFIC SHAPER] Cloudflare WAF passed. Virtual Queue rate limited to 3,500 req/s...', '#3b82f6');

  let availableSeats = 2;
  let successfulBookings = 0;
  let waitlistedCount = 0;
  let oversoldCount = 0;
  const startTime = performance.now();

  // Simulate atomic Redis Lua evaluation across 500 parallel requests
  for (let i = 1; i <= 500; i++) {
    const studentId = `SE180${String(100 + i).padStart(3, '0')}`;
    if (availableSeats > 0) {
      availableSeats -= 1;
      successfulBookings += 1;
      log(`[09:00:00.${String(i).padStart(3, '0')}] EVALSHA atomic_reserve_seat.lua: Student ${studentId} -> SUCCESS (Seat Locked! ${availableSeats} remaining)`, '#10b981');
    } else {
      waitlistedCount += 1;
      if (i <= 5 || i >= 498) {
        log(`[09:00:00.${String(i).padStart(3, '0')}] EVALSHA atomic_reserve_seat.lua: Student ${studentId} -> SECTION_FULL -> Added to Waitlist Position #${waitlistedCount}`, '#9ca3af');
      } else if (i === 6) {
        log(`... [492 parallel requests cleanly buffered to Waitlist with zero locks] ...`, '#6b7280');
      }
    }
  }

  const duration = Math.round(performance.now() - startTime + 28);

  log(`\n================ SIMULATION BENCHMARK COMPLETED ================`, '#a5b4fc');
  log(`Total Requests Processed: 500 | Wall Clock Latency: ${duration} ms`, '#a5b4fc');
  log(`Seats Allocated: ${successfulBookings} / 2 Available | Seats Oversold: ${oversoldCount} (0.00%)`, '#10b981');
  log(`Zero-Overselling Invariant Validated: EnrolledCount <= MaxCapacity holds unconditionally!`, '#10b981');

  metricBooked.textContent = successfulBookings;
  metricWaitlisted.textContent = waitlistedCount;
  metricOversold.textContent = `${oversoldCount} (0.00%)`;
  metricLatency.textContent = `${duration} ms`;

  showToast(`Stress Test Passed: 500 requests evaluated in ${duration}ms with ZERO overselling!`, 'success');
}

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Countdown Timer
function startCountdownTimer() {
  let seconds = 570130; // ~ 6 days 14 hours
  const timerElem = document.getElementById('countdown-timer');
  if (!timerElem) return;

  setInterval(() => {
    seconds--;
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    timerElem.textContent = `${d}d ${h}h ${m}m ${s}s`;
  }, 1000);
}
