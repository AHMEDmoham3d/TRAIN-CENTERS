# TODO: Implement Subdomain-Based Routing and Center Isolation

## 1. Update Login Logic for Center Isolation
- [ ] Modify `src/pages/auth/Login.tsx` to query role-specific tables (`students`, `teachers`, `admins`, `parents`) filtered by `center_id`.
- [ ] On login: Get center by `subdomain`, search role tables for matching `email`, `password`, and `center_id`.
- [ ] Set user data and redirect to role-specific dashboard.
- [ ] Remove the "Sign up" link from Login.tsx.

## 2. Remove Register Routes
- [ ] Update `src/App.tsx` to remove register routes (e.g., `/:centerSlug/register`).

## 3. Align Auth Store
- [ ] Update `src/store/authStore.ts` to support center-specific manual login, removing Supabase auth dependency.

## 4. Update Dashboards for Center Filtering
- [ ] Read and modify dashboard components (e.g., `src/pages/dashboards/StudentDashboard.tsx`, `TeacherDashboard.tsx`, etc.) to filter queries by `center_id`.
- [ ] Ensure data is scoped to the current center.

## 5. Testing and Follow-up
- [ ] Test login with different centers and roles.
- [ ] Verify dashboards show only center-specific data.
- [ ] Handle edge cases like invalid center or no matching user.
