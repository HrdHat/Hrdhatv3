import { createClient } from "@supabase/supabase-js";
import { TABLES } from "../../constants/database";
import { SaveFormModuleDataParams, ModuleData } from "../../types/formTypes";
import {
  generalInfoSchema,
  preJobChecklistSchema,
  ppeChecklistSchema,
  formInstanceSchema,
  taskHazardControlSchema,
  formAssetPhotoSchema,
  signatureSchema,
  moduleDataSchema,
} from "../../types/formSchemas";

// Initialize Supabase client at module level
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Map module keys to their validation schemas
const schemaMap = {
  header: formInstanceSchema,
  general: generalInfoSchema,
  preJobChecklist: preJobChecklistSchema,
  ppeChecklist: ppeChecklistSchema,
  taskHazards: taskHazardControlSchema,
  photos: formAssetPhotoSchema,
  signatures: signatureSchema,
} as const;

export async function saveFields(req: Request) {
  // Check and validate authentication
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: "Unauthorized",
          details: "Missing authorization header",
        },
      }),
      { status: 401 }
    );
  }

  try {
    // Extract and validate JWT token
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth validation error:", authError);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: "Unauthorized",
            details: "Invalid or expired token",
          },
        }),
        { status: 401 }
      );
    }

    const { formId, moduleKey, data, version, updated_at } =
      (await req.json()) as SaveFormModuleDataParams<keyof ModuleData>;

    // Validate request payload
    if (!formId || !moduleKey || !data) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: "Missing required fields",
            details: "formId, moduleKey, and data are required",
          },
        }),
        { status: 400 }
      );
    }

    // Verify form ownership
    const { data: formData, error: formError } = await supabase
      .from(TABLES.formInstances)
      .select("user_id")
      .eq("id", formId)
      .single();

    if (formError || !formData) {
      console.error("Form ownership check error:", formError);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: "Form not found",
            details: "Unable to verify form ownership",
          },
        }),
        { status: 404 }
      );
    }

    if (formData.user_id !== user.id) {
      console.error("Form ownership mismatch:", {
        formUserId: formData.user_id,
        requestUserId: user.id,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: "Forbidden",
            details: "You don't have permission to modify this form",
          },
        }),
        { status: 403 }
      );
    }

    // Validate data against schema
    try {
      const schema = schemaMap[moduleKey];
      if (!schema) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              message: "Invalid module key",
              details: `Module key '${moduleKey}' not found in schema map`,
            },
          }),
          { status: 400 }
        );
      }

      // Validate the data using safeParse for nullable fields
      const validationResult = schema.safeParse(data);
      if (!validationResult.success) {
        console.error("Validation error:", {
          moduleKey,
          data,
          errors: validationResult.error.format(),
        });
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              message: "Validation failed",
              details: validationResult.error.format(),
            },
          }),
          { status: 400 }
        );
      }

      const validatedData = validationResult.data;

      // Check for concurrent modifications
      if (updated_at) {
        const { data: currentData } = await supabase
          .from(TABLES.formInstances)
          .select("updated_at")
          .eq("id", formId)
          .single();

        if (
          currentData?.updated_at &&
          new Date(currentData.updated_at) > new Date(updated_at)
        ) {
          console.error("Concurrent modification detected:", {
            moduleKey,
            formId,
            currentVersion: currentData.updated_at,
            attemptedVersion: updated_at,
          });
          return new Response(
            JSON.stringify({
              success: false,
              error: {
                message: "Form was modified by another user",
                details: {
                  currentVersion: currentData.updated_at,
                  attemptedVersion: updated_at,
                },
              },
            }),
            { status: 409 }
          );
        }
      }

      // Determine target table
      const tableMap = {
        header: TABLES.formInstances,
        general: TABLES.formInstanceGeneralInfo,
        preJobChecklist: TABLES.formInstancePreJobChecklist,
        ppeChecklist: TABLES.formInstancePpePlatform,
        taskHazards: TABLES.formInstanceHazards,
        photos: TABLES.formAssetPhotos,
        signatures: TABLES.formInstanceSignatures,
      };

      const table = tableMap[moduleKey];
      if (!table) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              message: "Invalid module key",
              details: `No table mapping found for module key '${moduleKey}'`,
            },
          }),
          { status: 400 }
        );
      }

      // Check if this is a new record
      const { data: existingRecord } = await supabase
        .from(table)
        .select("id")
        .eq(moduleKey === "header" ? "id" : "form_instance_id", formId)
        .maybeSingle();

      const isNew = !existingRecord;

      // Prepare row data with form reference and timestamps
      const now = new Date().toISOString();
      const rowData = {
        ...validatedData,
        ...(moduleKey === "header"
          ? { id: formId }
          : { form_instance_id: formId }),
        version: (version || 0) + 1,
        updated_at: now,
        ...(isNew ? { created_at: now } : {}),
      };

      const { error } = await supabase.from(table).upsert(rowData);

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          version: rowData.version,
          updated_at: now,
        }),
        { status: 200 }
      );
    } catch (error: any) {
      console.error("Save fields error:", {
        moduleKey,
        formId,
        data,
        error: {
          message: error.message,
          details: error.details,
          stack: error.stack,
        },
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: error.message,
            details: error.details || error.stack,
          },
        }),
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Request processing error:", {
      error: {
        message: error.message,
        details: error.details,
        stack: error.stack,
      },
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: "Internal server error",
          details: error.message,
        },
      }),
      { status: 500 }
    );
  }
}
