// supabase/functions/saveFormModuleData/index.ts
// Updated: Added input schemas, normalized payloads, attached missing fields
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
import { z } from "https://esm.sh/zod";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

// ─── HELPER FUNCTIONS ───────────────────────────────────────────────────────
function sanitizeTimeFields(data: any) {
  const result = { ...data };

  // Convert empty strings to null for time fields
  if (result.start_time === "") result.start_time = null;
  if (result.end_time === "") result.end_time = null;

  // Convert empty strings to null for other fields that might cause issues
  if (result.form_date === "") result.form_date = null;
  if (result.supervisor_contact === "") result.supervisor_contact = null;

  return result;
}

// ─── MODULE CONFIG ───────────────────────────────────────────────────────────
const modulesWithModuleId = new Set<string>([
  "general",
  "preJobChecklist",
  "ppeChecklist",
  "taskHazards",
  "photos",
  "signatures",
]);
const singleRowModules = new Set<string>([
  "general",
  "preJobChecklist",
  "ppeChecklist",
]);

function getConflictColumn(key: string, isArray: boolean) {
  if (key === "header") return "id";
  if (singleRowModules.has(key) && !isArray) return "form_module_id";
  return "id";
}

// ─── INPUT SCHEMAS ──────────────────────────────────────────────────────────
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

const headerInputSchema = z.object({
  id: z.string().uuid(),
  form_number: z.string(),
  user_id: z.string().uuid(),
});

const generalInputSchema = z
  .object({
    project_name: z.string().nullable().optional(),
    project_address: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    form_date: z.string().nullable().optional(),
    crew_members_count: z.number().int().min(0).nullable().optional(),
    work_description: z.string().nullable().optional(),
    start_time: z
      .string()
      .refine((val) => !val || timeRegex.test(val), "Invalid time format")
      .nullable()
      .optional(),
    end_time: z
      .string()
      .refine((val) => !val || timeRegex.test(val), "Invalid time format")
      .nullable()
      .optional(),
    supervisor_name: z.string().nullable().optional(),
    supervisor_contact: z
      .string()
      .refine((val) => !val || phoneRegex.test(val), "Invalid phone format")
      .nullable()
      .optional(),
  })
  .strict();

const preJobInputSchema = z
  .object({
    is_fit_for_duty: z.boolean().nullable().optional(),
    reviewed_work_area_for_hazards: z.boolean().nullable().optional(),
    required_ppe_for_today: z.boolean().nullable().optional(),
    equipment_inspection_up_to_date: z.boolean().nullable().optional(),
    completed_flra_hazard_assessment: z.boolean().nullable().optional(),
    safety_signage_installed_and_checked: z.boolean().nullable().optional(),
    working_alone_today: z.boolean().nullable().optional(),
    required_permits_for_tasks: z.boolean().nullable().optional(),
    barricades_signage_barriers_installed_good: z
      .boolean()
      .nullable()
      .optional(),
    clear_access_to_emergency_exits: z.boolean().nullable().optional(),
    trained_and_competent_for_tasks: z.boolean().nullable().optional(),
    inspected_tools_and_equipment: z.boolean().nullable().optional(),
    reviewed_control_measures_needed: z.boolean().nullable().optional(),
    reviewed_emergency_procedures: z.boolean().nullable().optional(),
    all_required_permits_in_place: z.boolean().nullable().optional(),
    communicated_with_crew_about_plan: z.boolean().nullable().optional(),
    need_for_spotters_barricades_special_controls: z
      .boolean()
      .nullable()
      .optional(),
    weather_suitable_for_work: z.boolean().nullable().optional(),
    know_designated_first_aid_attendant: z.boolean().nullable().optional(),
    aware_of_site_notices_or_bulletins: z.boolean().nullable().optional(),
  })
  .strict();

const ppeInputSchema = z
  .object({
    ppe_hardhat: z.boolean().nullable().optional(),
    ppe_safety_vest: z.boolean().nullable().optional(),
    ppe_safety_glasses: z.boolean().nullable().optional(),
    ppe_fall_protection: z.boolean().nullable().optional(),
    ppe_coveralls: z.boolean().nullable().optional(),
    ppe_gloves: z.boolean().nullable().optional(),
    ppe_mask: z.boolean().nullable().optional(),
    ppe_respirator: z.boolean().nullable().optional(),
    platform_ladder: z.boolean().nullable().optional(),
    platform_step_bench: z.boolean().nullable().optional(),
    platform_sawhorses: z.boolean().nullable().optional(),
    platform_baker_scaffold: z.boolean().nullable().optional(),
    platform_scaffold: z.boolean().nullable().optional(),
    platform_scissor_lift: z.boolean().nullable().optional(),
    platform_boom_lift: z.boolean().nullable().optional(),
    platform_swing_stage: z.boolean().nullable().optional(),
    platform_hydro_lift: z.boolean().nullable().optional(),
  })
  .strict();

