/** @type {Object|null} */
let currentPatient = null;

/** @type {Array} */
let allPatients = [];

/** @type {Object|null} */
let aiAnalysis = null;

const API_BASE = '';

// ─── Category icons & colors ────────────────────────────────────────
const CATEGORY_CONFIG = {
  visit:      { icon: '🏥', color: 'blue',   label: 'Visit' },
  lab:        { icon: '🔬', color: 'purple', label: 'Lab' },
  imaging:    { icon: '📷', color: 'cyan',   label: 'Imaging' },
  medication: { icon: '💊', color: 'orange', label: 'Medication' },
  referral:   { icon: '📋', color: 'teal',   label: 'Referral' },
  procedure:  { icon: '⚕️', color: 'rose',   label: 'Procedure' },
  'follow-up':{ icon: '🔄', color: 'indigo', label: 'Follow-up' },
  education:  { icon: '📚', color: 'green',  label: 'Education' },
};

const STATUS_COLORS = {
  completed:     'bg-emerald-500',
  'in-progress': 'bg-blue-500 pulse',
  upcoming:      'bg-gray-300',
  overdue:       'bg-amber-500',
  cancelled:     'bg-gray-200',
};

const TIMING_STYLES = {
  routine:   { bg: 'bg-teal-50 text-teal-700', label: 'When convenient' },
  soon:      { bg: 'bg-blue-50 text-blue-700',  label: 'Coming up soon' },
  urgent:    { bg: 'bg-amber-50 text-amber-700', label: 'Don\'t wait too long' },
  emergency: { bg: 'bg-rose-50 text-rose-700',  label: 'Reach out soon' },
};

// ─── Init ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
  // Load patients from JSON file (for easy scenario testing)
  try {
    const res = await fetch('/patients.json');
    const data = await res.json();
    allPatients = data.patients;
    // Populate login dropdown
    const loginSelect = document.getElementById('login-patient-select');
    loginSelect.innerHTML = `<option value="">Select a patient to simulate...</option>` +
      allPatients.map(p => `<option value="${p.id}">${p.name} — ${p.primaryDiagnosis}</option>`).join('');
  } catch (err) {
    console.error('Failed to load patients.json:', err);
  }
}

// ─── Login / Logout ────────────────────────────────────────────────
function handleLogin() {
  const patientId = document.getElementById('login-patient-select').value;
  if (!patientId) {
    alert('Please select a patient to simulate');
    return;
  }
  currentPatient = allPatients.find(p => p.id === patientId);
  if (!currentPatient) return;
  // Reset AI analysis for new patient (user must click to generate)
  aiAnalysis = null;
  // Reset home AI card
  document.getElementById('home-ai-content').classList.remove('hidden');
  document.getElementById('home-ai-loading').classList.add('hidden');
  document.getElementById('home-ai-result').classList.add('hidden');
  // Update UI
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  // Set user info
  const initials = currentPatient.name.split(' ').map(n => n[0]).join('');
  document.getElementById('user-avatar').textContent = initials;
  document.getElementById('user-name').textContent = currentPatient.name;
  // Show voice assistant button for elderly care
  showVoiceFab();
  // Render home page
  showPage('home');
  renderHomePage();
}

function handleLogout() {
  currentPatient = null;
  aiAnalysis = null;
  document.getElementById('main-app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('ai-metadata-wrapper').classList.add('hidden');
  document.getElementById('user-menu').classList.add('hidden');
}

function toggleUserMenu() {
  const menu = document.getElementById('user-menu');
  menu.classList.toggle('hidden');
  // Populate switch patient dropdown
  if (!menu.classList.contains('hidden')) {
    const select = document.getElementById('switch-patient-select');
    select.innerHTML = allPatients.map(p => 
      `<option value="${p.id}" ${p.id === currentPatient?.id ? 'selected' : ''}>${p.name} (${p.id})</option>`
    ).join('');
    document.getElementById('menu-user-name').textContent = currentPatient?.name || '';
  }
}

function switchPatient() {
  const patientId = document.getElementById('switch-patient-select').value;
  if (!patientId || patientId === currentPatient?.id) return;
  currentPatient = allPatients.find(p => p.id === patientId);
  if (!currentPatient) return;
  // Reset AI analysis for new patient
  aiAnalysis = null;
  // Reset home AI card
  document.getElementById('home-ai-content').classList.remove('hidden');
  document.getElementById('home-ai-loading').classList.add('hidden');
  document.getElementById('home-ai-result').classList.add('hidden');
  // Update user info
  const initials = currentPatient.name.split(' ').map(n => n[0]).join('');
  document.getElementById('user-avatar').textContent = initials;
  document.getElementById('user-name').textContent = currentPatient.name;
  document.getElementById('menu-user-name').textContent = currentPatient.name;
  // Close menu and refresh page
  document.getElementById('user-menu').classList.add('hidden');
  showPage('home');
  renderHomePage();
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  const menu = document.getElementById('user-menu');
  const menuButton = e.target.closest('button[onclick="toggleUserMenu()"]');
  if (!menuButton && !e.target.closest('#user-menu')) {
    menu?.classList.add('hidden');
  }
});

// ─── Page Navigation ───────────────────────────────────────────────
function showPage(pageName) {
  // Hide all pages
  document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
  // Show selected page
  document.getElementById(`page-${pageName}`).classList.remove('hidden');
  // Update sidebar
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.page === pageName) link.classList.add('active');
  });
  // Render page content
  if (pageName === 'home') renderHomePage();
  if (pageName === 'mycare') renderMyCarePage();
  if (pageName === 'health') renderHealthPage();
  if (pageName === 'todo') renderTodoPage();
}

