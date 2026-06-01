# Mini Regression Checklist

## 1. Punch Flow
1. Open home page, verify initial state is `off` when no pending punch exists.
2. Tap punch in once, verify state becomes `on`, start time is shown.
3. Tap punch in again while `on`, verify no overwrite and toast warns "已在上班中".
4. Tap punch out, verify a new record is created and pending state is cleared.

## 2. Meal Deduction Consistency
1. Create a record from home with meal deduction enabled.
2. Verify saved record duration is reduced by `0.5h` and wage matches reduced duration.
3. Edit the same record in record page, change time and enable meal deduction.
4. Save and verify final duration/wage still keep deduction (not overwritten by recalculation).

## 3. Settings Hourly Rate Input
1. Open settings page, verify input displays current hourly rate.
2. Type a different value, verify `保存时薪` button appears.
3. Save, verify hourly rate updates and total wage recalculates.
4. Reopen settings page, verify the new rate persists.

## 4. Report Fallback Range
1. Ensure current month has no records but historical records exist.
2. Open report month mode.
3. Verify fallback label shows "全部月份".
4. Verify stats include all historical months (no missing early/late month due to list order).

## 5. Smoke Checks
1. Switch tabs across home/record/report/settings, verify no crash.
2. In record page, filter by day/week/month/all, verify counts and totals change correctly.
3. Export CSV/TXT from settings with records present, verify export or clipboard fallback works.
