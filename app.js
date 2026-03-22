import { createSmallBizPayApi, smallBizPaySupabaseConfig } from './supabase_rpc_client.js';

const routes = {
  dashboard: { title: 'מבט כללי על העסק', eyebrow: 'לוח בקרה' },
  employees: { title: 'ניהול עובדים', eyebrow: 'עובדים' },
  'job-types': { title: 'סוגי עבודה ותעריפים', eyebrow: 'סוגי עבודה' },
  'work-logs': { title: 'ניהול דיווחי עבודה', eyebrow: 'יומני עבודה' },
  payments: { title: 'תשלומים ויתרות', eyebrow: 'תשלומים' },
  settings: { title: 'הגדרות וחיבורי מערכת', eyebrow: 'הגדרות' },
};

const paymentMethodLabels = {
  quantity: 'לפי כמות',
  hourly: 'לפי שעות',
  fixed: 'תשלום קבוע',
  hours: 'לפי שעות',
};

const state = {
  route: 'dashboard',
  api: null,
  employees: [],
  jobTypes: [],
  rates: [],
  workLogs: [],
  payments: [],
  balances: [],
  dashboard: null,
  selectedEmployeeId: '',
  selectedJobTypeId: '',
  editingEmployeeId: null,
  editingJobTypeId: null,
  editingRateId: null,
  editingWorkLogId: null,
  connectionState: 'מתחבר...',
  query: '',
};

const el = {
  pageTitle: document.getElementById('pageTitle'),
  pageEyebrow: document.getElementById('pageEyebrow'),
  dashboardStats: document.getElementById('dashboardStats'),
  balancesList: document.getElementById('balancesList'),
  employeesTable: document.getElementById('employeesTable'),
  jobTypesTable: document.getElementById('jobTypesTable'),
  ratesJobTypeFilter: document.getElementById('ratesJobTypeFilter'),
  ratesTable: document.getElementById('ratesTable'),
  workLogsTable: document.getElementById('workLogsTable'),
  paymentsTable: document.getElementById('paymentsTable'),
  paymentsEmployeeFilter: document.getElementById('paymentsEmployeeFilter'),
  employeeBalanceCard: document.getElementById('employeeBalanceCard'),
  settingsProjectUrl: document.getElementById('settingsProjectUrl'),
  settingsAnonKey: document.getElementById('settingsAnonKey'),
  connectionState: document.getElementById('connectionState'),
  rpcList: document.getElementById('rpcList'),
  modal: document.getElementById('modal'),
  modalTitle: document.getElementById('modalTitle'),
  modalEyebrow: document.getElementById('modalEyebrow'),
  modalBody: document.getElementById('modalBody'),
  modalSubmit: document.getElementById('modalSubmit'),
  toast: document.getElementById('toast'),
  workLogsFrom: document.getElementById('workLogsFrom'),
  workLogsTo: document.getElementById('workLogsTo'),
  globalSearch: document.getElementById('globalSearch'),
};

const rpcNames = [
  'get_dashboard_summary',
  'get_dashboard_summary_by_range',
  'get_employees',
  'get_employee_details',
  'create_employee',
  'update_employee',
  'get_job_types',
  'create_job_type',
  'update_job_type',
  'delete_job_type',
  'get_rates',
  'create_rate',
  'update_rate',
  'close_rate',
  'delete_rate',
  'get_work_logs',
  'get_work_logs_by_employee',
  'api_create_work_log',
  'update_work_log',
  'delete_work_log',
  'create_payment',
  'get_payments',
  'get_payments_by_range',
  'get_employee_balance',
  'get_employees_balances',
];

function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

function formatCurrency(value) {
  const number = Number(value ?? 0);
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 }).format(number);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function statusBadge(status) {
  const normalized = String(status ?? '').toLowerCase();
  const map = {
    active: ['פעיל', 'badge badge--success'],
    inactive: ['לא פעיל', 'badge badge--neutral'],
    cancelled: ['מבוטל', 'badge badge--danger'],
    deleted: ['נמחק', 'badge badge--danger'],
    closed: ['סגור', 'badge badge--warning'],
  };
  const [label, className] = map[normalized] || [status || '-', 'badge badge--warning'];
  return `<span class="${className}">${escapeHtml(label)}</span>`;
}

function paymentMethodLabel(method) {
  return paymentMethodLabels[String(method ?? '').toLowerCase()] || method || '-';
}

