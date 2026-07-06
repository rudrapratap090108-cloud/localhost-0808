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
        avatar_url: z.string().trim().max(500).optional(),
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

/* ---------- Homework media ---------- */
export const listHomeworkMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ homework_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("homework_media")
      .select("id, kind, storage_path, size_bytes, created_at")
      .eq("homework_id", data.homework_id)
      .order("created_at");
    if (error) throw new Error(error.message);
    const withUrls = await Promise.all(
      (rows ?? []).map(async (r) => {
        const { data: signed } = await context.supabase.storage
          .from("homework-media")
          .createSignedUrl(r.storage_path, 3600);
        return { ...r, url: signed?.signedUrl ?? "" };
      }),
    );
    return withUrls;
  });

export const addHomeworkMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        homework_id: z.string().uuid(),
        storage_path: z.string().min(1).max(500),
        kind: z.enum(["image", "video"]),
        size_bytes: z.number().int().min(0).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("homework_media").insert({
      homework_id: data.homework_id,
      storage_path: data.storage_path,
      kind: data.kind,
      size_bytes: data.size_bytes ?? null,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteHomeworkMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("homework_media")
      .select("storage_path")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await context.supabase.from("homework_media").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    if (row?.storage_path) {
      await context.supabase.storage.from("homework-media").remove([row.storage_path]);
    }
    return { ok: true };
  });

/* ---------- Results ---------- */
const subjectSchema = z.object({
  name: z.string().trim().min(1).max(60),
  marks: z.number().min(0),
  max: z.number().min(1),
});

export const upsertResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        class_id: z.string().uuid(),
        roll_no: z.string().trim().min(1).max(30),
        student_name: z.string().trim().min(1).max(100),
        term: z.enum(["half_yearly", "annual"]),
        year: z.number().int().min(2000).max(2100),
        subjects: z.array(subjectSchema).min(1).max(20),
        grade: z.string().trim().max(4).optional().or(z.literal("")),
        remarks: z.string().trim().max(500).optional().or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const total = data.subjects.reduce((s, x) => s + x.marks, 0);
    const max_total = data.subjects.reduce((s, x) => s + x.max, 0);
    const percentage = max_total > 0 ? +((total / max_total) * 100).toFixed(2) : 0;
    const { error } = await context.supabase.from("results").upsert(
      {
        class_id: data.class_id,
        roll_no: data.roll_no,
        student_name: data.student_name,
        term: data.term,
        year: data.year,
        subjects: data.subjects,
        total,
        max_total,
        percentage,
        grade: data.grade || null,
        remarks: data.remarks || null,
        created_by: context.userId,
      },
      { onConflict: "class_id,roll_no,term,year" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const findResults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        class_id: z.string().uuid(),
        roll_no: z.string().trim().min(1).max(30),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("results")
      .select("*, classes(name)")
      .eq("class_id", data.class_id)
      .eq("roll_no", data.roll_no)
      .order("year", { ascending: false })
      .order("term");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listClassResults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ class_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("results")
      .select("id, roll_no, student_name, term, year, percentage, grade, created_at")
      .eq("class_id", data.class_id)
      .order("year", { ascending: false })
      .order("roll_no");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const deleteResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("results").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Gallery ---------- */
export const listGallery = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("gallery")
      .select("id, storage_path, title, uploaded_by, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const withUrls = await Promise.all(
      (rows ?? []).map(async (r) => {
        const { data: signed } = await context.supabase.storage
          .from("gallery")
          .createSignedUrl(r.storage_path, 3600);
        return { ...r, url: signed?.signedUrl ?? "" };
      }),
    );
    return withUrls;
  });

export const addGalleryImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        storage_path: z.string().min(1).max(500),
        title: z.string().trim().max(100).optional().or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("gallery").insert({
      storage_path: data.storage_path,
      title: data.title || null,
      uploaded_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteGalleryImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("gallery")
      .select("storage_path")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await context.supabase.from("gallery").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    if (row?.storage_path) {
      await context.supabase.storage.from("gallery").remove([row.storage_path]);
    }
    return { ok: true };
  });

