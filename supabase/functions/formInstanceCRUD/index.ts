import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
};

// Default modules to create for new FLRA forms (based on live database)
const DEFAULT_MODULES = [
  {
    id: "8ec1ce90-8e51-45d6-9c40-778b00cfedde",
    name: "header",
    order: 0,
    required: true,
  },
  {
    id: "8aff26cd-32f6-4186-b0ea-430fede805f6",
    name: "general_information",
    order: 1,
    required: true,
  },
  {
    id: "c77e0ad9-6162-495c-919b-d250670621bd",
    name: "pre_job_checklist",
    order: 2,
    required: true,
  },
  {
    id: "872d19a1-32aa-4e2e-b9a8-bb101e907890",
    name: "ppe_platform_inspection",
    order: 3,
    required: true,
  },
  {
    id: "a417e8f4-1c0f-4782-b6de-dd9073f60c49",
    name: "task_hazard_control",
    order: 4,
    required: true,
  },
  {
    id: "8bccd1bc-787c-4ca1-98db-88509b04949c",
    name: "photos",
    order: 5,
    required: false,
  },
  {
    id: "9695b682-a8e0-484f-b388-87ba051d44e1",
    name: "signatures",
    order: 6,
    required: true,
  },
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  // Only allow POST and DELETE
  if (!["POST", "DELETE"].includes(req.method)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed",
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Get user from JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing authorization header",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
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
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (req.method === "POST") {
      // CREATE NEW FORM
      const { title, description } = await req.json();

      if (!title) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Title is required",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Check user's active form count (enforce 5-form limit)
      const { count, error: countError } = await supabaseAdmin
        .from("form_instances")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .or("auto_archived.is.null,auto_archived.eq.false");

      if (countError) {
        console.error("[formInstanceCRUD] Count error:", countError);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to check form limit",
            details: countError.message,
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (count && count >= 5) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "Maximum of 5 active forms allowed. Please delete or archive existing forms.",
            code: "FORM_LIMIT_EXCEEDED",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Generate form number
      const date = new Date();
      const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");
      const random = Math.floor(1000 + Math.random() * 9000);
      const formNumber = `FLRA-${ymd}-${random}`;

      // Create new form instance
      const { data: newForm, error: createError } = await supabaseAdmin
        .from("form_instances")
        .insert({
          user_id: user.id,
          form_number: formNumber,
          title: title,
          description: description || null,
          status: "draft",
          auto_archived: false,
        })
        .select()
        .single();

      if (createError) {
        console.error("[formInstanceCRUD] Create error:", createError);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to create form",
            details: createError.message,
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Create default modules for the form
      try {
        const moduleInserts = DEFAULT_MODULES.map((module) => ({
          form_id: newForm.id,
          module_id: module.id,
          module_order: module.order,
          is_required: module.required,
          completion_state: "not_started",
        }));

        const { error: moduleError } = await supabaseAdmin
          .from("form_instance_modules")
          .insert(moduleInserts);

        if (moduleError) {
          console.error(
            "[formInstanceCRUD] Module creation error:",
            moduleError
          );
          // Don't fail the entire request, but log the error
          // The form is created, modules can be added later
        }
      } catch (moduleErr) {
        console.error(
          "[formInstanceCRUD] Module creation exception:",
          moduleErr
        );
        // Continue - form is created successfully
      }

      return new Response(
        JSON.stringify({
          success: true,
          form: newForm,
          message: "Form created successfully",
        }),
        {
          status: 201,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (req.method === "DELETE") {
      // DELETE FORM
      const { formId } = await req.json();

      if (!formId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Form ID is required",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Validate user owns the form and it's not archived
      const { data: formToDelete, error: validateError } = await supabaseAdmin
        .from("form_instances")
        .select("id, user_id, auto_archived, title")
        .eq("id", formId)
        .single();

      if (validateError || !formToDelete) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Form not found",
          }),
          {
            status: 404,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (formToDelete.user_id !== user.id) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Unauthorized: You can only delete your own forms",
          }),
          {
            status: 403,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (formToDelete.auto_archived === true) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Cannot delete archived forms",
            code: "FORM_ARCHIVED",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Delete all related data (cascade delete)
      // Note: This should be done in a transaction, but for simplicity we'll do sequential deletes

      // Delete form instance modules and their related data
      const { error: moduleDeleteError } = await supabaseAdmin
        .from("form_instance_modules")
        .delete()
        .eq("form_id", formId);

      if (moduleDeleteError) {
        console.error(
          "[formInstanceCRUD] Module delete error:",
          moduleDeleteError
        );
        // Continue with form deletion even if modules fail
      }

      // Delete module-specific data tables (based on your database schema)
      const moduleDataTables = [
        "form_instance_general_info",
        "form_instance_pre_job_checklist",
        "form_instance_ppe_platform",
        "form_instance_hazards",
        "form_asset_photos",
        "form_instance_signatures",
        "form_instance_module_fields", // Also delete any custom fields
      ];

      for (const table of moduleDataTables) {
        const { error } = await supabaseAdmin
          .from(table)
          .delete()
          .eq("form_id", formId);

        if (error) {
          console.error(
            `[formInstanceCRUD] Error deleting from ${table}:`,
            error
          );
          // Continue with other deletions
        }
      }

      // Finally, delete the form instance itself
      const { error: deleteError } = await supabaseAdmin
        .from("form_instances")
        .delete()
        .eq("id", formId);

      if (deleteError) {
        console.error("[formInstanceCRUD] Form delete error:", deleteError);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to delete form",
            details: deleteError.message,
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Form "${formToDelete.title}" deleted successfully`,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
  } catch (e) {
    console.error("[formInstanceCRUD] ERROR:", e);
    return new Response(
      JSON.stringify({
        success: false,
        error: e instanceof Error ? e.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