function showToast(message, isError = false) {
  el.toast.textContent = message;
  el.toast.style.background = isError ? '#7f1d1d' : '#111827';
  el.toast.classList.add('is-visible');
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => el.toast.classList.remove('is-visible'), 2600);
}

function withFallback(value, fallback = '-') {
  return value === null || value === undefined || value === '' ? fallback : value;
}

function normalizeRows(data) {
  return Array.isArray(data) ? data : data ? [data] : [];
}

function getEmployeeName(id) {
  const employee = state.employees.find((item) => item.id === id);
  return employee?.name || id || 'ללא עובד';
}

function getJobTypeName(id) {
  const item = state.jobTypes.find((jobType) => jobType.id === id);
  return item?.name || id || 'ללא סוג עבודה';
}

function filteredItems(items, fields) {
  if (!state.query.trim()) return items;
  const term = state.query.trim().toLowerCase();
  return items.filter((item) => fields.some((field) => String(item?.[field] ?? '').toLowerCase().includes(term)));
}

function setRoute(route) {
  if (!routes[route]) route = 'dashboard';
  state.route = route;
  window.location.hash = route;
  el.pageTitle.textContent = routes[route].title;
  el.pageEyebrow.textContent = routes[route].eyebrow;

  qsa('.nav-link').forEach((button) => button.classList.toggle('is-active', button.dataset.route === route));
  qsa('.view').forEach((view) => view.classList.toggle('is-active', view.dataset.view === route));

  if (route === 'payments' && state.selectedEmployeeId) {
    loadPaymentsAndBalance(state.selectedEmployeeId);
  }
  if (route === 'job-types' && state.selectedJobTypeId) {
    loadRates(state.selectedJobTypeId);
  }
}

function renderDashboard() {
  const summary = state.dashboard || {};
  const cards = [
    { label: 'עובדים', value: summary.employees_count ?? state.employees.length, icon: 'group' },
    { label: 'עבודה היום', value: summary.work_today ?? summary.today_work ?? 0, icon: 'today' },
    { label: 'עבודה החודש', value: summary.work_month ?? summary.month_work ?? 0, icon: 'monitoring' },
    { label: 'תשלומים חודש', value: formatCurrency(summary.payments_month ?? summary.month_payments ?? 0), icon: 'payments' },
  ];

  el.dashboardStats.innerHTML = cards
    .map(
      (card) => `
        <article class="stat-card">
          <div class="stat-card__top">
            <div class="stat-card__icon material-symbols-outlined">${card.icon}</div>
          </div>
          <div>
            <p>${escapeHtml(card.label)}</p>
            <strong>${escapeHtml(card.value)}</strong>
          </div>
        </article>
      `,
    )
    .join('');

  const balances = filteredItems(state.balances, ['name', 'employee_name']).slice(0, 8);
  el.balancesList.innerHTML = balances.length
    ? balances
        .map((item) => {
          const name = item.name || item.employee_name || getEmployeeName(item.employee_id);
          const balance = item.balance ?? item.total_balance ?? 0;
          return `
            <div class="list-item">
              <div>
                <strong>${escapeHtml(name)}</strong>
                <p class="text-muted">${escapeHtml(item.role || 'עובד')}</p>
              </div>
              <strong>${escapeHtml(formatCurrency(balance))}</strong>
            </div>
          `;
        })
        .join('')
    : '<div class="list-item"><span>אין נתוני יתרות להצגה</span></div>';
}

function renderEmployees() {
  const employees = filteredItems(state.employees, ['name', 'phone', 'role', 'status']);
  el.employeesTable.innerHTML = employees.length
    ? employees
        .map(
          (employee) => `
            <tr>
              <td><strong>${escapeHtml(employee.name)}</strong><div class="text-muted">${escapeHtml(employee.id || '')}</div></td>
              <td>${escapeHtml(withFallback(employee.phone))}</td>
              <td>${escapeHtml(withFallback(employee.role))}</td>
              <td>${statusBadge(employee.status)}</td>
              <td>
                <div class="actions-inline">
                  <button class="button button--secondary js-edit-employee" data-id="${escapeHtml(employee.id)}">ערוך</button>
                  <button class="button button--secondary js-open-payments" data-id="${escapeHtml(employee.id)}">תשלומים</button>
                </div>
              </td>
            </tr>
          `,
        )
        .join('')
    : '<tr><td colspan="5">לא נמצאו עובדים.</td></tr>';
}

