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
- `getEmployees()` → `get_employees`
- `createEmployee()` → `create_employee`
- `updateEmployee()` → `update_employee`
- `getWorkLogs()` → `get_work_logs`
- `createWorkLog()` → `api_create_work_log`
- `updateWorkLog()` → `update_work_log`
- `deleteWorkLog()` → `delete_work_log`
- `createPayment()` → `create_payment`
- `getPayments()` → `get_payments`
- `getEmployeeBalance()` → `get_employee_balance`
- `getEmployeesBalances()` → `get_employees_balances`

## פונקציות שנראות חסרות מול ה-UI/הדומיין

לפי האפיון והמסכים הסטטיים, נראה שייתכן שעדיין יחסרו פונקציות API עבור:

1. סוגי עבודה (`job_types`) – רשימה / יצירה / עדכון.
2. תעריפים (`rates`) – רשימה / יצירה / עדכון / סגירת תוקף.
3. סינוני דשבורד או דוחות אם יש באתר מסכים נוספים מעבר למה שנמצא בריפו הזה.

אם יש אצלך באתר מסכים של סוגי עבודה או תעריפים, תשלח לי את שמות ה-RPC שלהם ואפשר לחבר גם אותם לאותה שכבה בלי לשנות UI.
