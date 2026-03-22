const SUPABASE_URL = 'https://pcqgjowietliqhczqbgs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjcWdqb3dpZXRsaXFoY3pxYmdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTY2MTksImV4cCI6MjA4OTY5MjYxOX0.b6NQEf7TaAOGB_o8pnXluoM-UilDud-2flyt9CQybt8';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const HOURS_REGEX = /^\d{2}:\d{2}$/;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertUuid(value, fieldName) {
  assert(typeof value === 'string' && UUID_REGEX.test(value), `${fieldName} must be a valid UUID`);
}

function assertDate(value, fieldName) {
  assert(typeof value === 'string' && DATE_REGEX.test(value), `${fieldName} must be in YYYY-MM-DD format`);
}

function assertHours(value, fieldName) {
  assert(value === null || value === undefined || (typeof value === 'string' && HOURS_REGEX.test(value)), `${fieldName} must be null or in HH:mm format`);
}

function assertNumberOrNull(value, fieldName) {
  assert(value === null || value === undefined || typeof value === 'number', `${fieldName} must be a number or null`);
}

function assertNumber(value, fieldName) {
  assert(typeof value === 'number' && Number.isFinite(value), `${fieldName} must be a valid number`);
}

function normalizeRpcResult(functionName, response) {
  if (response.error) {
    throw new Error(`Supabase RPC ${functionName} failed: ${response.error.message}`);
  }

  return response.data;
}

export async function createSupabaseClient() {
  if (globalThis.__smallBizPaySupabaseClient) {
    return globalThis.__smallBizPaySupabaseClient;
  }

  if (globalThis.supabase?.createClient) {
    globalThis.__smallBizPaySupabaseClient = globalThis.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return globalThis.__smallBizPaySupabaseClient;
  }

  const module = await import('https://esm.sh/@supabase/supabase-js@2');
  globalThis.__smallBizPaySupabaseClient = module.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return globalThis.__smallBizPaySupabaseClient;
}