function renderJobTypes() {
  const jobTypes = filteredItems(state.jobTypes, ['name', 'payment_method', 'status', 'notes']);
  el.jobTypesTable.innerHTML = jobTypes.length
    ? jobTypes
        .map(
          (jobType) => `
            <tr>
              <td><strong>${escapeHtml(jobType.name)}</strong><div class="text-muted">${escapeHtml(jobType.id || '')}</div></td>
              <td>${escapeHtml(paymentMethodLabel(jobType.payment_method))}</td>
              <td>${statusBadge(jobType.status)}</td>
              <td>${escapeHtml(withFallback(jobType.notes))}</td>
              <td>
                <div class="actions-inline">
                  <button class="button button--secondary js-edit-job-type" data-id="${escapeHtml(jobType.id)}">ערוך</button>
                  <button class="button button--secondary js-show-rates" data-id="${escapeHtml(jobType.id)}">תעריפים</button>
                  <button class="button button--secondary js-delete-job-type" data-id="${escapeHtml(jobType.id)}">מחק</button>
                </div>
              </td>
            </tr>
          `,
        )
        .join('')
    : '<tr><td colspan="5">לא נמצאו סוגי עבודה.</td></tr>';
}

function renderRatesFilter() {
  const options = state.jobTypes
    .map((jobType) => `<option value="${escapeHtml(jobType.id)}">${escapeHtml(jobType.name)}</option>`)
    .join('');
  el.ratesJobTypeFilter.innerHTML = `<option value="">בחר סוג עבודה</option>${options}`;
  if (state.selectedJobTypeId) el.ratesJobTypeFilter.value = state.selectedJobTypeId;
}

function renderRates() {
  el.ratesTable.innerHTML = state.rates.length
    ? state.rates
        .map(
          (rate) => `
            <tr>
              <td><strong>${escapeHtml(formatCurrency(rate.amount))}</strong></td>
              <td>${escapeHtml(withFallback(rate.start_date))}</td>
              <td>${escapeHtml(withFallback(rate.end_date, 'ללא סיום'))}</td>
              <td>
                <div class="actions-inline">
                  <button class="button button--secondary js-edit-rate" data-id="${escapeHtml(rate.id)}">ערוך</button>
                  <button class="button button--secondary js-close-rate" data-id="${escapeHtml(rate.id)}">סגור</button>
                  <button class="button button--secondary js-delete-rate" data-id="${escapeHtml(rate.id)}">מחק</button>
                </div>
              </td>
            </tr>
          `,
        )
        .join('')
    : '<tr><td colspan="4">בחר סוג עבודה כדי לטעון תעריפים.</td></tr>';
}

function renderWorkLogs() {
  const logs = filteredItems(state.workLogs, ['notes', 'status', 'employee_id', 'date']);
  el.workLogsTable.innerHTML = logs.length
    ? logs
        .map(
          (log) => `
            <tr>
              <td>${escapeHtml(withFallback(log.date))}</td>
              <td>${escapeHtml(log.employee_name || getEmployeeName(log.employee_id))}</td>
              <td>${escapeHtml(withFallback(log.quantity))}</td>
              <td>${escapeHtml(withFallback(log.hours_minutes || log.p_hours))}</td>
              <td>${escapeHtml(withFallback(log.notes))}</td>
              <td>${statusBadge(log.status)}</td>
              <td>
                <div class="actions-inline">
                  <button class="button button--secondary js-edit-log" data-id="${escapeHtml(log.id)}">ערוך</button>
                  <button class="button button--secondary js-delete-log" data-id="${escapeHtml(log.id)}">מחק</button>
                </div>
              </td>
            </tr>
          `,
        )
        .join('')
    : '<tr><td colspan="7">אין דיווחים בטווח התאריכים שנבחר.</td></tr>';
}

function renderPayments() {
  el.paymentsTable.innerHTML = state.payments.length
    ? state.payments
        .map(
          (payment) => `
            <tr>
              <td>${escapeHtml(withFallback(payment.date))}</td>
              <td><strong>${escapeHtml(formatCurrency(payment.amount))}</strong></td>
              <td>${escapeHtml(withFallback(payment.notes))}</td>
            </tr>
          `,
        )
        .join('')
    : '<tr><td colspan="3">לא נמצאו תשלומים לעובד שנבחר.</td></tr>';
}

