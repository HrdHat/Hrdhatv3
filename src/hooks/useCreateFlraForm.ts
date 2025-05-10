import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../session/AuthProvider";
import { createFormWithModules } from "../services/forms/createFormWithModules";
import { supabase } from "../db/supabaseClient";

interface CreateFlraFormOptions {
  title?: string;
  description?: string;
}

interface FlraForm {
  id: string;
  title: string;
  description?: string;
}

interface CreateFlraFormResult {
  form: FlraForm | null;
  error: string | null;
}

export const useCreateFlraForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const createNewFlra = async ({
    title = "New FLRA",
    description = "",
  }: CreateFlraFormOptions = {}): Promise<CreateFlraFormResult> => {
    if (!user) {
      console.error("User not authenticated");
      return { form: null, error: "You must be logged in to create a FLRA" };
    }

    try {
      setLoading(true);

      // 1. Get FLRA form_list id
      const { data: formList, error: formListError } = await supabase
        .from("form_list")
        .select("id")
        .eq("name", "FLRA")
        .single();

      if (formListError || !formList) {
        console.error("Failed to fetch FLRA form list:", formListError);
        return { form: null, error: "Failed to fetch FLRA form list" };
      }

      // 2. Get user's preferred modules
      const { data: userModules, error: modulesError } = await supabase
        .from("user_form_module_preferences")
        .select("module_list_id, module_order")
        .eq("user_id", user.id)
        .eq("form_list_id", formList.id)
        .order("module_order");

      if (modulesError) {
        console.error("Failed to fetch user modules:", modulesError);
        return { form: null, error: "Failed to fetch user modules" };
      }

      if (!userModules || userModules.length === 0) {
        console.error("No modules found for user");
        return { form: null, error: "No modules found for user" };
      }

      const moduleIds = userModules.map((m) => m.module_list_id);

      // 3. Create form with modules
      const result = await createFormWithModules({
        companyId: user.user_metadata?.company_id,
        title,
        description,
        moduleIds,
      });

      if (result.error) {
        console.error("FLRA creation failed:", result.error);
        return { form: null, error: result.error };
      }

      if (!result.form?.id) {
        console.error("Form ID missing from response:", result);
        return { form: null, error: "Form ID missing from response" };
      }

      navigate(`/flra/${result.form.id}`);
      return { form: result.form as FlraForm, error: null };
    } catch (err) {
      console.error(
        "FLRA creation failed:",
        err instanceof Error ? err.message : err
      );
      return { form: null, error: "Failed to create FLRA form" };
    } finally {
      setLoading(false);
    }
  };

  return {
    createNewFlra,
    loading,
  };
};
