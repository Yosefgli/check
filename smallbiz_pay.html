# אפיון מערכת לניהול העסקת עובדים - SmallBiz Pay

## 1. מבוא
מערכת מקיפה לניהול עובדים, עבודות, תעריפים ותשלומים עבור עסקים קטנים. המערכת שמה דגש על חישוב אוטומטי של שכר על בסיס היסטוריית תעריפים ומעקב מדויק אחר יתרות.

## 2. מודל נתונים (Database Schema)

### עובדים (Employees)
- `id`: UUID (מפתח ראשי)
- `name`: String (שם מלא)
- `status`: Enum (פעיל, לא פעיל)
- `notes`: Text (הערות)
- `created_at`: Timestamp

### סוגי עבודה (JobTypes)
- `id`: UUID (מפתח ראשי)
- `name`: String (שם העבודה)
- `payment_method`: Enum (לפי כמות, לפי שעות, תשלום קבוע)
- `status`: Enum (פעיל, לא פעיל)
- `notes`: Text
- `created_at`: Timestamp

### תעריפים (Rates)
- `id`: UUID
- `job_type_id`: UUID (מפתח זר ל-JobTypes)
- `amount`: Decimal (סכום התעריף)
- `start_date`: Date (תאריך תחילה)
- `end_date`: Date (תאריך סיום - אופציונלי)

### רישומי עבודה (WorkLogs)
- `id`: UUID
- `date`: Date
- `employee_id`: UUID (מפתח זר ל-Employees)
- `job_type_id`: UUID (מפתח זר ל-JobTypes)
- `quantity`: Decimal (לשימוש בשיטת "כמות")
- `hours_minutes`: String (פורמט HH:mm לשימוש בשיטת "שעות")
- `decimal_hours`: Decimal (חישוב אוטומטי לצורך שכר)
- `applied_rate`: Decimal (התעריף שנשמר בזמן הרישום)
- `total_amount`: Decimal (חישוב סופי: rate * quantity/hours)
- `status`: Enum (פעיל, מבוטל)
- `notes`: Text

### תשלומים (Payments)
- `id`: UUID
- `date`: Date
- `employee_id`: UUID (מפתח זר ל-Employees)
- `amount`: Decimal (סכום התשלום)
- `notes`: Text

## 3. לוגיקה עסקית מרכזית
1. **איתור תעריף תקף:** בעת יצירת רישום עבודה בתאריך X, המערכת תחפש בטבלת התעריפים את הרשומה עבור סוג העבודה שבה `start_date <= X` וגם (`end_date >= X` או `end_date` ריק).
2. **חישוב יתרה לעובד:** `סך כל הרישומים הפעילים` פחות `סך כל התשלומים שבוצעו`.
3. **המרה לעשרוני:** זמן בפורמט HH:mm יומר ל-Decimal (למשל 01:30 יהפוך ל-1.5) לצורך הכפלה בתעריף השעתי.

## 4. חוויית משתמש (UX/UI)
- שפה: עברית מלאה (RTL).
- עיצוב: נקי, מודרני, צבעים בהירים (כחול עסקי, לבן, אפור בהיר).
- רכיבים: שימוש ב-Modals להוספה ועריכה כדי לשמור על הקשר.
- ניווט: תפריט צדדי קבוע (Sidebar).