function renderPaymentsFilter() {
  const options = state.employees
    .map((employee) => `<option value="${escapeHtml(employee.id)}">${escapeHtml(employee.name)}</option>`)
    .join('');
  el.paymentsEmployeeFilter.innerHTML = `<option value="">בחר עובד</option>${options}`;
  if (state.selectedEmployeeId) el.paymentsEmployeeFilter.value = state.selectedEmployeeId;
}

function renderSettings() {
  el.settingsProjectUrl.textContent = smallBizPaySupabaseConfig.url;
  el.settingsAnonKey.textContent = `${smallBizPaySupabaseConfig.anonKey.slice(0, 24)}...`;
  el.connectionState.textContent = state.connectionState;
  el.rpcList.innerHTML = rpcNames.map((name) => `<li><code>${name}</code></li>`).join('');
}

function renderAll() {
  renderDashboard();
  renderEmployees();
  renderJobTypes();
  renderRatesFilter();
  renderRates();
  renderWorkLogs();
  renderPayments();
  renderPaymentsFilter();
  renderSettings();
}

function collectFormData() {
  const fields = qsa('[name]', el.modalBody);
  return Object.fromEntries(fields.map((field) => [field.name, field.value]));
}

function employeeFields(employee = {}) {
  return `
    <label class="field">
      <span>שם</span>
      <input name="name" value="${escapeHtml(employee.name || '')}" required />
    </label>
    <label class="field">
      <span>טלפון</span>
      <input name="phone" value="${escapeHtml(employee.phone || '')}" />
    </label>
    <label class="field">
      <span>תפקיד</span>
      <input name="role" value="${escapeHtml(employee.role || '')}" required />
    </label>
    <label class="field">
      <span>סטטוס</span>
      <select name="status">
        <option value="active" ${(employee.status || 'active') === 'active' ? 'selected' : ''}>active</option>
        <option value="inactive" ${employee.status === 'inactive' ? 'selected' : ''}>inactive</option>
      </select>
    </label>
  `;
}

function jobTypeFields(jobType = {}) {
  return `
    <label class="field">
      <span>שם</span>
      <input name="name" value="${escapeHtml(jobType.name || '')}" required />
    </label>
    <label class="field">
      <span>שיטת תשלום</span>
      <select name="paymentMethod">
        <option value="quantity" ${(jobType.payment_method || '') === 'quantity' ? 'selected' : ''}>quantity</option>
        <option value="hourly" ${(jobType.payment_method || '') === 'hourly' ? 'selected' : ''}>hourly</option>
        <option value="fixed" ${(jobType.payment_method || '') === 'fixed' ? 'selected' : ''}>fixed</option>
      </select>
    </label>
    <label class="field">
      <span>סטטוס</span>
      <select name="status">
        <option value="active" ${(jobType.status || 'active') === 'active' ? 'selected' : ''}>active</option>
        <option value="inactive" ${jobType.status === 'inactive' ? 'selected' : ''}>inactive</option>
      </select>
    </label>
    <label class="field field--full">
      <span>הערות</span>
      <textarea name="notes">${escapeHtml(jobType.notes || '')}</textarea>
    </label>
  `;
}

function rateFields(rate = {}) {
  const options = state.jobTypes
    .map((jobType) => `<option value="${escapeHtml(jobType.id)}" ${jobType.id === (rate.job_type_id || state.selectedJobTypeId) ? 'selected' : ''}>${escapeHtml(jobType.name)}</option>`)
    .join('');
  return `
    <label class="field">
      <span>סוג עבודה</span>
      <select name="jobTypeId" ${rate.id ? 'disabled' : ''} required>
        <option value="">בחר סוג עבודה</option>
        ${options}
      </select>
    </label>
    <label class="field">
      <span>סכום</span>
      <input type="number" step="0.01" name="amount" value="${escapeHtml(rate.amount ?? '')}" required />
    </label>
    <label class="field">
      <span>מתאריך</span>
      <input type="date" name="startDate" value="${escapeHtml(rate.start_date || today())}" ${rate.id ? 'disabled' : ''} required />
    </label>
    <label class="field">
      <span>עד תאריך</span>
      <input type="date" name="endDate" value="${escapeHtml(rate.end_date || '')}" />
    </label>
  `;
}

