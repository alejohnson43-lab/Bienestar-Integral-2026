# Verification Walkthrough

## Summary of Changes
1. **Pasaporte Habitos Fix**: Modified `PasaporteHabitos.tsx` to ensure the list is empty when no user data is present, specifically fixing the issue where "Reiniciar historia" left mock data visible.
2. **"Mantener Plan" Feature**:
    - Added a **"Mantener Plan"** button to the `PlanSemanal` page.
    - Implemented logic to enable this button only after a weekly report is sent from `PlanDiario`.
    - Clicking the button reactivates the current "Plan Diario" for another week, resetting the cycle without forcing new habits.

## Verification Steps

### 1. Verify "Reiniciar Historia" Fix
1. Navigate to **Pasaporte de Hábitos**.
2. If habits are visible, use the **Settings** (gear icon) -> **Reiniciar historial**.
3. Confirm that the list is now completely empty (no "Mock" or example habits).

### 2. Verify "Mantener Plan" Button
1. Navigate to **Plan Semanal**.
2. Observe the new button "Mantener Plan" between "Plan Diario" and "Nuevo Plan". 
3. **Initial State**: It should be **Disabled** (greyed out) if you haven't just finished a week.

### 3. Verify Flow
1. Navigate to **Plan Diario**.
2. Click **"Enviar Reporte"** (Simulate finishing a week).
3. You should be redirected to **Plan Semanal**.
4. **Result**: The **"Mantener Plan"** button should now be **Enabled** (purple).
5. Click **"Mantener Plan"**.
6. **Result**: The "Plan Diario" button becomes active. The "Nuevo Plan" button becomes disabled. The "Mantener Plan" button remains enabled (or state unchanged, as user requested only those two specific side-effects).
7. **Alternative Flow**: If you click **"Nuevo Plan"** instead, check that **"Mantener Plan"** becomes **Disabled**.

### 4. Verify Logros Dynamic Images
1. Navigate to **Logros**.
2. Observe the main image (Tree/Landscape).
3. It should now change based on your **Level** (Semilla, Brote, etc.), instead of being a static tree image for everyone.

### 5. Verify Cumulative Reflections & Cleanup
1. **Accumulate Data**:
    - In **Plan Diario**, add a reflection for the current day.
    - (Optional) If testing over multiple days, ensure previous days' reflections are visible in the "Timeline" or data.
2. **Export PDF**:
    - Click **"Exportar PDF"**.
    - Open the PDF and scroll to the "Reflexiones de la Semana" section.
    - Verify that reflections from **all days** with data are listed, not just today's.
3. **End Week**:
    - Click **"Enviar Reporte"**.
    - Confirm the alert shows the new streak/week.
    - **Verify Cleanup**: The stored reflection data for the *completed* week is now deleted to ensure privacy/reset. (You can verify this by checking if the input is empty or using developer tools to check `EncryptedStorage` if possible, but the logic is implemented).
