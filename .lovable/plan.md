## What I'll build

### 1. Lovable Cloud (backend)
Enable Cloud so the app has a database, auth, and secure server functions.

### 2. Database schema
- `profiles` — one row per user (auto-created on signup): `id (fk auth.users)`, `full_name`, `avatar_url`, `phone`, `child_name` (parents), `class_name` (students/teachers), `created_at`.
- `app_role` enum: `admin`, `teacher`, `parent`, `student`.
- `user_roles` — separate table (secure): `user_id`, `role`. Roles are NEVER on profiles (prevents privilege-escalation).
- `has_role(user_id, role)` security-definer function for RLS.
- `admissions_leads` — public form submissions: `parent_name`, `child_name`, `child_age`, `phone`, `email`, `program`, `message`, `status` (new/contacted/enrolled), `created_at`. Anyone can `INSERT`; only admins can `SELECT/UPDATE`.
- RLS on everything, with grants to `authenticated`/`anon`/`service_role`.
- Trigger to auto-create a profile + assign a default `student` role on signup (admins upgrade roles from the Admin dashboard).

### 3. Authentication
- `/auth` — single page with Sign in + Sign up tabs (email + password).
- Auto-confirm email (no confirmation link for smoother testing).
- Session listener at the root; sign-out button on every dashboard.
- After login → `/dashboard` router picks the right dashboard from the user's highest role.

### 4. Four dashboards (scaffolds, kid-friendly Mighty Mindz styling)
Under `_authenticated/`:
- `/dashboard/admin` — leads inbox (view + mark contacted/enrolled), user list, role assignment.
- `/dashboard/teacher` — my classes, notices composer, quick attendance placeholder.
- `/dashboard/parent` — my child's overview, notices feed, fees placeholder, WhatsApp school link.
- `/dashboard/student` — today's schedule placeholder, notices, fun mascot header.

Each dashboard is a real functional page (not lorem ipsum), sharing a `DashboardShell` (sidebar + header + role badge). Advanced modules (attendance grid, assignments, fees, chat) are stubbed with clear "coming soon" cards so we can iterate.

### 5. Public admissions form → backend
- Update the existing "Book a School Tour / Admissions" section on `/` to POST into `admissions_leads` via a public server function (Zod-validated).
- Show a success toast; keep the WhatsApp CTA as a fallback.

### 6. Header wiring
- Show **Sign in** when signed-out, **Dashboard** + avatar menu (Sign out) when signed-in — reflects live session state.

## Technical notes
- `createServerFn` for all backend calls (`submitAdmissionLead`, `listLeads`, `updateLeadStatus`, `assignRole`, `listUsers`, `getMyProfile`).
- `requireSupabaseAuth` middleware for authenticated fns; admin-only fns additionally check `has_role(uid, 'admin')`.
- `_authenticated/route.tsx` is integration-managed — I won't touch it.
- Role-gated sub-layouts: `_authenticated/_admin.tsx`, `_authenticated/_teacher.tsx`, etc., using `has_role` via a server-fn context check.
- No secrets requested from you — email/password only.

## Out of scope for this pass (say the word to add)
- Google sign-in, phone OTP
- Attendance persistence, grading, fee payments
- Realtime chat between parents/teachers
- File uploads (assignments, avatars)

Approve and I'll implement end-to-end.