export async function createSmallBizPayApi(customClient) {
  const supabaseClient = customClient ?? await createSupabaseClient();

  async function rpc(functionName, params) {
    const result = await supabaseClient.rpc(functionName, params);
    return normalizeRpcResult(functionName, result);
  }

  return {
    getDashboardSummary() {
      return rpc('get_dashboard_summary');
    },

    getDashboardSummaryByRange({ from, to }) {
      assertDate(from, 'from');
      assertDate(to, 'to');
      return rpc('get_dashboard_summary_by_range', { p_from: from, p_to: to });
    },

    getEmployees() {
      return rpc('get_employees');
    },

    getEmployeeDetails({ employeeId }) {
      assertUuid(employeeId, 'employeeId');
      return rpc('get_employee_details', { p_employee: employeeId });
    },

    createEmployee({ name, phone, role }) {
      assert(typeof name === 'string' && name.trim(), 'name is required');
      assert(typeof phone === 'string', 'phone must be a string');
      assert(typeof role === 'string' && role.trim(), 'role is required');

      return rpc('create_employee', {
        p_name: name.trim(),
        p_phone: phone.trim(),
        p_role: role.trim(),
      });
    },

    updateEmployee({ id, name, phone, role, status }) {
      assertUuid(id, 'id');
      assert(typeof name === 'string' && name.trim(), 'name is required');
      assert(typeof phone === 'string', 'phone must be a string');
      assert(typeof role === 'string' && role.trim(), 'role is required');
      assert(typeof status === 'string' && status.trim(), 'status is required');

      return rpc('update_employee', {
        p_id: id,
        p_name: name.trim(),
        p_phone: phone.trim(),
        p_role: role.trim(),
        p_status: status.trim(),
      });
    },

    getJobTypes() {
      return rpc('get_job_types');
    },

    createJobType({ name, paymentMethod, status, notes = '' }) {
      assert(typeof name === 'string' && name.trim(), 'name is required');
      assert(typeof paymentMethod === 'string' && paymentMethod.trim(), 'paymentMethod is required');
      assert(typeof status === 'string' && status.trim(), 'status is required');
      assert(typeof notes === 'string', 'notes must be a string');

      return rpc('create_job_type', {
        p_name: name.trim(),
        p_payment_method: paymentMethod.trim(),
        p_status: status.trim(),
        p_notes: notes,
      });
    },

    updateJobType({ id, name, paymentMethod, status, notes = '' }) {
      assertUuid(id, 'id');
      assert(typeof name === 'string' && name.trim(), 'name is required');
      assert(typeof paymentMethod === 'string' && paymentMethod.trim(), 'paymentMethod is required');
      assert(typeof status === 'string' && status.trim(), 'status is required');
      assert(typeof notes === 'string', 'notes must be a string');

      return rpc('update_job_type', {
        p_id: id,
        p_name: name.trim(),
        p_payment_method: paymentMethod.trim(),
        p_status: status.trim(),
        p_notes: notes,
      });
    },

    deleteJobType({ id }) {
      assertUuid(id, 'id');
      return rpc('delete_job_type', { p_id: id });
    },

    getRates({ jobTypeId }) {
      assertUuid(jobTypeId, 'jobTypeId');
      return rpc('get_rates', { p_job_type: jobTypeId });
    },

    createRate({ jobTypeId, amount, startDate, endDate = null }) {
      assertUuid(jobTypeId, 'jobTypeId');
      assertNumber(amount, 'amount');
      assertDate(startDate, 'startDate');
      if (endDate) assertDate(endDate, 'endDate');

      return rpc('create_rate', {
        p_job_type: jobTypeId,
        p_amount: amount,
        p_start_date: startDate,
        p_end_date: endDate,
      });
    },

    updateRate({ id, amount, startDate, endDate = null }) {
      assertUuid(id, 'id');
      assertNumber(amount, 'amount');
      assertDate(startDate, 'startDate');
      if (endDate) assertDate(endDate, 'endDate');

      return rpc('update_rate', {
        p_id: id,
        p_amount: amount,
        p_start_date: startDate,
        p_end_date: endDate,
      });
    },

    closeRate({ id, endDate }) {
      assertUuid(id, 'id');
      assertDate(endDate, 'endDate');
      return rpc('close_rate', { p_id: id, p_end_date: endDate });
    },

    deleteRate({ id }) {
      assertUuid(id, 'id');
      return rpc('delete_rate', { p_id: id });
    },

    getWorkLogs({ from, to }) {
      assertDate(from, 'from');
      assertDate(to, 'to');

      return rpc('get_work_logs', {
        p_from: from,
        p_to: to,
      });
    },

    getWorkLogsByEmployee({ employeeId }) {
      assertUuid(employeeId, 'employeeId');
      return rpc('get_work_logs_by_employee', { p_employee: employeeId });
    },

    createWorkLog({ employeeId, jobTypeId, date, quantity = null, hours = null, notes = '' }) {
      assertUuid(employeeId, 'employeeId');
      assertUuid(jobTypeId, 'jobTypeId');
      assertDate(date, 'date');
      assertNumberOrNull(quantity, 'quantity');
      assertHours(hours, 'hours');
      assert(typeof notes === 'string', 'notes must be a string');

      return rpc('api_create_work_log', {
        p_employee: employeeId,
        p_job_type: jobTypeId,
        p_date: date,
        p_quantity: quantity,
        p_hours: hours,
        p_notes: notes,
      });
    },

    updateWorkLog({ id, quantity = null, hours = null, notes = '', status }) {
      assertUuid(id, 'id');
      assertNumberOrNull(quantity, 'quantity');
      assertHours(hours, 'hours');
      assert(typeof notes === 'string', 'notes must be a string');
      assert(typeof status === 'string' && status.trim(), 'status is required');

      return rpc('update_work_log', {
        p_id: id,
        p_quantity: quantity,
        p_hours: hours,
        p_notes: notes,
        p_status: status.trim(),
      });
    },

    deleteWorkLog({ id }) {
      assertUuid(id, 'id');
      return rpc('delete_work_log', { p_id: id });
    },

    createPayment({ employeeId, amount, date, notes = '' }) {
      assertUuid(employeeId, 'employeeId');
      assertNumber(amount, 'amount');
      assertDate(date, 'date');
      assert(typeof notes === 'string', 'notes must be a string');

      return rpc('create_payment', {
        p_employee: employeeId,
        p_amount: amount,
        p_date: date,
        p_notes: notes,
      });
    },

    getPayments({ employeeId }) {
      assertUuid(employeeId, 'employeeId');
      return rpc('get_payments', { p_employee: employeeId });
    },

    getPaymentsByRange({ from, to }) {
      assertDate(from, 'from');
      assertDate(to, 'to');
      return rpc('get_payments_by_range', { p_from: from, p_to: to });
    },

    getEmployeeBalance({ employeeId }) {
      assertUuid(employeeId, 'employeeId');
      return rpc('get_employee_balance', { p_employee: employeeId });
    },

    getEmployeesBalances() {
      return rpc('get_employees_balances');
    },
  };
}

export const smallBizPaySupabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
};
