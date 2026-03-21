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

    getEmployees() {
      return rpc('get_employees');
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

    getWorkLogs({ from, to }) {
      assertDate(from, 'from');
      assertDate(to, 'to');

      return rpc('get_work_logs', {
        p_from: from,
        p_to: to,
      });
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

      return rpc('delete_work_log', {
        p_id: id,
      });
    },

    createPayment({ employeeId, amount, date, notes = '' }) {
      assertUuid(employeeId, 'employeeId');
      assert(typeof amount === 'number', 'amount must be a number');
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

      return rpc('get_payments', {
        p_employee: employeeId,
      });
    },

    getEmployeeBalance({ employeeId }) {
      assertUuid(employeeId, 'employeeId');

      return rpc('get_employee_balance', {
        p_employee: employeeId,
      });
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
