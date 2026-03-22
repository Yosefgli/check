# Supabase RPC integration

נוספה שכבת אינטגרציה מוכנה ל-Supabase בקובץ `supabase_rpc_client.js`.

## שימוש בסיסי

```html
<script type="module">
  import { createSmallBizPayApi } from './supabase_rpc_client.js';

  const api = await createSmallBizPayApi();

  const employees = await api.getEmployees();
  const dashboard = await api.getDashboardSummary();

  console.log({ employees, dashboard });
</script>
```

## מה הקובץ מספק

- `createSupabaseClient()` – יוצר לקוח Supabase עם ה-URL וה-anon key שסיפקת.
- `createSmallBizPayApi()` – מחזיר wrapper לכל פונקציות ה-RPC של המערכת.
- ולידציה בסיסית ל-UUID, תאריכים, שעות ופרמטרים נדרשים.

## מיפוי הקריאות

- `getDashboardSummary()` → `get_dashboard_summary`
- `getDashboardSummaryByRange()` → `get_dashboard_summary_by_range`
- `getEmployees()` → `get_employees`
- `getEmployeeDetails()` → `get_employee_details`
- `createEmployee()` → `create_employee`
- `updateEmployee()` → `update_employee`
- `getJobTypes()` → `get_job_types`
- `createJobType()` → `create_job_type`
- `updateJobType()` → `update_job_type`
- `deleteJobType()` → `delete_job_type`
- `getRates()` → `get_rates`
- `createRate()` → `create_rate`
- `updateRate()` → `update_rate`
- `closeRate()` → `close_rate`
- `deleteRate()` → `delete_rate`
- `getWorkLogs()` → `get_work_logs`
- `getWorkLogsByEmployee()` → `get_work_logs_by_employee`
- `createWorkLog()` → `api_create_work_log`
- `updateWorkLog()` → `update_work_log`
- `deleteWorkLog()` → `delete_work_log`
- `createPayment()` → `create_payment`
- `getPayments()` → `get_payments`
- `getPaymentsByRange()` → `get_payments_by_range`
- `getEmployeeBalance()` → `get_employee_balance`
- `getEmployeesBalances()` → `get_employees_balances`

## הערה

ה-UI הנוכחי כבר תומך בעובדים, סוגי עבודה, תעריפים, דיווחי עבודה, תשלומים ויתרות.
הפונקציות המתקדמות מחוברות בשכבת ה-client וזמינות להרחבות נוספות ב-UI.
