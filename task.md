# Opening Application - Execution

- [x] Check `package.json` for scripts and port
- [x] Verify if application is running
- [x] Start application if not running
- [x] Open application in browser

# Bug Fix: Reiniciar Historia
- [ ] Locate "Reiniciar historia" logic [/]
- [x] Debug why "Pasaporte Habitos" list is not clearing
- [x] Fix the issue [/]

# Feature: Mantener Plan Button
- [x] Locate "Plan Semanal" page and buttons
- [x] Add "Mantener Plan" button
- [x] Implement "Mantener Plan" logic (activate Plan Diario)
- [x] Update "Plan Diario" to enable "Mantener Plan" on report submission
- [x] Update "Nuevo Plan" to disable "Mantener Plan"

# PWA Feature: Native Install Support
- [x] Verify `vite.config.ts` PWA plugin configuration
- [x] Check `manifest` properties (name, icons, display)
- [x] Verify icon files existence in `public` folder
- [x] Add/Update manifest if missing or incorrect

# Feature: Logros Image Consistency
- [x] Inspect `utils/levels.ts` for level definitions
- [x] Inspect `pages/Logros.tsx` for image rendering logic
- [x] Verify image dynamic mapping based on weeks
- [x] Fix/Update logic if image doesn't match level
- [x] Implement `getLevelImage` in `levels.ts`
- [x] Update `Logros.tsx` to use dynamic image

# Documentation
- [x] Create/Update `manual_usuario.md`
- [x] Update `LICENSE.txt` with improvements

# Feature: Cumulative Daily Reflections
- [x] Inspect `PlanDiario.tsx` storage logic for reflections
- [x] Implement Cumulative Daily Reflections mechanism
    - [x] Ensure `exportToPDF` iterates all days for reflections
    - [x] Add explicit cleanup of `bi_daily_tasks_week_X` in `handleSendReport`
- [x] Update PDF generation to print all reflections
- [x] Clear reflections on `handleSendReport`