const taskHazardInputSchema = z.array(
  z.object({
    task: z.string(),
    hazard: z.string(),
    control: z.string(),
    risk_level_before: z.number().int().min(1).max(5),
    risk_level_after: z.number().int().min(1).max(5),
  })
);

const photoInputSchema = z.array(
  z.object({
    photo_url: z.string().url(),
    photo_description: z.string().nullable().optional(),
  })
);

const signatureInputSchema = z.array(
  z.object({
    signer_name: z.string(),
    signed_at: z.string().datetime(),
    signature_url: z.string().url(),
  })
);

// ─── STRICT SCHEMAS FOR UPSERT ───────────────────────────────────────────────
const formInstanceSchema = z
  .object({
    id: z.string().uuid(),
    form_number: z.string(),
    user_id: z.string().uuid(),
    created_at: z.string().datetime().optional(),
    updated_at: z.string().datetime().optional(),
  })
  .strict();

const generalInfoSchema = z
  .object({
    id: z.string().uuid(),
    form_module_id: z.string().uuid(),
    project_name: z.string().nullable().optional(),
    project_address: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    form_date: z.string().nullable().optional(),
    crew_members_count: z.number().int().min(0).nullable().optional(),
    work_description: z.string().nullable().optional(),
    start_time: z
      .string()
      .refine((val) => !val || timeRegex.test(val), "Invalid time format")
      .nullable()
      .optional(),
    end_time: z
      .string()
      .refine((val) => !val || timeRegex.test(val), "Invalid time format")
      .nullable()
      .optional(),
    supervisor_name: z.string().nullable().optional(),
    supervisor_contact: z
      .string()
      .refine((val) => !val || phoneRegex.test(val), "Invalid phone format")
      .nullable()
      .optional(),
    created_at: z.string().datetime().optional(),
    updated_at: z.string().datetime().optional(),
  })
  .strict();

const preJobChecklistSchema = z
  .object({
    id: z.string().uuid(),
    form_module_id: z.string().uuid(),
    is_fit_for_duty: z.boolean().nullable().optional(),
    reviewed_work_area_for_hazards: z.boolean().nullable().optional(),
    required_ppe_for_today: z.boolean().nullable().optional(),
    equipment_inspection_up_to_date: z.boolean().nullable().optional(),
    completed_flra_hazard_assessment: z.boolean().nullable().optional(),
    safety_signage_installed_and_checked: z.boolean().nullable().optional(),
    working_alone_today: z.boolean().nullable().optional(),
    required_permits_for_tasks: z.boolean().nullable().optional(),
    barricades_signage_barriers_installed_good: z
      .boolean()
      .nullable()
      .optional(),
    clear_access_to_emergency_exits: z.boolean().nullable().optional(),
    trained_and_competent_for_tasks: z.boolean().nullable().optional(),
    inspected_tools_and_equipment: z.boolean().nullable().optional(),
    reviewed_control_measures_needed: z.boolean().nullable().optional(),
    reviewed_emergency_procedures: z.boolean().nullable().optional(),
    all_required_permits_in_place: z.boolean().nullable().optional(),
    communicated_with_crew_about_plan: z.boolean().nullable().optional(),
    need_for_spotters_barricades_special_controls: z
      .boolean()
      .nullable()
      .optional(),
    weather_suitable_for_work: z.boolean().nullable().optional(),
    know_designated_first_aid_attendant: z.boolean().nullable().optional(),
    aware_of_site_notices_or_bulletins: z.boolean().nullable().optional(),
    created_at: z.string().datetime().optional(),
    updated_at: z.string().datetime().optional(),
  })
  .strict();

const ppeChecklistSchema = z
  .object({
    id: z.string().uuid(),
    form_module_id: z.string().uuid(),
    ppe_hardhat: z.boolean().nullable().optional(),
    ppe_safety_vest: z.boolean().nullable().optional(),
    ppe_safety_glasses: z.boolean().nullable().optional(),
    ppe_fall_protection: z.boolean().nullable().optional(),
    ppe_coveralls: z.boolean().nullable().optional(),
    ppe_gloves: z.boolean().nullable().optional(),
    ppe_mask: z.boolean().nullable().optional(),
    ppe_respirator: z.boolean().nullable().optional(),
    platform_ladder: z.boolean().nullable().optional(),
    platform_step_bench: z.boolean().nullable().optional(),
    platform_sawhorses: z.boolean().nullable().optional(),
    platform_baker_scaffold: z.boolean().nullable().optional(),
    platform_scaffold: z.boolean().nullable().optional(),
    platform_scissor_lift: z.boolean().nullable().optional(),
    platform_boom_lift: z.boolean().nullable().optional(),
    platform_swing_stage: z.boolean().nullable().optional(),
    platform_hydro_lift: z.boolean().nullable().optional(),
    created_at: z.string().datetime().optional(),
    updated_at: z.string().datetime().optional(),
  })
  .strict();

