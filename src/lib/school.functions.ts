import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ---------- Public: submit admission enquiry ---------- */
const leadSchema = z.object({
  parent_name: z.string().trim().min(2).max(100),
  child_name: z.string().trim().min(1).max(100),
  child_age: z.number().int().min(1).max(12).optional(),
  phone: z.string().trim().min(6).max(20),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  program: z.string().trim().max(50).optional(),
  message: z.string().trim().max(1000).optional(),
});

export const submitAdmissionLead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => leadSchema.parse(data))
  .handler(async ({ data }) => {
    const sb = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { error } = await sb.from("admissions_leads").insert({
      parent_name: data.parent_name,
      child_name: data.child_name,
      child_age: data.child_age ?? null,
      phone: data.phone,
      email: data.email || null,
      program: data.program || null,
      message: data.message || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Auth: my roles + profile ---------- */
export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: roles }, { data: profile }] = await Promise.all([
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
      context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
    ]);
    return {
      userId: context.userId,
      email: (context.claims as { email?: string }).email ?? null,
      roles: (roles ?? []).map((r) => r.role),
      profile: profile ?? null,
    };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        full_name: z.string().trim().max(100).optional(),
        phone: z.string().trim().max(20).optional(),
        child_name: z.string().trim().max(100).optional(),
        class_name: z.string().trim().max(50).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update(data)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Admin: leads ---------- */
async function assertAdmin(context: { supabase: ReturnType<typeof createClient<Database>>; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const listLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("admissions_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const updateLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["new", "contacted", "enrolled", "declined"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("admissions_leads")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Admin: users + roles ---------- */
export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone, child_name, class_name, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const roleMap = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    }
    const { data: authList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    const emailMap = new Map(authList?.users.map((u) => [u.id, u.email ?? ""]) ?? []);
    return (profiles ?? []).map((p) => ({
      ...p,
      email: emailMap.get(p.id) ?? "",
      roles: roleMap.get(p.id) ?? [],
    }));
  });

export const assignRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        role: z.enum(["admin", "teacher", "parent"]),
        action: z.enum(["add", "remove"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.action === "add") {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.user_id, role: data.role });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.user_id)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/* ---------- Classes & assignments (admin) ---------- */
export const listClasses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("classes")
      .select("id, name, created_at")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createClass = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ name: z.string().trim().min(1).max(60) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("classes").insert({ name: data.name });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteClass = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("classes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listTeacherAssignments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("teacher_classes")
      .select("id, teacher_id, class_id, classes(name)");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const assignTeacherClass = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        teacher_id: z.string().uuid(),
        class_id: z.string().uuid(),
        action: z.enum(["add", "remove"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.action === "add") {
      const { error } = await context.supabase
        .from("teacher_classes")
        .insert({ teacher_id: data.teacher_id, class_id: data.class_id });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("teacher_classes")
        .delete()
        .eq("teacher_id", data.teacher_id)
        .eq("class_id", data.class_id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/* ---------- Teacher: my classes, students, attendance ---------- */
export const listMyClasses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("teacher_classes")
      .select("class_id, classes(id, name)")
      .eq("teacher_id", context.userId);
    if (error) throw new Error(error.message);
    return (data ?? [])
      .map((r) => r.classes)
      .filter((c): c is { id: string; name: string } => !!c);
  });

export const listStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ class_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("students")
      .select("id, name, roll_no, phone")
      .eq("class_id", data.class_id)
      .order("roll_no");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const addStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        class_id: z.string().uuid(),
        name: z.string().trim().min(1).max(100),
        roll_no: z.string().trim().min(1).max(30),
        phone: z.string().trim().min(6).max(20).optional().or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("students").insert({
      class_id: data.class_id,
      name: data.name,
      roll_no: data.roll_no,
      phone: data.phone || null,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("students").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ class_id: z.string().uuid(), date: z.string() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("attendance")
      .select("student_id, status")
      .eq("class_id", data.class_id)
      .eq("date", data.date);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const markAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        class_id: z.string().uuid(),
        student_id: z.string().uuid(),
        date: z.string(),
        status: z.enum(["present", "absent", "late"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("attendance")
      .upsert(
        {
          class_id: data.class_id,
          student_id: data.student_id,
          date: data.date,
          status: data.status,
          marked_by: context.userId,
        },
        { onConflict: "student_id,date" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Homework / Assignments ---------- */
export const listHomework = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ class_id: z.string().uuid().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("homework")
      .select("id, class_id, title, description, subject, due_date, created_at, classes(name)")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(100);
    if (data.class_id) q = q.eq("class_id", data.class_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createHomework = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        class_id: z.string().uuid(),
        title: z.string().trim().min(1).max(150),
        description: z.string().trim().max(2000).optional().or(z.literal("")),
        subject: z.string().trim().max(60).optional().or(z.literal("")),
        due_date: z.string().optional().or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("homework").insert({
      class_id: data.class_id,
      title: data.title,
      description: data.description || null,
      subject: data.subject || null,
      due_date: data.due_date || null,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteHomework = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("homework").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