function workLogFields(log = {}) {
  const employeeOptions = state.employees
    .map((employee) => `<option value="${escapeHtml(employee.id)}" ${employee.id === log.employee_id ? 'selected' : ''}>${escapeHtml(employee.name)}</option>`)
    .join('');
  const jobTypeOptions = state.jobTypes
    .map((jobType) => `<option value="${escapeHtml(jobType.id)}" ${jobType.id === log.job_type_id ? 'selected' : ''}>${escapeHtml(jobType.name)}</option>`)
    .join('');
  return `
    <label class="field">
      <span>עובד</span>
      <select name="employeeId" ${log.id ? 'disabled' : ''} required>
        <option value="">בחר עובד</option>
        ${employeeOptions}
      </select>
    </label>
    <label class="field">
      <span>סוג עבודה</span>
      <select name="jobTypeId" ${log.id ? 'disabled' : ''} required>
        <option value="">בחר סוג עבודה</option>
        ${jobTypeOptions}
      </select>
    </label>
    <label class="field">
      <span>תאריך</span>
      <input type="date" name="date" value="${escapeHtml(log.date || today())}" ${log.id ? 'disabled' : ''} required />
    </label>
    <label class="field">
      <span>כמות</span>
      <input type="number" step="0.01" name="quantity" value="${escapeHtml(log.quantity ?? '')}" />
    </label>
    <label class="field">
      <span>שעות (HH:mm)</span>
      <input name="hours" value="${escapeHtml(log.hours_minutes || '')}" placeholder="08:30" />
    </label>
    <label class="field">
      <span>סטטוס</span>
      <select name="status">
        <option value="active" ${(log.status || 'active') === 'active' ? 'selected' : ''}>active</option>
        <option value="cancelled" ${log.status === 'cancelled' ? 'selected' : ''}>cancelled</option>
      </select>
    </label>
    <label class="field field--full">
      <span>הערות</span>
      <textarea name="notes">${escapeHtml(log.notes || '')}</textarea>
    </label>
  `;
}

function paymentFields() {
  const employeeOptions = state.employees
    .map((employee) => `<option value="${escapeHtml(employee.id)}">${escapeHtml(employee.name)}</option>`)
    .join('');
  return `
    <label class="field">
      <span>עובד</span>
      <select name="employeeId" required>
        <option value="">בחר עובד</option>
        ${employeeOptions}
      </select>
    </label>
    <label class="field">
      <span>סכום</span>
      <input type="number" step="0.01" name="amount" required />
    </label>
    <label class="field">
      <span>תאריך</span>
      <input type="date" name="date" value="${today()}" required />
    </label>
    <label class="field field--full">
      <span>הערות</span>
      <textarea name="notes"></textarea>
    </label>
  `;
}

function openModal(kind, payload = null) {
  state.editingEmployeeId = null;
  state.editingJobTypeId = null;
  state.editingRateId = null;
  state.editingWorkLogId = null;

  if (kind === 'employee') {
    const employee = payload || {};
    state.editingEmployeeId = employee.id || null;
    el.modalEyebrow.textContent = employee.id ? 'עריכת עובד' : 'עובד חדש';
    el.modalTitle.textContent = employee.id ? 'עדכון פרטי עובד' : 'יצירת עובד חדש';
    el.modalBody.innerHTML = employeeFields(employee);
    el.modalSubmit.onclick = submitEmployee;
  }

  if (kind === 'job-type') {
    const jobType = payload || {};
    state.editingJobTypeId = jobType.id || null;
    el.modalEyebrow.textContent = jobType.id ? 'עריכת סוג עבודה' : 'סוג עבודה חדש';
    el.modalTitle.textContent = jobType.id ? 'עדכון סוג עבודה' : 'יצירת סוג עבודה';
    el.modalBody.innerHTML = jobTypeFields(jobType);
    el.modalSubmit.onclick = submitJobType;
  }

  if (kind === 'rate') {
    const rate = payload || {};
    state.editingRateId = rate.id || null;
    el.modalEyebrow.textContent = rate.id ? 'עריכת תעריף' : 'תעריף חדש';
    el.modalTitle.textContent = rate.id ? 'עדכון תעריף' : 'יצירת תעריף';
    el.modalBody.innerHTML = rateFields(rate);
    el.modalSubmit.onclick = submitRate;
  }

  if (kind === 'work-log') {
    const log = payload || {};
    state.editingWorkLogId = log.id || null;
    el.modalEyebrow.textContent = log.id ? 'עריכת דיווח' : 'דיווח חדש';
    el.modalTitle.textContent = log.id ? 'עדכון דיווח עבודה' : 'יצירת דיווח עבודה';
    el.modalBody.innerHTML = workLogFields(log);
    el.modalSubmit.onclick = submitWorkLog;
  }

  if (kind === 'payment') {
    el.modalEyebrow.textContent = 'תשלום חדש';
    el.modalTitle.textContent = 'יצירת תשלום';
    el.modalBody.innerHTML = paymentFields();
    el.modalSubmit.onclick = submitPayment;
  }

  el.modal.showModal();
}

