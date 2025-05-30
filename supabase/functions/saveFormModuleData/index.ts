/*
LEGACY EDGE FUNCTION - DECOMMISSIONED
=====================================

This function used the old per-table approach that has been replaced by the new JSONB system.
According to the NEW SAVING PLAN, this has been phased out during implementation.

🔴 Replace: supabase/functions/saveFormModuleData/ (per-table approach)

Do not use this function - it has been superseded by:
- saveFormModuleDataV2 (new JSONB approach)
- formInstanceCRUD (unified CRUD operations)

Original implementation: ~500 lines of per-table logic removed.
*/

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      success: false,
      error: {
        message: "LEGACY: This function has been replaced by saveFormModuleDataV2",
        details: "Use the new JSONB-based saveFormModuleDataV2 function instead"
      }
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 410 // Gone
    }
  );
}); 