const taskHazardControlSchema = z
  .object({
    id: z.string().uuid(),
    form_module_id: z.string().uuid(),
    task: z.string(),
    hazard: z.string(),
    control: z.string(),
    risk_level_before: z.number().int().min(1).max(5),
    risk_level_after: z.number().int().min(1).max(5),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime().optional(),
  })
  .strict();

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

const strictSchemaMap: Record<string, any> = {
  header: formInstanceSchema,
  general: generalInfoSchema,
  preJobChecklist: preJobChecklistSchema,
  ppeChecklist: ppeChecklistSchema,
  taskHazards: z.array(taskHazardControlSchema),
  photos: z.array(formAssetPhotoSchema),
  signatures: z.array(signatureSchema),
};

const tableMap: Record<string, string> = {
  header: "form_instances",
  general: "form_instance_general_info",
  preJobChecklist: "form_instance_pre_job_checklist",
  ppeChecklist: "form_instance_ppe_platform",
  taskHazards: "form_instance_hazards",
  photos: "form_asset_photos",
  signatures: "form_instance_signatures",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { moduleKey, moduleId, data } = await req.json();

    console.log("[saveFormModuleData] Received request:", {
      moduleKey,
      moduleId,
      dataKeys: data ? Object.keys(data) : null,
      dataValues: data,
    });

    if (!moduleKey || !moduleId || data === undefined) {
      console.error("[saveFormModuleData] Missing required parameters:", {
        moduleKey: !!moduleKey,
        moduleId: !!moduleId,
        data: data !== undefined,
      });
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

    // Normalize and validate input
    let toUpsert: any;
    switch (moduleKey) {
      case "header": {
        const input = headerInputSchema.parse(data);
        toUpsert = { ...input };
        break;
      }
      case "general": {
        const input = generalInputSchema.parse(data);
        toUpsert = {
          id: moduleId,
          form_module_id: moduleId,
          ...sanitizeTimeFields(input),
        };
        break;
      }
      case "preJobChecklist": {
        const input = preJobInputSchema.parse(data);
        toUpsert = { id: moduleId, form_module_id: moduleId, ...input };
        break;
      }
      case "ppeChecklist": {
        const input = ppeInputSchema.parse(data);
        toUpsert = {
          id: moduleId,
          form_module_id: moduleId,
          ...input,
        };
        break;
      }
      case "taskHazards":
        taskHazardInputSchema.parse(data);
        toUpsert = data.map((row: any) => ({
          id: row.id ?? crypto.randomUUID(),
          form_module_id: moduleId,
          task: row.task,
          hazard: row.hazard,
          control: row.control,
          risk_level_before: row.risk_level_before,
          risk_level_after: row.risk_level_after,
          created_at: new Date().toISOString(),
        }));
        break;
      case "photos":
        toUpsert = data.map((row: any) => ({
          id: row.id ?? crypto.randomUUID(),
          form_module_id: moduleId,
          uploaded_at: new Date().toISOString(),
          ...row,
        }));
        photoInputSchema.parse(data);
        break;
      case "signatures":
        toUpsert = data.map((row: any) => ({
          id: row.id ?? crypto.randomUUID(),
          form_module_id: moduleId,
          ...row,
        }));
        signatureInputSchema.parse(data);
        break;
      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: `No input schema for '${moduleKey}'`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

    // Validate full payload if desired
    strictSchemaMap[moduleKey].parse(toUpsert);

    console.log("[saveFormModuleData] About to upsert:", {
      table: tableMap[moduleKey],
      conflict: getConflictColumn(moduleKey, Array.isArray(toUpsert)),
      payload: toUpsert,
    });

    // Perform upsert
    const table = tableMap[moduleKey];
    const conflict = getConflictColumn(moduleKey, Array.isArray(toUpsert));
    const { error } = await supabaseAdmin
      .from(table)
      .upsert(toUpsert, { onConflict: conflict });
    if (error) {
      console.error("[saveFormModuleData] Database error:", error);
      throw error;
    }

    console.log("[saveFormModuleData] Success!");
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[saveFormModuleData] ERROR:", e);

    // Better error serialization
    let errorMessage: string;
    if (e instanceof Error) {
      errorMessage = e.message;
    } else if (typeof e === "object" && e !== null) {
      errorMessage = JSON.stringify(e);
    } else {
      errorMessage = String(e);
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
