import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── PHASE 5: ENHANCED TYPES ────────────────────────────────────────────────

const batchSaveRequestSchema = z.object({
  formId: z.string().uuid(),
  saves: z.array(z.object({
    moduleId: z.string().uuid(),
    data: z.record(z.unknown()),
    version: z.number().int().min(1).optional(),
    skipConflictCheck: z.boolean().optional().default(false),
  })),
  clientTimestamp: z.string().datetime().optional(),
  metadata: z.object({
    batchId: z.string().optional(),
    priority: z.enum(['low', 'normal', 'high']).optional().default('normal'),
    source: z.enum(['auto-save', 'manual', 'blur', 'unload']).optional().default('manual'),
  }).optional(),
});

const singleSaveRequestSchema = z.object({
  formId: z.string().uuid(),
  moduleId: z.string().uuid(),
  data: z.record(z.unknown()),
  version: z.number().int().min(1).optional(),
  skipConflictCheck: z.boolean().optional().default(false),
  metadata: z.object({
    source: z.enum(['auto-save', 'manual', 'blur', 'unload']).optional().default('manual'),
  }).optional(),
});

interface SaveResult {
  moduleId: string;
  success: boolean;
  version?: number;
  error?: string;
  conflictInfo?: {
    serverVersion: number;
    lastModifiedBy: string;
    lastModifiedAt: string;
    hasConflict: boolean;
  };
}

interface BatchSaveResponse {
  success: boolean;
  results: SaveResult[];
  totalSaved: number;
  totalFailed: number;
  batchId: string;
  serverTimestamp: string;
  error?: string;
}

// ─── HELPER FUNCTIONS ───────────────────────────────────────────────────────

function generateBatchId(): string {
  return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function validateFormAccess(
  supabase: any,
  formId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: form, error } = await supabase
    .from('form_instances')
    .select('id, user_id, status')
    .eq('id', formId)
    .eq('user_id', userId)
    .single();

  if (error || !form) {
    return { success: false, error: 'Form not found or access denied' };
  }

  if (form.status === 'archived') {
    return { success: false, error: 'Cannot modify archived form' };
  }

  return { success: true };
}

async function checkModuleVersion(
  supabase: any,
  formId: string,
  moduleId: string,
  clientVersion?: number
): Promise<{
  hasConflict: boolean;
  serverVersion: number;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}> {
  const { data: entry } = await supabase
    .from('form_data_entries')
    .select('version, last_saved_by, updated_at')
    .eq('form_id', formId)
    .eq('module_id', moduleId)
    .single();

  if (!entry) {
    return { hasConflict: false, serverVersion: 1 };
  }

  const hasConflict = clientVersion ? entry.version !== clientVersion : false;
  
  return {
    hasConflict,
    serverVersion: entry.version,
    lastModifiedBy: entry.last_saved_by,
    lastModifiedAt: entry.updated_at,
  };
}

async function saveModuleWithVersion(
  supabase: any,
  formId: string,
  moduleId: string,
  data: Record<string, unknown>,
  userId: string,
  expectedVersion?: number
): Promise<SaveResult> {
  try {
    // Check for version conflicts first
    const versionCheck = await checkModuleVersion(supabase, formId, moduleId, expectedVersion);
    
    if (versionCheck.hasConflict) {
      return {
        moduleId,
        success: false,
        error: 'Version conflict detected',
        conflictInfo: {
          serverVersion: versionCheck.serverVersion,
          lastModifiedBy: versionCheck.lastModifiedBy || '',
          lastModifiedAt: versionCheck.lastModifiedAt || '',
          hasConflict: true,
        },
      };
    }

    const newVersion = versionCheck.serverVersion + 1;
    
    // Perform optimistic locking upsert
    const { data: savedEntry, error } = await supabase
      .from('form_data_entries')
      .upsert({
        form_id: formId,
        module_id: moduleId,
        data: data,
        version: newVersion,
        last_saved_by: userId,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'form_id,module_id',
        ignoreDuplicates: false
      })
      .select('version')
      .single();

    if (error) {
      console.error(`[saveModuleWithVersion] Error saving module ${moduleId}:`, error);
      return {
        moduleId,
        success: false,
        error: `Database error: ${error.message}`,
      };
    }

    return {
      moduleId,
      success: true,
      version: savedEntry.version,
    };

  } catch (error) {
    console.error(`[saveModuleWithVersion] Unexpected error for module ${moduleId}:`, error);
    return {
      moduleId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ─── MAIN HANDLER ───────────────────────────────────────────────────────────

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed",
      }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing authorization header",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid or expired token",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const requestBody = await req.json();
    
    // Determine if this is a batch save or single save
    const isBatchSave = Array.isArray(requestBody.saves);
    
    if (isBatchSave) {
      // ─── BATCH SAVE OPERATION ───────────────────────────────────────────
      
      const parseResult = batchSaveRequestSchema.safeParse(requestBody);
      if (!parseResult.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid batch save request",
            details: parseResult.error.errors,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { formId, saves, metadata } = parseResult.data;
      const batchId = metadata?.batchId || generateBatchId();
      
      // Validate form access
      const accessCheck = await validateFormAccess(supabaseAdmin, formId, user.id);
      if (!accessCheck.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: accessCheck.error,
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Process saves in parallel for performance
      const savePromises = saves.map(save => 
        saveModuleWithVersion(
          supabaseAdmin,
          formId,
          save.moduleId,
          save.data,
          user.id,
          save.skipConflictCheck ? undefined : save.version
        )
      );

      const results = await Promise.all(savePromises);
      
      const response: BatchSaveResponse = {
        success: true,
        results,
        totalSaved: results.filter(r => r.success).length,
        totalFailed: results.filter(r => !r.success).length,
        batchId,
        serverTimestamp: new Date().toISOString(),
      };

      console.log(`[BatchSave] Form ${formId}: ${response.totalSaved}/${saves.length} modules saved successfully`);

      return new Response(
        JSON.stringify(response),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );

    } else {
      // ─── SINGLE SAVE OPERATION ──────────────────────────────────────────
      
      const parseResult = singleSaveRequestSchema.safeParse(requestBody);
      if (!parseResult.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid save request",
            details: parseResult.error.errors,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { formId, moduleId, data, version, skipConflictCheck } = parseResult.data;
      
      // Validate form access
      const accessCheck = await validateFormAccess(supabaseAdmin, formId, user.id);
      if (!accessCheck.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: accessCheck.error,
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const result = await saveModuleWithVersion(
        supabaseAdmin,
        formId,
        moduleId,
        data,
        user.id,
        skipConflictCheck ? undefined : version
      );

      if (result.success) {
        console.log(`[SingleSave] Form ${formId}, Module ${moduleId}: Saved successfully (v${result.version})`);
      } else {
        console.warn(`[SingleSave] Form ${formId}, Module ${moduleId}: Failed - ${result.error}`);
      }

      return new Response(
        JSON.stringify({
          success: result.success,
          result,
          serverTimestamp: new Date().toISOString(),
        }),
        {
          status: result.success ? 200 : 409, // 409 for conflicts
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

  } catch (error) {
    console.error("[saveFormModuleDataV2] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}); 