/* ---------- Fee payments ---------- */
export const submitFeePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        student_name: z.string().trim().min(1).max(100),
        student_class: z.string().trim().max(50).optional().or(z.literal("")),
        period: z.string().trim().min(1).max(50),
        amount: z.number().positive(),
        method: z.string().trim().max(30).optional().or(z.literal("")),
        reference: z.string().trim().max(80).optional().or(z.literal("")),
        screenshot_path: z.string().trim().max(500).optional().or(z.literal("")),
        notes: z.string().trim().max(500).optional().or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("fee_payments").insert({
      parent_id: context.userId,
      student_name: data.student_name,
      student_class: data.student_class || null,
      period: data.period,
      amount: data.amount,
      method: data.method || null,
      reference: data.reference || null,
      screenshot_path: data.screenshot_path || null,
      notes: data.notes || null,
      status: "pending",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

async function signPathIfAny(
  context: { supabase: ReturnType<typeof createClient<Database>> },
  bucket: string,
  path: string | null,
) {
  if (!path) return null;
  const { data } = await context.supabase.storage.from(bucket).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export const listMyFeePayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("fee_payments")
      .select("*")
      .eq("parent_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return Promise.all(
      (rows ?? []).map(async (r) => ({
        ...r,
        screenshot_url: await signPathIfAny(context, "fee-screenshots", r.screenshot_path),
      })),
    );
  });

export const listAllFeePayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const isAdmin = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    const isTeacher = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "teacher" });
    if (!isAdmin.data && !isTeacher.data) throw new Error("Forbidden");
    const { data: rows, error } = await context.supabase
      .from("fee_payments")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return Promise.all(
      (rows ?? []).map(async (r) => ({
        ...r,
        screenshot_url: await signPathIfAny(context, "fee-screenshots", r.screenshot_path),
      })),
    );
  });

export const verifyFeePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["verified", "rejected", "pending"]),
        notes: z.string().trim().max(500).optional().or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("fee_payments")
      .update({
        status: data.status,
        notes: data.notes || null,
        verified_by: context.userId,
        verified_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Admin / Teacher: create parent account ---------- */
export const createParentAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        mode: z.enum(["auto", "manual", "invite"]),
        full_name: z.string().trim().min(1).max(100),
        child_name: z.string().trim().max(100).optional().or(z.literal("")),
        class_name: z.string().trim().max(50).optional().or(z.literal("")),
        phone: z.string().trim().max(20).optional().or(z.literal("")),
        email: z.string().trim().email().max(200).optional().or(z.literal("")),
        password: z.string().min(8).max(72).optional().or(z.literal("")),
        roll_no: z.string().trim().max(30).optional().or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const isAdmin = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    const isTeacher = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "teacher" });
    if (!isAdmin.data && !isTeacher.data) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let email = data.email?.trim() || "";
    let password = data.password || "";
    let generated = false;

    if (data.mode === "auto") {
      const slug = data.roll_no?.trim() || data.full_name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 12) || `p${Date.now().toString(36)}`;
      email = `parent_${slug}_${Math.random().toString(36).slice(2, 6)}@school.local`;
      password = Math.random().toString(36).slice(2, 6) + Math.random().toString(36).slice(2, 6).toUpperCase() + "!" + Math.floor(Math.random() * 90 + 10);
      generated = true;
    }

    if (data.mode === "manual") {
      if (!email || !password) throw new Error("Email and password required");
    }

    if (data.mode === "invite") {
      if (!email) throw new Error("Email required for invite");
      const { data: invited, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: data.full_name, phone: data.phone, role: "parent" },
      });
      if (inviteErr) throw new Error(inviteErr.message);
      const uid = invited.user?.id;
      if (uid) {
        await supabaseAdmin.from("profiles").upsert({
          id: uid,
          full_name: data.full_name,
          phone: data.phone || null,
          child_name: data.child_name || null,
          class_name: data.class_name || null,
        });
        await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: "parent" }).then(() => {});
      }
      return { ok: true, mode: "invite" as const, email };
    }

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, phone: data.phone, role: "parent" },
    });
    if (error) throw new Error(error.message);
    const uid = created.user?.id;
    if (uid) {
      await supabaseAdmin.from("profiles").upsert({
        id: uid,
        full_name: data.full_name,
        phone: data.phone || null,
        child_name: data.child_name || null,
        class_name: data.class_name || null,
      });
      await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: "parent" }).then(() => {});
    }
    return { ok: true, mode: data.mode, email, password, generated };
  });