async function submitEmployee() {
  const values = collectFormData();
  try {
    if (state.editingEmployeeId) {
      await state.api.updateEmployee({
        id: state.editingEmployeeId,
        name: values.name,
        phone: values.phone,
        role: values.role,
        status: values.status,
      });
      showToast('העובד עודכן בהצלחה');
    } else {
      await state.api.createEmployee({ name: values.name, phone: values.phone, role: values.role });
      showToast('העובד נוצר בהצלחה');
    }
    el.modal.close();
    await loadEmployees();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function submitJobType() {
  const values = collectFormData();
  try {
    if (state.editingJobTypeId) {
      await state.api.updateJobType({
        id: state.editingJobTypeId,
        name: values.name,
        paymentMethod: values.paymentMethod,
        status: values.status,
        notes: values.notes,
      });
      showToast('סוג העבודה עודכן בהצלחה');
    } else {
      await state.api.createJobType({
        name: values.name,
        paymentMethod: values.paymentMethod,
        status: values.status,
        notes: values.notes,
      });
      showToast('סוג העבודה נוצר בהצלחה');
    }
    el.modal.close();
    await loadJobTypes();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function submitRate() {
  const values = collectFormData();
  try {
    if (state.editingRateId) {
      const currentRate = state.rates.find((item) => item.id === state.editingRateId) || {};
      await state.api.updateRate({
        id: state.editingRateId,
        amount: Number(values.amount),
        startDate: currentRate.start_date || today(),
        endDate: values.endDate || null,
      });
      showToast('התעריף עודכן בהצלחה');
    } else {
      await state.api.createRate({
        jobTypeId: values.jobTypeId,
        amount: Number(values.amount),
        startDate: values.startDate,
        endDate: values.endDate || null,
      });
      showToast('התעריף נוצר בהצלחה');
    }
    el.modal.close();
    await loadRates(state.selectedJobTypeId || values.jobTypeId);
  } catch (error) {
    showToast(error.message, true);
  }
}

async function submitWorkLog() {
  const values = collectFormData();
  try {
    if (state.editingWorkLogId) {
      await state.api.updateWorkLog({
        id: state.editingWorkLogId,
        quantity: values.quantity ? Number(values.quantity) : null,
        hours: values.hours || null,
        notes: values.notes,
        status: values.status,
      });
      showToast('הדיווח עודכן בהצלחה');
    } else {
      await state.api.createWorkLog({
        employeeId: values.employeeId,
        jobTypeId: values.jobTypeId,
        date: values.date,
        quantity: values.quantity ? Number(values.quantity) : null,
        hours: values.hours || null,
        notes: values.notes,
      });
      showToast('הדיווח נוצר בהצלחה');
    }
    el.modal.close();
    await loadWorkLogs();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function submitPayment() {
  const values = collectFormData();
  try {
    await state.api.createPayment({
      employeeId: values.employeeId,
      amount: Number(values.amount),
      date: values.date,
      notes: values.notes,
    });
    showToast('התשלום נוצר בהצלחה');
    el.modal.close();
    state.selectedEmployeeId = values.employeeId;
    await loadPaymentsAndBalance(values.employeeId);
  } catch (error) {
    showToast(error.message, true);
  }
}

async function loadDashboard() {
  try {
    const result = await state.api.getDashboardSummary();
    state.dashboard = Array.isArray(result) ? result[0] || {} : result || {};
  } catch (error) {
    showToast(`לא ניתן לטעון דשבורד: ${error.message}`, true);
  }
}

async function loadEmployees() {
  try {
    state.employees = normalizeRows(await state.api.getEmployees());
    if (!state.selectedEmployeeId && state.employees[0]?.id) state.selectedEmployeeId = state.employees[0].id;
    renderPaymentsFilter();
  } catch (error) {
    showToast(`לא ניתן לטעון עובדים: ${error.message}`, true);
  }
  renderEmployees();
}

async function loadJobTypes() {
  try {
    state.jobTypes = normalizeRows(await state.api.getJobTypes());
    if (!state.selectedJobTypeId && state.jobTypes[0]?.id) state.selectedJobTypeId = state.jobTypes[0].id;
    renderRatesFilter();
    if (state.selectedJobTypeId) await loadRates(state.selectedJobTypeId);
  } catch (error) {
    showToast(`לא ניתן לטעון סוגי עבודה: ${error.message}`, true);
  }
  renderJobTypes();
}

async function loadRates(jobTypeId) {
  if (!jobTypeId) {
    state.rates = [];
    renderRates();
    return;
  }

  try {
    state.selectedJobTypeId = jobTypeId;
    state.rates = normalizeRows(await state.api.getRates({ jobTypeId }));
  } catch (error) {
    showToast(`לא ניתן לטעון תעריפים: ${error.message}`, true);
  }
  renderRatesFilter();
  renderRates();
}

async function loadBalances() {
  try {
    state.balances = normalizeRows(await state.api.getEmployeesBalances());
  } catch (error) {
    showToast(`לא ניתן לטעון יתרות: ${error.message}`, true);
  }
}

async function loadWorkLogs() {
  try {
    const from = el.workLogsFrom.value || firstDayOfMonth();
    const to = el.workLogsTo.value || today();
    el.workLogsFrom.value = from;
    el.workLogsTo.value = to;
    state.workLogs = normalizeRows(await state.api.getWorkLogs({ from, to }));
  } catch (error) {
    showToast(`לא ניתן לטעון דיווחים: ${error.message}`, true);
  }
  renderWorkLogs();
}

async function loadPaymentsAndBalance(employeeId) {
  if (!employeeId) {
    state.payments = [];
    el.employeeBalanceCard.innerHTML = '<p>בחר עובד כדי לראות תשלומים ויתרה.</p>';
    renderPayments();
    return;
  }

  try {
    state.selectedEmployeeId = employeeId;
    state.payments = normalizeRows(await state.api.getPayments({ employeeId }));
    const balance = await state.api.getEmployeeBalance({ employeeId });
    const balanceRow = Array.isArray(balance) ? balance[0] || {} : balance;
    const balanceValue = balanceRow?.balance ?? balanceRow?.total_balance ?? balanceRow ?? 0;
    el.employeeBalanceCard.innerHTML = `
      <p>${escapeHtml(getEmployeeName(employeeId))}</p>
      <strong>${escapeHtml(formatCurrency(balanceValue))}</strong>
      <p>הסכום מחושב ישירות מפונקציית get_employee_balance</p>
    `;
  } catch (error) {
    showToast(`לא ניתן לטעון תשלומים: ${error.message}`, true);
  }
  renderPayments();
}

async function refreshAll() {
  await Promise.all([loadDashboard(), loadEmployees(), loadJobTypes(), loadBalances()]);
  await loadWorkLogs();
  await loadPaymentsAndBalance(state.selectedEmployeeId);
  renderAll();
}

async function handleTableActions(event) {
  const employeeEdit = event.target.closest('.js-edit-employee');
  if (employeeEdit) {
    const employee = state.employees.find((item) => item.id === employeeEdit.dataset.id);
    openModal('employee', employee);
    return;
  }

  const openPayments = event.target.closest('.js-open-payments');
  if (openPayments) {
    state.selectedEmployeeId = openPayments.dataset.id;
    setRoute('payments');
    renderPaymentsFilter();
    await loadPaymentsAndBalance(openPayments.dataset.id);
    return;
  }

  const editJobType = event.target.closest('.js-edit-job-type');
  if (editJobType) {
    const jobType = state.jobTypes.find((item) => item.id === editJobType.dataset.id);
    openModal('job-type', jobType);
    return;
  }

  const showRates = event.target.closest('.js-show-rates');
  if (showRates) {
    state.selectedJobTypeId = showRates.dataset.id;
    renderRatesFilter();
    await loadRates(showRates.dataset.id);
    return;
  }

  const deleteJobType = event.target.closest('.js-delete-job-type');
  if (deleteJobType) {
    if (!window.confirm('למחוק את סוג העבודה הזה?')) return;
    try {
      await state.api.deleteJobType({ id: deleteJobType.dataset.id });
      showToast('סוג העבודה נמחק בהצלחה');
      await loadJobTypes();
    } catch (error) {
      showToast(error.message, true);
    }
    return;
  }

  const editRate = event.target.closest('.js-edit-rate');
  if (editRate) {
    const rate = state.rates.find((item) => item.id === editRate.dataset.id);
    openModal('rate', rate);
    return;
  }

  const closeRate = event.target.closest('.js-close-rate');
  if (closeRate) {
    const endDate = window.prompt('תאריך סיום (YYYY-MM-DD):', today());
    if (!endDate) return;
    try {
      await state.api.closeRate({ id: closeRate.dataset.id, endDate });
      showToast('התעריף נסגר בהצלחה');
      await loadRates(state.selectedJobTypeId);
    } catch (error) {
      showToast(error.message, true);
    }
    return;
  }

  const deleteRate = event.target.closest('.js-delete-rate');
  if (deleteRate) {
    if (!window.confirm('למחוק את התעריף הזה? לא מומלץ בפרודקשן.')) return;
    try {
      await state.api.deleteRate({ id: deleteRate.dataset.id });
      showToast('התעריף נמחק בהצלחה');
      await loadRates(state.selectedJobTypeId);
    } catch (error) {
      showToast(error.message, true);
    }
    return;
  }

  const editLog = event.target.closest('.js-edit-log');
  if (editLog) {
    const log = state.workLogs.find((item) => item.id === editLog.dataset.id);
    openModal('work-log', log);
    return;
  }

  const deleteLog = event.target.closest('.js-delete-log');
  if (deleteLog) {
    if (!window.confirm('למחוק את הדיווח הזה?')) return;
    try {
      await state.api.deleteWorkLog({ id: deleteLog.dataset.id });
      showToast('הדיווח נמחק בהצלחה');
      await loadWorkLogs();
    } catch (error) {
      showToast(error.message, true);
    }
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function firstDayOfMonth() {
  const date = new Date();
  date.setUTCDate(1);
  return date.toISOString().slice(0, 10);
}

function attachEvents() {
  qsa('[data-route]').forEach((button) => button.addEventListener('click', () => setRoute(button.dataset.route)));
  qsa('[data-open-modal]').forEach((button) => button.addEventListener('click', () => openModal(button.dataset.openModal)));
  qsa('[data-route-target]').forEach((button) => button.addEventListener('click', () => setRoute(button.dataset.routeTarget)));

  document.body.addEventListener('click', handleTableActions);
  document.getElementById('refreshButton').addEventListener('click', refreshAll);
  document.getElementById('reloadEmployees').addEventListener('click', loadEmployees);
  document.getElementById('reloadJobTypes').addEventListener('click', loadJobTypes);
  document.getElementById('loadRates').addEventListener('click', () => loadRates(el.ratesJobTypeFilter.value));
  el.ratesJobTypeFilter.addEventListener('change', () => loadRates(el.ratesJobTypeFilter.value));
  document.getElementById('loadWorkLogs').addEventListener('click', loadWorkLogs);
  document.getElementById('loadPayments').addEventListener('click', () => loadPaymentsAndBalance(el.paymentsEmployeeFilter.value));
  el.paymentsEmployeeFilter.addEventListener('change', () => loadPaymentsAndBalance(el.paymentsEmployeeFilter.value));
  el.globalSearch.addEventListener('input', (event) => {
    state.query = event.target.value;
    renderAll();
  });

  window.addEventListener('hashchange', () => setRoute(window.location.hash.replace('#', '') || 'dashboard'));
}

async function init() {
  renderSettings();
  attachEvents();
  el.workLogsFrom.value = firstDayOfMonth();
  el.workLogsTo.value = today();

  try {
    state.api = await createSmallBizPayApi();
    state.connectionState = 'מחובר ל־Supabase';
  } catch (error) {
    state.connectionState = `כשל בחיבור: ${error.message}`;
    renderSettings();
    showToast(error.message, true);
    return;
  }

  renderSettings();
  await refreshAll();
  setRoute(window.location.hash.replace('#', '') || 'dashboard');
}

init();
