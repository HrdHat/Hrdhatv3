// supabase/functions/saveFormModuleData/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
import { z } from "https://esm.sh/zod";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

// ─── MODULE CONFIG ───────────────────────────────────────────────────────────
const modulesWithModuleId = new Set([
  "header",
  "general",
  "preJobChecklist",
  "ppeChecklist",
  "taskHazards",
  "photos",
  "signatures",
]);

const singleRowModules = new Set([
  "general",
  "preJobChecklist",
  "ppeChecklist",
]);

function getConflictColumn(key, isArray) {
  if (key === "header") return "id";
  if (singleRowModules.has(key) && !isArray) return "form_module_id";
  return "id";
}

function buildModulePayload(data, key, moduleId) {
  if (key === "header") return data;
  const attach = (row) => ({ ...row, form_module_id: moduleId });
  return Array.isArray(data) ? data.map(attach) : attach(data);
}

// ─── ZOD SCHEMAS ──────────────────────────────────────────────────────────────
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

// Header (form_instances)
const formInstanceSchema = z
  .object({
    id: z.string().uuid(),
    form_number: z.string(),
    user_id: z.string().uuid(),
    created_at: z.string().datetime().optional(),
    updated_at: z.string().datetime().optional(),
  })
  .strict();

// General Info
const generalInfoSchema = z
  .object({
    id: z.string().uuid(),
    form_module_id: z.string().uuid(),
    project_name: z.string().min(2).max(100).nullable(),
    form_date: z.string().datetime().optional(),
    start_time: z.string().regex(timeRegex).optional(),
    end_time: z.string().regex(timeRegex).optional(),
    supervisor_name: z.string().nullable().optional(),
    supervisor_contact: z.string().regex(phoneRegex).nullable().optional(),
    work_description: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    created_at: z.string().datetime().optional(),
    updated_at: z.string().datetime().optional(),
  })
  .strict();

// Pre-Job Checklist
const preJobChecklistSchema = z
  .object({
    id: z.string().uuid(),
    form_module_id: z.string().uuid(),
    working_alone: z.boolean().nullable().optional(),
    requires_fall_protection: z.boolean().nullable().optional(),
    requires_platform: z.boolean().nullable().optional(),
    relative_motion_hazards: z.boolean().nullable().optional(),
    repetitive_motion_hazards: z.boolean().nullable().optional(),
    stretching_before_work: z.boolean().nullable().optional(),
    weather_conditions: z.string().nullable().optional(),
    created_at: z.string().datetime().optional(),
    updated_at: z.string().datetime().optional(),
  })
  .strict();

// PPE Checklist
const ppeChecklistSchema = z
  .object({
    id: z.string().uuid(),
    form_module_id: z.string().uuid(),
    coveralls: z.boolean().nullable().optional(),
    respiratory_fit_tested: z.boolean().nullable().optional(),
    hardhat: z.boolean().nullable().optional(),
    gloves: z.boolean().nullable().optional(),
    eye_protection: z.boolean().nullable().optional(),
    custom_ppe: z.array(z.string()).nullable().optional(),
    created_at: z.string().datetime().optional(),
    uploaded_at: z.string().datetime(),
    updated_at: z.string().datetime().optional(),
  })
  .strict();

// Task Hazards (array)
const taskHazardControlSchema = z
  .object({
    id: z.string().uuid(),
    form_module_id: z.string().uuid(),
    hazard: z.string(),
    control: z.string(),
    risk_level: z.number().int().min(1).max(10),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime().optional(),
  })
  .strict();

// Photos (array)
const formAssetPhotoSchema = z
  .object({
    id: z.string().uuid(),
    form_module_id: z.string().uuid(),
    photo_url: z.string().url(),
    photo_description: z.string().nullable().optional(),
    uploaded_at: z.string().datetime(),
    updated_at: z.string().datetime().optional(),
  })
  .strict();

// Signatures (array)
const signatureSchema = z
  .object({
    id: z.string().uuid(),
    form_module_id: z.string().uuid(),
    signer_name: z.string(),
    signed_at: z.string().datetime(),
    signature_url: z.string().url(),
    updated_at: z.string().datetime().optional(),
  })
  .strict();

const schemaMap = {
  header: formInstanceSchema,
  general: generalInfoSchema,
  preJobChecklist: preJobChecklistSchema,
  ppeChecklist: ppeChecklistSchema,
  taskHazards: z.array(taskHazardControlSchema),
  photos: z.array(formAssetPhotoSchema),
  signatures: z.array(signatureSchema),
};

// ─── TABLE MAP ────────────────────────────────────────────────────────────────
const tableMap = {
  header: "form_instances",
  general: "form_instance_general_info",
  preJobChecklist: "form_instance_pre_job_checklist",
  ppeChecklist: "form_instance_ppe_platform",
  taskHazards: "form_instance_hazards",
  photos: "form_asset_photos",
  signatures: "form_instance_signatures",
};

// ─── HANDLER ─────────────────────────────────────────────────────────────────
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );

  try {
    const { moduleKey, moduleId, data } = await req.json();

    if (!moduleKey || !moduleId || data === undefined) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing moduleKey/moduleId/data",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!modulesWithModuleId.has(moduleKey)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Unknown moduleKey '${moduleKey}'`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payload = buildModulePayload(data, moduleKey, moduleId);
    const validated = schemaMap[moduleKey].parse(payload);
    const table = tableMap[moduleKey];
    const conflict = getConflictColumn(moduleKey, Array.isArray(validated));

    const { error } = await supabaseAdmin
      .from(table)
      .upsert(validated, { onConflict: conflict });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[saveFormModuleData] ERROR:", e);
    return new Response(
      JSON.stringify({
        success: false,
        error: e.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