// ─── Home Page ─────────────────────────────────────────────────────
function renderHomePage() {
  if (!currentPatient) return;
  // Notifications (overdue items)
  const overdue = currentPatient.careEvents.filter(e => e.status === 'overdue');
  const notifications = document.getElementById('notifications-section');
  if (overdue.length > 0) {
    notifications.innerHTML = overdue.slice(0, 3).map(e => `
      <div class="card p-4 border-l-4 border-ng-orange">
        <p class="text-sm font-medium text-gray-800">${e.title}</p>
        <p class="text-xs text-ng-orange mt-1">${e.details || 'Needs your attention'}</p>
      </div>
    `).join('');
  } else {
    notifications.innerHTML = '';
  }
  // Care Team
  const careTeamList = document.getElementById('care-team-list');
  if (currentPatient.careTeam) {
    careTeamList.innerHTML = currentPatient.careTeam.map(member => `
      <div class="flex-shrink-0 w-32 text-center">
        <div class="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-2 flex items-center justify-center text-gray-400">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        </div>
        <p class="text-xs font-medium text-gray-800 truncate">${member.name}</p>
        <p class="text-[10px] text-gray-500 truncate">${member.role}</p>
      </div>
    `).join('');
  }
  // Upcoming Appointments (from upcomingAppointments data)
  const appointments = currentPatient.upcomingAppointments || [];
  const appointmentsList = document.getElementById('appointments-list');
  if (appointments.length > 0) {
    appointmentsList.innerHTML = appointments.slice(0, 3).map(appt => {
      const apptDate = new Date(appt.date);
      const today = new Date();
      const daysUntil = Math.ceil((apptDate - today) / (1000 * 60 * 60 * 24));
      const dateStr = apptDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const daysLabel = daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`;
      const urgencyClass = daysUntil <= 1 ? 'bg-amber-50 border-amber-200' : daysUntil <= 7 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200';
      return `
        <div class="flex items-center gap-4 p-3 ${urgencyClass} rounded-lg border">
          <div class="w-12 h-12 bg-white rounded-lg flex flex-col items-center justify-center border border-gray-200 shadow-sm">
            <span class="text-[10px] font-medium text-gray-500 uppercase">${apptDate.toLocaleDateString('en-US', { month: 'short' })}</span>
            <span class="text-lg font-bold text-gray-800 leading-none">${apptDate.getDate()}</span>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-800">${appt.type}</p>
            <p class="text-xs text-gray-500">${appt.provider} • ${appt.specialty}</p>
            <p class="text-[10px] text-gray-400 mt-0.5">${appt.time} • ${appt.location}</p>
          </div>
          <div class="text-right">
            <span class="text-[10px] font-medium px-2 py-1 rounded-full ${daysUntil <= 1 ? 'bg-amber-100 text-amber-700' : daysUntil <= 7 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}">${daysLabel}</span>
          </div>
        </div>
      `;
    }).join('');
  } else {
    appointmentsList.innerHTML = `
      <div class="text-center py-8 text-gray-400">
        <svg class="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        <p class="text-sm">No Upcoming Appointments</p>
        <p class="text-xs mt-1">As appointments get scheduled, they will show up here.</p>
      </div>
    `;
  }
  // Render Appointment Prep Card
  renderAppointmentPrepCard();
  // Render Cost Explainer Card
  renderCostExplainerCard();
}

// ─── Appointment Preparation ────────────────────────────────────────
function renderAppointmentPrepCard() {
  const card = document.getElementById('appointment-prep-card');
  const appointments = currentPatient.upcomingAppointments;
  if (!appointments || appointments.length === 0) {
    card.classList.add('hidden');
    return;
  }
  card.classList.remove('hidden');
  const nextAppt = appointments[0];
  const apptDate = new Date(nextAppt.date);
  const today = new Date();
  const daysUntil = Math.ceil((apptDate - today) / (1000 * 60 * 60 * 24));
  document.getElementById('prep-appointment-info').textContent = 
    `${nextAppt.type} with ${nextAppt.provider}`;
  document.getElementById('prep-days-until').textContent = 
    daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`;
  // Check if we already have prep data from AI analysis
  if (aiAnalysis?.appointmentPrep?.appointmentId === nextAppt.id) {
    renderAppointmentPrepContent(aiAnalysis.appointmentPrep);
  } else {
    document.getElementById('prep-content').classList.add('hidden');
    document.getElementById('prep-generate').classList.remove('hidden');
    document.getElementById('prep-loading').classList.add('hidden');
  }
}

function renderAppointmentPrepContent(prep) {
  const content = document.getElementById('prep-content');
  const generate = document.getElementById('prep-generate');
  const loading = document.getElementById('prep-loading');
  // AI-Suggested Questions (personalized)
  document.getElementById('prep-questions').innerHTML = (prep.suggestedQuestions || [])
    .map(q => `<li class="flex items-start gap-2"><span class="text-emerald-500">•</span><span>${q}</span></li>`)
    .join('');
  // Relevant care history context
  document.getElementById('prep-history').innerHTML = (prep.relevantHistory || [])
    .map(h => `<li class="flex items-start gap-2"><span class="text-gray-300">—</span><span>${h}</span></li>`)
    .join('');
  // AI Metadata
  const meta = aiAnalysis?.aiMetadata;
  document.getElementById('prep-ai-metadata').innerHTML = meta ? `
    <div class="mt-4 pt-3 border-t border-emerald-100">
      <div class="flex items-center justify-between text-[10px] text-gray-500">
        <div class="flex items-center gap-3">
          <span class="flex items-center gap-1"><span class="text-emerald-500">●</span> ${meta.provider}</span>
          <span>${meta.model}</span>
        </div>
        <div class="flex items-center gap-3">
          <span>${meta.tokensTotal.toLocaleString()} tokens</span>
          <span>${(meta.latencyMs / 1000).toFixed(1)}s</span>
        </div>
      </div>
    </div>
  ` : '';
  content.classList.remove('hidden');
  generate.classList.add('hidden');
  loading.classList.add('hidden');
}

async function generateAppointmentPrep() {
  if (!currentPatient?.upcomingAppointments?.length) return;
  const generate = document.getElementById('prep-generate');
  const loading = document.getElementById('prep-loading');
  generate.classList.add('hidden');
  loading.classList.remove('hidden');
  try {
    const res = await fetch(`${API_BASE}/api/patients/${currentPatient.id}/analyze`, { method: 'POST' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Analysis failed');
    aiAnalysis = json.data;
    if (aiAnalysis.appointmentPrep) {
      renderAppointmentPrepContent(aiAnalysis.appointmentPrep);
    } else {
      throw new Error('No appointment preparation data generated');
    }
    // Also update My Care page
    renderAiInsights();
  } catch (err) {
    console.error('Appointment prep failed:', err);
    loading.classList.add('hidden');
    generate.classList.remove('hidden');
    generate.innerHTML = `
      <p class="text-xs text-red-600 mb-2">${err.message || 'Failed to generate'}</p>
      <button onclick="generateAppointmentPrep()" class="text-xs text-emerald-600 hover:text-emerald-800">Try again</button>
    `;
  }
}

// ─── Cost Explainer ─────────────────────────────────────────────────
function renderCostExplainerCard() {
  const card = document.getElementById('cost-explainer-card');
  const billing = currentPatient.billing;
  const shortcutBalance = document.getElementById('shortcut-balance');
  if (!billing || billing.balanceDue <= 0) {
    card.classList.add('hidden');
    if (shortcutBalance) shortcutBalance.textContent = '';
    return;
  }
  card.classList.remove('hidden');
  if (shortcutBalance) shortcutBalance.textContent = `Balance: $${billing.balanceDue.toFixed(2)}`;
  document.getElementById('cost-balance-info').textContent = 
    `${billing.items.length} services • Total charges: $${billing.totalCharges.toFixed(2)}`;
  document.getElementById('cost-balance-badge').textContent = `$${billing.balanceDue.toFixed(2)} due`;
  // Check if we already have cost explainer from AI analysis
  if (aiAnalysis?.costExplainer) {
    renderCostExplainerContent(aiAnalysis.costExplainer);
  } else {
    document.getElementById('cost-content').classList.add('hidden');
    document.getElementById('cost-generate').classList.remove('hidden');
    document.getElementById('cost-loading').classList.add('hidden');
  }
}

function renderCostExplainerContent(cost) {
  const content = document.getElementById('cost-content');
  const generate = document.getElementById('cost-generate');
  const loading = document.getElementById('cost-loading');
  // Summary
  document.getElementById('cost-summary').textContent = cost.summaryInPlainLanguage || '';
  // Insurance explanation
  document.getElementById('cost-insurance').textContent = cost.insuranceExplanation || '';
  // Payment options
  document.getElementById('cost-options').innerHTML = (cost.paymentOptions || [])
    .map(opt => `<li class="flex items-center gap-2"><span class="text-amber-500">•</span><span>${opt}</span></li>`)
    .join('');
  // Questions
  document.getElementById('cost-questions').innerHTML = (cost.questionsToAsk || [])
    .map(q => `<li class="flex items-start gap-2"><span class="text-gray-300">?</span><span>${q}</span></li>`)
    .join('');
  // AI Metadata
  const meta = aiAnalysis?.aiMetadata;
  document.getElementById('cost-ai-metadata').innerHTML = meta ? `
    <div class="mt-4 pt-3 border-t border-amber-100">
      <div class="flex items-center justify-between text-[10px] text-gray-500">
        <div class="flex items-center gap-3">
          <span class="flex items-center gap-1"><span class="text-amber-500">●</span> ${meta.provider}</span>
          <span>${meta.model}</span>
        </div>
        <div class="flex items-center gap-3">
          <span>${meta.tokensTotal.toLocaleString()} tokens</span>
          <span>${(meta.latencyMs / 1000).toFixed(1)}s</span>
        </div>
      </div>
    </div>
  ` : '';
  content.classList.remove('hidden');
  generate.classList.add('hidden');
  loading.classList.add('hidden');
}

async function generateCostExplainer() {
  if (!currentPatient?.billing?.balanceDue) return;
  const generate = document.getElementById('cost-generate');
  const loading = document.getElementById('cost-loading');
  generate.classList.add('hidden');
  loading.classList.remove('hidden');
  try {
    const res = await fetch(`${API_BASE}/api/patients/${currentPatient.id}/analyze`, { method: 'POST' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Analysis failed');
    aiAnalysis = json.data;
    if (aiAnalysis.costExplainer) {
      renderCostExplainerContent(aiAnalysis.costExplainer);
    } else {
      throw new Error('No cost explanation generated');
    }
    // Also update other sections
    renderAiInsights();
    renderAppointmentPrepCard();
  } catch (err) {
    console.error('Cost explainer failed:', err);
    loading.classList.add('hidden');
    generate.classList.remove('hidden');
    generate.innerHTML = `
      <p class="text-xs text-red-600 mb-2">${err.message || 'Failed to generate'}</p>
      <button onclick="generateCostExplainer()" class="text-xs text-amber-600 hover:text-amber-800">Try again</button>
    `;
  }
}

function scrollToCostExplainer() {
  const card = document.getElementById('cost-explainer-card');
  if (card && !card.classList.contains('hidden')) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('ring-2', 'ring-amber-400');
    setTimeout(() => card.classList.remove('ring-2', 'ring-amber-400'), 2000);
  }
}

// ─── My Care Page ──────────────────────────────────────────────────
function renderMyCarePage() {
  if (!currentPatient) return;
  renderCareTimeline();
  renderAiInsights();
}

function renderCareTimeline() {
  const events = [...currentPatient.careEvents].sort((a, b) => new Date(b.date) - new Date(a.date));
  const container = document.getElementById('care-timeline');
  // Group by month
  const grouped = {};
  events.forEach(e => {
    const monthKey = new Date(e.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!grouped[monthKey]) grouped[monthKey] = [];
    grouped[monthKey].push(e);
  });
  let html = '';
  for (const [month, items] of Object.entries(grouped)) {
    html += `<div class="text-xs text-gray-400 font-medium mb-2 mt-4">${month}</div>`;
    items.forEach(event => {
      const cfg = CATEGORY_CONFIG[event.category] || { icon: '📌', color: 'gray', label: event.category };
      const statusDot = STATUS_COLORS[event.status] || 'bg-gray-300';
      const statusLabel = event.status === 'completed' ? 'Done' :
                          event.status === 'in-progress' ? 'In Progress' :
                          event.status === 'overdue' ? 'Needs Attention' : 'Coming Up';
      html += `
        <div class="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition">
          <div class="w-10 h-10 bg-${cfg.color}-50 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
            ${cfg.icon}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-800">${event.title}</p>
            <p class="text-xs text-gray-500">${event.provider}</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full ${statusDot}"></span>
            <span class="text-xs text-gray-500">${statusLabel}</span>
          </div>
        </div>
      `;
    });
  }
  container.innerHTML = html;
}

// ─── Care Stats ────────────────────────────────────────────────────
function renderCareStats() {
  if (!currentPatient) return '';
  const events = currentPatient.careEvents;
  const total = events.length;
  const completed = events.filter(e => e.status === 'completed').length;
  const overdue = events.filter(e => e.status === 'overdue').length;
  const upcoming = events.filter(e => e.status === 'upcoming').length;
  const inProgress = events.filter(e => e.status === 'in-progress').length;
  // Determine overall status
  let statusColor, statusText, statusIcon;
  if (overdue > 0) {
    statusColor = 'text-amber-600 bg-amber-50 border-amber-200';
    statusText = `${overdue} item${overdue > 1 ? 's' : ''} need${overdue === 1 ? 's' : ''} your attention`;
    statusIcon = '⚠️';
  } else if (upcoming > 0) {
    statusColor = 'text-blue-600 bg-blue-50 border-blue-200';
    statusText = 'You\'re on track with your care plan';
    statusIcon = '✅';
  } else {
    statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
    statusText = 'All caught up!';
    statusIcon = '🎉';
  }
  return `
    <div class="card p-5">
      <div class="flex items-center gap-2 mb-4">
        <span class="text-lg">📊</span>
        <h4 class="text-sm font-semibold text-gray-800">Your Care Status</h4>
      </div>
      <!-- Status Banner -->
      <div class="p-3 rounded-lg border ${statusColor} mb-4">
        <div class="flex items-center gap-2">
          <span class="text-base">${statusIcon}</span>
          <span class="text-sm font-medium">${statusText}</span>
        </div>
      </div>
      <!-- Stats Grid -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-emerald-50 rounded-lg p-3 text-center">
          <p class="text-2xl font-bold text-emerald-600">${completed}</p>
          <p class="text-xs text-emerald-700">Completed</p>
        </div>
        <div class="bg-amber-50 rounded-lg p-3 text-center">
          <p class="text-2xl font-bold text-amber-600">${overdue}</p>
          <p class="text-xs text-amber-700">Needs Attention</p>
        </div>
        <div class="bg-blue-50 rounded-lg p-3 text-center">
          <p class="text-2xl font-bold text-blue-600">${upcoming}</p>
          <p class="text-xs text-blue-700">Upcoming</p>
        </div>
        <div class="bg-purple-50 rounded-lg p-3 text-center">
          <p class="text-2xl font-bold text-purple-600">${inProgress}</p>
          <p class="text-xs text-purple-700">In Progress</p>
        </div>
      </div>
      <p class="text-xs text-gray-400 mt-3 text-center">${completed} of ${total} care events completed</p>
    </div>
  `;
}

// ─── AI Analysis ───────────────────────────────────────────────────
async function triggerAiAnalysis() {
  if (!currentPatient) return;
  const loading = document.getElementById('ai-loading');
  const insights = document.getElementById('ai-insights');
  loading.classList.remove('hidden');
  insights.innerHTML = '';
  aiAnalysis = null;
  try {
    const res = await fetch(`${API_BASE}/api/patients/${currentPatient.id}/analyze`, { method: 'POST' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Analysis failed');
    aiAnalysis = json.data;
    renderAiInsights();
    // Show floating metadata badge
    if (aiAnalysis.aiMetadata) {
      const meta = aiAnalysis.aiMetadata;
      document.getElementById('ai-metadata-wrapper').classList.remove('hidden');
      document.getElementById('ai-metadata').innerHTML = `
        <div class="grid grid-cols-2 gap-2 mt-2">
          <div><span class="text-gray-400">Provider:</span> <span class="font-medium">${meta.provider}</span></div>
          <div><span class="text-gray-400">Model:</span> <span class="font-medium">${meta.model}</span></div>
          <div><span class="text-gray-400">Tokens:</span> <span class="font-medium">${meta.tokensTotal.toLocaleString()}</span></div>
          <div><span class="text-gray-400">Latency:</span> <span class="font-medium">${(meta.latencyMs/1000).toFixed(2)}s</span></div>
        </div>
      `;
    }
  } catch (err) {
    console.error('AI analysis failed:', err);
    // Show error in insights panel
    insights.innerHTML = `
      <div class="card p-5 border-l-4 border-red-400">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-lg">⚠️</span>
          <h4 class="text-sm font-semibold text-red-800">AI Analysis Unavailable</h4>
        </div>
        <p class="text-sm text-red-700">${err.message || 'Unable to analyze care journey'}</p>
        <p class="text-xs text-gray-500 mt-2">This patient may not be configured in the backend. Only P001, P002, P003 are available for AI analysis in this demo.</p>
        <button onclick="triggerAiAnalysis()" class="mt-3 text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition">
          Retry Analysis
        </button>
      </div>
    `;
  } finally {
    loading.classList.add('hidden');
  }
}

function renderAiInsights() {
  const container = document.getElementById('ai-insights');
  if (!aiAnalysis) {
    // Show "Generate" button instead of auto-triggering
    container.innerHTML = `
      <div class="card p-6 text-center border-2 border-dashed border-gray-200">
        <div class="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-3xl">🤖</span>
        </div>
        <h4 class="text-sm font-semibold text-gray-800 mb-2">AI-Powered Care Insights</h4>
        <p class="text-xs text-gray-500 mb-4">Get personalized next steps and care recommendations based on your health journey.</p>
        <button onclick="triggerAiAnalysis()" class="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition shadow-md">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          Generate AI-based Next Best Steps/Actions
        </button>
        <p class="text-[10px] text-gray-400 mt-3">Uses AI tokens • Click to generate</p>
      </div>
    `;
    return;
  }
  const meta = aiAnalysis.aiMetadata;
  let html = `
    <!-- AI Provider Info (POC) -->
    ${meta ? `
    <div class="card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-base">🤖</span>
        <h4 class="text-xs font-semibold text-blue-800">AI Analysis by ${meta.provider}</h4>
      </div>
      <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div class="flex justify-between"><span class="text-blue-600">Model:</span> <span class="font-medium text-blue-900">${meta.model}</span></div>
        <div class="flex justify-between"><span class="text-blue-600">Latency:</span> <span class="font-medium text-blue-900">${(meta.latencyMs/1000).toFixed(2)}s</span></div>
        <div class="flex justify-between"><span class="text-blue-600">Prompt:</span> <span class="font-medium text-blue-900">${meta.tokensPrompt.toLocaleString()} tokens</span></div>
        <div class="flex justify-between"><span class="text-blue-600">Response:</span> <span class="font-medium text-blue-900">${meta.tokensCompletion.toLocaleString()} tokens</span></div>
      </div>
    </div>
    ` : ''}
    <!-- Summary -->
    <div class="card p-5">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-lg">💬</span>
        <h4 class="text-sm font-semibold text-gray-800">Your Health Summary</h4>
      </div>
      <p class="text-[11px] text-ng-teal font-medium mb-2">${aiAnalysis.currentPhase}</p>
      <p class="text-sm text-gray-600 leading-relaxed">${aiAnalysis.journeySummary}</p>
    </div>
    <!-- Care Completion Stats -->
    ${renderCareStats()}
  `;
  // Next Steps with Luma-style action buttons
  if (aiAnalysis.nextBestActions && aiAnalysis.nextBestActions.length > 0) {
    html += `
      <div class="card p-5">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-lg">✨</span>
          <h4 class="text-sm font-semibold text-gray-800">Your Next Steps</h4>
        </div>
        <div class="space-y-3">
    `;
    aiAnalysis.nextBestActions.forEach(action => {
      const cfg = CATEGORY_CONFIG[action.category] || { icon: '📌' };
      const timing = TIMING_STYLES[action.urgency] || TIMING_STYLES.routine;
      // Determine action button based on category
      let actionBtn = '';
      if (action.category === 'visit' || action.category === 'follow-up' || action.category === 'procedure') {
        actionBtn = `<button onclick="showScheduleModal()" class="text-xs bg-ng-blue text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          Schedule
        </button>`;
      } else if (action.category === 'lab' || action.category === 'imaging') {
        actionBtn = `<button onclick="showScheduleModal()" class="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          Book
        </button>`;
      } else {
        actionBtn = `<button onclick="showMessageModal()" class="text-xs bg-gray-600 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
          Ask
        </button>`;
      }
      html += `
        <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-base border border-gray-100">
            ${cfg.icon}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-800">${action.action}</p>
            <p class="text-xs text-gray-500 mt-0.5">${action.reason}</p>
            <div class="flex items-center gap-2 mt-2">
              <span class="step-badge ${timing.bg}">${timing.label}</span>
              <span class="text-[10px] text-gray-400">${action.timeframe}</span>
            </div>
          </div>
          <div class="flex-shrink-0">
            ${actionBtn}
          </div>
        </div>
      `;
    });
    html += `</div></div>`;
  }
  // Care Gaps
  if (aiAnalysis.careGaps && aiAnalysis.careGaps.length > 0) {
    html += `
      <div class="card p-5 border-l-4 border-amber-400">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">📝</span>
          <h4 class="text-sm font-semibold text-amber-800">Friendly Reminders</h4>
        </div>
        <ul class="space-y-2">
          ${aiAnalysis.careGaps.map(g => `
            <li class="flex items-start gap-2 text-sm text-amber-700">
              <span class="text-amber-400 mt-1">○</span>
              <span>${g}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }
  container.innerHTML = html;
}

// ─── Health Summary Page ───────────────────────────────────────────
function renderHealthPage() {
  if (!currentPatient) return;
  const sections = [
    { icon: '💊', label: 'Allergies', data: currentPatient.allergies },
    { icon: '🩺', label: 'Your Conditions', data: currentPatient.conditions },
    { icon: '👨‍👩‍👧', label: 'Family Conditions', data: [] },
    { icon: '💉', label: 'Medications', data: currentPatient.medications },
    { icon: '🛡️', label: 'Immunizations', data: [] },
    { icon: '🏥', label: 'Surgeries and Procedures', data: [] },
    { icon: '🏃', label: 'Lifestyle', data: [] },
  ];
  const container = document.getElementById('health-sections');
  container.innerHTML = sections.map((s, i) => `
    <button onclick="showHealthDetail(${i})" class="card p-4 w-full text-left card-hover flex items-center gap-3">
      <span class="text-lg">${s.icon}</span>
      <span class="text-sm font-medium text-gray-700">${s.label}</span>
      <svg class="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
    </button>
  `).join('');
  window._healthSections = sections;
}

function showHealthDetail(index) {
  const section = window._healthSections[index];
  const detail = document.getElementById('health-detail');
  if (section.data && section.data.length > 0) {
    detail.innerHTML = `
      <h4 class="text-lg font-semibold text-gray-800 mb-4">${section.label}</h4>
      <ul class="space-y-2 text-left">
        ${section.data.map(item => `
          <li class="flex items-center gap-2 text-sm text-gray-700 p-2 bg-gray-50 rounded-lg">
            <span class="text-gray-400">•</span>
            ${item}
          </li>
        `).join('')}
      </ul>
    `;
  } else {
    detail.innerHTML = `
      <div class="text-center py-8">
        <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <p class="text-sm text-gray-500">No ${section.label.toLowerCase()} listed</p>
        <p class="text-xs text-gray-400 mt-1">If this isn't correct, contact your healthcare provider to update your record.</p>
      </div>
    `;
  }
}

// ─── To Do Page ────────────────────────────────────────────────────
function renderTodoPage() {
  const container = document.getElementById('todo-list');
  if (!aiAnalysis || !aiAnalysis.nextBestActions) {
    container.innerHTML = `
      <div class="card p-6 text-center text-gray-400">
        <p class="text-sm">No tasks at this time</p>
      </div>
    `;
    return;
  }
  container.innerHTML = aiAnalysis.nextBestActions.map(action => {
    const cfg = CATEGORY_CONFIG[action.category] || { icon: '📌' };
    const timing = TIMING_STYLES[action.urgency] || TIMING_STYLES.routine;
    return `
      <div class="card p-4 flex items-start gap-4">
        <div class="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-lg">
          ${cfg.icon}
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-800">${action.action}</p>
          <p class="text-xs text-gray-500 mt-1">${action.reason}</p>
          <div class="flex items-center gap-2 mt-2">
            <span class="step-badge ${timing.bg}">${timing.label}</span>
            <span class="text-[10px] text-gray-400">${action.timeframe}</span>
          </div>
        </div>
        <button onclick="showScheduleModal()" class="text-xs bg-ng-dark text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition">
          Take Action
        </button>
      </div>
    `;
  }).join('');
}

// ─── Modals ────────────────────────────────────────────────────────
function showScheduleModal() {
  document.getElementById('schedule-modal').classList.remove('hidden');
}

function showMessageModal() {
  document.getElementById('message-modal').classList.remove('hidden');
  // Populate provider dropdown
  if (currentPatient && currentPatient.careTeam) {
    const select = document.querySelector('#message-modal select');
    select.innerHTML = `<option>Select Provider...</option>` +
      currentPatient.careTeam.map(m => `<option>${m.name} (${m.role})</option>`).join('');
  }
}

function closeModals() {
  document.getElementById('schedule-modal').classList.add('hidden');
  document.getElementById('message-modal').classList.add('hidden');
}

// ─── Home Page AI Analysis ─────────────────────────────────────────
async function triggerAiAnalysisFromHome() {
  if (!currentPatient) return;
  const content = document.getElementById('home-ai-content');
  const loading = document.getElementById('home-ai-loading');
  const result = document.getElementById('home-ai-result');
  // Show loading
  content.classList.add('hidden');
  loading.classList.remove('hidden');
  result.classList.add('hidden');
  try {
    const res = await fetch(`${API_BASE}/api/patients/${currentPatient.id}/analyze`, { method: 'POST' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Analysis failed');
    aiAnalysis = json.data;
    // Show compact result on home page
    const meta = aiAnalysis.aiMetadata;
    const topActions = aiAnalysis.nextBestActions?.slice(0, 2) || [];
    result.innerHTML = `
      <div class="space-y-3">
        ${topActions.map(action => {
          const urgencyColors = { routine: 'bg-gray-100 text-gray-600', soon: 'bg-blue-100 text-blue-700', urgent: 'bg-amber-100 text-amber-700', emergency: 'bg-red-100 text-red-700' };
          return `
            <div class="p-3 bg-white rounded-lg border border-gray-100">
              <div class="flex items-start gap-2">
                <span class="text-sm">✨</span>
                <div class="flex-1">
                  <p class="text-xs font-medium text-gray-800">${action.action}</p>
                  <p class="text-[10px] text-gray-500 mt-0.5">${action.reason}</p>
                </div>
                <span class="text-[9px] px-1.5 py-0.5 rounded ${urgencyColors[action.urgency] || urgencyColors.routine}">${action.urgency}</span>
              </div>
            </div>
          `;
        }).join('')}
        <button onclick="showPage('mycare')" class="w-full text-center text-xs text-blue-600 hover:text-blue-800 font-medium py-2">
          View All ${aiAnalysis.nextBestActions?.length || 0} Recommendations →
        </button>
        ${meta ? `
          <div class="pt-2 border-t border-blue-100 mt-2">
            <div class="flex items-center justify-between text-[9px] text-gray-400">
              <span class="flex items-center gap-1"><span class="text-blue-500">●</span> ${meta.provider} • ${meta.model}</span>
              <span>${meta.tokensTotal.toLocaleString()} tokens • ${(meta.latencyMs / 1000).toFixed(1)}s</span>
            </div>
          </div>
        ` : ''}
      </div>
    `;
    loading.classList.add('hidden');
    result.classList.remove('hidden');
    // Also update My Care page if user navigates there
    renderAiInsights();
  } catch (err) {
    console.error('AI analysis failed:', err);
    loading.classList.add('hidden');
    content.classList.remove('hidden');
    result.innerHTML = `
      <div class="text-center py-2">
        <p class="text-xs text-red-600">${err.message || 'Analysis failed'}</p>
        <button onclick="triggerAiAnalysisFromHome()" class="text-xs text-blue-600 mt-1">Try again</button>
      </div>
    `;
    result.classList.remove('hidden');
    content.classList.add('hidden');
  }
}

// ─── Expose to global ──────────────────────────────────────────────
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.toggleUserMenu = toggleUserMenu;
window.switchPatient = switchPatient;
window.showPage = showPage;
window.showScheduleModal = showScheduleModal;
window.showMessageModal = showMessageModal;
window.closeModals = closeModals;
window.showHealthDetail = showHealthDetail;
window.triggerAiAnalysis = triggerAiAnalysis;
window.triggerAiAnalysisFromHome = triggerAiAnalysisFromHome;
window.generateAppointmentPrep = generateAppointmentPrep;
window.generateCostExplainer = generateCostExplainer;
window.scrollToCostExplainer = scrollToCostExplainer;

// ─── Voice Assistant (Elderly Care) ────────────────────────────────────────
let recognition = null;
let isRecording = false;
let isProcessing = false;
let isSpeaking = false;
let currentTranscript = [];
let conversationStartTime = null;
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;
let autoSendTimeout = null;

// Initialize Web Speech API
function initSpeechRecognition() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.warn('Web Speech API not supported in this browser');
    return null;
  }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  
  recognition.onstart = () => {
    isRecording = true;
    updateVoiceRecordingUI(true);
  };
  
  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript = transcript;
        document.getElementById('voice-text-input').value = finalTranscript;
      } else {
        interimTranscript += transcript;
      }
    }
    
    // Show interim results
    const statusEl = document.getElementById('voice-record-status');
    if (interimTranscript) {
      statusEl.textContent = interimTranscript;
    }
    
    // If we have a final result, auto-send after a short delay
    if (finalTranscript) {
      clearTimeout(autoSendTimeout);
      autoSendTimeout = setTimeout(() => {
        if (finalTranscript.trim()) {
          autoSendVoiceMessage(finalTranscript.trim());
        }
      }, 800); // Wait 800ms after user stops speaking to confirm they're done
    }
  };
  
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    isRecording = false;
    updateVoiceRecordingUI(false);
  };
  
  recognition.onend = () => {
    isRecording = false;
    updateVoiceRecordingUI(false);
  };
  
  return recognition;
}

function updateVoiceRecordingUI(recording) {
  const btn = document.getElementById('voice-record-btn');
  const icon = document.getElementById('voice-record-icon');
  const text = document.getElementById('voice-record-text');
  const status = document.getElementById('voice-record-status');
  
  if (recording) {
    btn.classList.add('border-purple-600', 'bg-purple-100');
    icon.classList.add('animate-pulse');
    text.textContent = 'Listening...';
    status.textContent = 'Speak now...';
  } else {
    btn.classList.remove('border-purple-600', 'bg-purple-100');
    icon.classList.remove('animate-pulse');
    if (isProcessing) {
      text.textContent = 'Processing...';
      status.textContent = 'Please wait';
    } else if (isSpeaking) {
      text.textContent = 'Speaking...';
      status.textContent = 'Please wait';
    } else {
      text.textContent = 'Ready';
      status.textContent = 'Listening for your response';
    }
  }
}

// Speak text using Web Speech API (TTS)
function speakText(text, onEndCallback) {
  // Cancel any ongoing speech
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
  
  // Stop any ongoing recognition when speaking
  if (isRecording && recognition) {
    recognition.stop();
  }
  
  isSpeaking = true;
  updateVoiceRecordingUI(false);
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9; // Slightly slower for elderly
  utterance.pitch = 1;
  utterance.volume = 1;
  
  utterance.onend = () => {
    isSpeaking = false;
    updateVoiceRecordingUI(false);
    if (onEndCallback) {
      onEndCallback();
    }
  };
  
  utterance.onerror = (event) => {
    console.error('Speech synthesis error:', event.error);
    isSpeaking = false;
    updateVoiceRecordingUI(false);
    if (onEndCallback) {
      onEndCallback();
    }
  };
  
  currentUtterance = utterance;
  speechSynthesis.speak(utterance);
}

// Toggle voice assistant - auto-start conversation
function toggleVoiceAssistant() {
  const modal = document.getElementById('voice-modal');
  const fab = document.getElementById('voice-fab');
  const isOpening = modal.classList.contains('hidden');
  
  modal.classList.toggle('hidden');
  fab.classList.toggle('hidden');
  
  if (isOpening) {
    // Reset state
    isProcessing = false;
    isSpeaking = false;
    currentTranscript = [];
    conversationStartTime = Date.now();
    document.getElementById('voice-text-input').value = '';
    document.getElementById('voice-response').classList.add('hidden');
    
    loadTranscripts();
    
    // Initialize speech recognition if not already done
    if (!recognition) {
      recognition = initSpeechRecognition();
    }
    
    // Start the voice conversation flow
    startVoiceConversation();
  } else {
    // Clean up when closing
    clearTimeout(autoSendTimeout);
    if (isRecording && recognition) {
      recognition.stop();
    }
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
  }
}

// Start the voice conversation flow
function startVoiceConversation() {
  const prompt = "What do you need to be done today?";
  
  // Show the prompt in the UI
  const statusEl = document.getElementById('voice-record-status');
  statusEl.textContent = prompt;
  
  // Speak the prompt
  speakText(prompt, () => {
    // After speaking, automatically start listening
    setTimeout(() => {
      startListening();
    }, 500);
  });
}

// Start listening for user input
function startListening() {
  if (!recognition) {
    recognition = initSpeechRecognition();
  }
  
  if (isRecording) {
    return; // Already recording
  }
  
  try {
    recognition.start();
  } catch (e) {
    console.error('Failed to start recognition:', e);
  }
}

// Handle interrupt - if user speaks while processing/speaking
function handleInterrupt() {
  // Cancel any ongoing speech
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
  
  // Cancel any pending auto-send
  clearTimeout(autoSendTimeout);
  
  // Stop processing flag
  isProcessing = false;
  isSpeaking = false;
  
  // Start listening immediately
  startListening();
}

// Get contextual response based on user's question
function getContextualResponse(question) {
  const lowerQ = question.toLowerCase();
  
  // Check for appointments
  if (lowerQ.includes('appointment') || lowerQ.includes('scheduled') || lowerQ.includes('schedule')) {
    if (!currentPatient?.upcomingAppointments || currentPatient.upcomingAppointments.length === 0) {
      return "You don't have any upcoming appointments scheduled.";
    }
    const appts = currentPatient.upcomingAppointments;
    const response = `You have ${appts.length} upcoming appointment${appts.length > 1 ? 's' : ''}. ${appts[0].type} with ${appts[0].provider} on ${new Date(appts[0].date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.`;
    return response;
  }
  
  // Check for medications
  if (lowerQ.includes('medication') || lowerQ.includes('medicine') || lowerQ.includes('drug')) {
    if (!currentPatient?.medications || currentPatient.medications.length === 0) {
      return "You don't have any medications listed in your record.";
    }
    const meds = currentPatient.medications;
    return `You are taking ${meds.length} medication${meds.length > 1 ? 's' : ''}: ${meds.join(', ')}.`;
  }
  
  // Check for allergies
  if (lowerQ.includes('allerg') || lowerQ.includes('allergic')) {
    if (!currentPatient?.allergies || currentPatient.allergies.length === 0) {
      return "You don't have any allergies listed in your record.";
    }
    const allergies = currentPatient.allergies;
    return `You have ${allergies.length} allerg${allergies.length > 1 ? 'ies' : 'y'}: ${allergies.join(', ')}.`;
  }
  
  // Check for conditions
  if (lowerQ.includes('condition') || lowerQ.includes('diagnos')) {
    if (!currentPatient?.conditions || currentPatient.conditions.length === 0) {
      return "You don't have any conditions listed in your record.";
    }
    const conditions = currentPatient.conditions;
    return `Your conditions include: ${conditions.join(', ')}.`;
  }
  
  // Check for care team
  if (lowerQ.includes('care team') || lowerQ.includes('doctor') || lowerQ.includes('provider')) {
    if (!currentPatient?.careTeam || currentPatient.careTeam.length === 0) {
      return "You don't have a care team listed in your record.";
    }
    const team = currentPatient.careTeam.map(m => `${m.name}, your ${m.role}`).join('; ');
    return `Your care team includes: ${team}.`;
  }
  
  // Check for billing/costs
  if (lowerQ.includes('bill') || lowerQ.includes('cost') || lowerQ.includes('balance') || lowerQ.includes('payment') || lowerQ.includes('owe')) {
    if (!currentPatient?.billing || currentPatient.billing.balanceDue <= 0) {
      return "You don't have any outstanding balance.";
    }
    return `You have a balance of $${currentPatient.billing.balanceDue.toFixed(2)} due for ${currentPatient.billing.items.length} services.`;
  }
  
  // Check for to-do items
  if (lowerQ.includes('to do') || lowerQ.includes('todo') || lowerQ.includes('task') || lowerQ.includes('need to do')) {
    if (!aiAnalysis?.nextBestActions || aiAnalysis.nextBestActions.length === 0) {
      return "You don't have any pending tasks. You're all caught up!";
    }
    const actions = aiAnalysis.nextBestActions.slice(0, 3).map(a => a.action).join(', ');
    return `Your top tasks are: ${actions}.`;
  }
  
  // Default: get AI analysis
  return null;
}

// Auto-send voice message (called when speech ends)
async function autoSendVoiceMessage(message) {
  if (!message || isProcessing) return;
  
  isProcessing = true;
  updateVoiceRecordingUI(false);
  
  // Add user message to transcript
  currentTranscript.push({
    role: 'user',
    text: message,
    timestamp: new Date().toISOString(),
  });
  
  // Show loading
  const responseDiv = document.getElementById('voice-response');
  const responseText = document.getElementById('voice-response-text');
  responseDiv.classList.remove('hidden');
  responseText.textContent = 'Thinking...';
  
  try {
    // First try to get a contextual response based on the question
    let aiResponse = getContextualResponse(message);
    
    // If no contextual response, fall back to AI analysis
    if (!aiResponse) {
      const res = await fetch(`${API_BASE}/api/patients/${currentPatient.id}/analyze`, { method: 'POST' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Analysis failed');
      
      // Use journey summary as response for demo
      aiResponse = json.data.journeySummary || json.data.nextBestActions?.[0]?.action || 'I understand your question. Let me help you with that.';
    }
    
    responseText.textContent = aiResponse;
    
    // Add assistant response to transcript
    currentTranscript.push({
      role: 'assistant',
      text: aiResponse,
      timestamp: new Date().toISOString(),
    });
    
    // Save conversation
    if (currentTranscript.length > 0) {
      await saveConversation(currentTranscript);
    }
    
    // Clear input
    document.getElementById('voice-text-input').value = '';
    
    // Speak the response
    isProcessing = false;
    speakText(aiResponse, () => {
      // After speaking response, listen for next input
      setTimeout(() => {
        startListening();
      }, 500);
    });
  } catch (err) {
    console.error('Voice message failed:', err);
    responseText.textContent = 'Sorry, I had trouble understanding. Please try again.';
    isProcessing = false;
    // Listen again after error
    setTimeout(() => {
      startListening();
    }, 1000);
  }
}

// Manual send (kept for fallback, but not used in auto-flow)
async function sendVoiceMessage() {
  const textInput = document.getElementById('voice-text-input');
  const message = textInput.value.trim();
  if (!message) return;
  
  await autoSendVoiceMessage(message);
}

async function playVoiceResponse() {
  const responseText = document.getElementById('voice-response-text').textContent;
  if (!responseText) return;
  
  try {
    const res = await fetch(`${API_BASE}/api/voice/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: responseText, voice: 'alloy' }),
    });
    
    if (!res.ok) {
      throw new Error('TTS failed');
    }
    
    const audioBlob = await res.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
  } catch (err) {
    console.error('TTS failed:', err);
    alert('Voice playback failed. Text is available to read instead.');
  }
}

async function saveConversation(transcript) {
  if (!currentPatient) return;
  
  const duration = conversationStartTime ? Date.now() - conversationStartTime : 0;
  const summary = transcript.map(t => `${t.role === 'user' ? 'You' : 'AI'}: ${t.text}`).join('\n');
  
  try {
    await fetch(`${API_BASE}/api/voice/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: currentPatient.id,
        transcript,
        duration,
        summary,
      }),
    });
    loadTranscripts();
  } catch (err) {
    console.error('Failed to save conversation:', err);
  }
}

async function loadTranscripts() {
  if (!currentPatient) return;
  
  try {
    const res = await fetch(`${API_BASE}/api/voice/conversations/${currentPatient.id}`);
    const json = await res.json();
    if (!json.success) return;
    
    const container = document.getElementById('voice-transcripts');
    if (!json.data || json.data.length === 0) {
      container.innerHTML = '<p class="text-sm text-gray-500 text-center py-4">No conversations yet</p>';
      return;
    }
    
    container.innerHTML = json.data.map(conv => `
      <div class="p-3 bg-gray-50 rounded-lg">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-gray-500">${new Date(conv.timestamp).toLocaleDateString()}</span>
          <span class="text-xs text-gray-400">${conv.transcript.length} messages</span>
        </div>
        <p class="text-sm text-gray-700 line-clamp-2">${conv.summary || 'Conversation saved'}</p>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load transcripts:', err);
  }
}

// Show voice FAB when logged in
function showVoiceFab() {
  const fab = document.getElementById('voice-fab');
  if (fab && currentPatient) {
    fab.classList.remove('hidden');
  }
}

window.toggleVoiceAssistant = toggleVoiceAssistant;
window.handleInterrupt = handleInterrupt;
window.sendVoiceMessage = sendVoiceMessage;
window.playVoiceResponse = playVoiceResponse;
window.loadTranscripts = loadTranscripts;
