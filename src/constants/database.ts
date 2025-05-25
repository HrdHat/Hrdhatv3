export const TABLES = {
  // Form related tables
  formInstances: "form_instances",
  formInstanceModules: "form_instance_modules",
  formInstanceModuleFields: "form_instance_module_fields",
  formInstanceGeneralInfo: "form_instance_general_info",
  formInstanceHazards: "form_instance_hazards",
  formInstancePpePlatform: "form_instance_ppe_platform",
  formInstancePreJobChecklist: "form_instance_pre_job_checklist",
  formInstanceSignatures: "form_instance_signatures",
  formAssetPhotos: "form_asset_photos",
  formDataEntries: "form_data_entries",

  // Template related tables
  formTemplates: "form_templates",
  formTemplateModules: "form_template_modules",
  templateModules: "template_modules",
  templateModuleFields: "template_module_fields",

  // User and company related tables
  profiles: "profiles",
  companies: "companies",
  projects: "projects",
  userFormModulePreferences: "user_form_module_preferences",
} as const;

export const FORM_INSTANCE_FIELDS = {
  id: "id",
  formNumber: "form_number",
  createdBy: "created_by",
  status: "status",
  lastModified: "last_modified",
  createdAt: "created_at",
  autoArchived: "auto_archived",
  data: "data",
  companyId: "company_id",
  projectId: "project_id",
  title: "title",
  description: "description",
  version: "version",
  submittedAt: "submitted_at",
  userId: "user_id",
  formModuleId: "form_module_id",
  formDate: "form_date",
  userFormId: "user_form_id",
} as const;

export const FORM_INSTANCE_MODULE_FIELDS = {
  id: "id",
  formId: "form_id",
  formModuleId: "form_module_id",
  moduleFieldId: "module_field_id",
  name: "name",
  label: "label",
  type: "type",
  required: "required",
  fieldOrder: "field_order",
  defaultValue: "default_value",
  version: "version",
} as const;

export const FORM_INSTANCE_MODULES = {
  id: "id",
  formId: "form_id",
  moduleId: "module_id",
  moduleOrder: "module_order",
  isRequired: "is_required",
  createdAt: "created_at",
  completionState: "completion_state",
} as const;

export const FORM_INSTANCE_SIGNATURES = {
  id: "id",
  formId: "form_id",
  formModuleId: "form_module_id",
  workerName: "worker_name",
  signatureUrl: "signature_url",
  signedAt: "signed_at",
  signatureHash: "signature_hash",
  role: "role",
  metadata: "metadata",
  signedBy: "signed_by",
  isDeleted: "is_deleted",
  deletedAt: "deleted_at",
} as const;

export const FORM_INSTANCE_GENERAL_INFO = {
  id: "id",
  formModuleId: "form_module_id",
  projectName: "project_name",
  projectAddress: "project_address",
  taskLocation: "task_location",
  supervisorName: "supervisor_name",
  supervisorContact: "supervisor_contact",
  date: "date",
  crewMembersCount: "crew_members_count",
  taskDescription: "task_description",
  startTime: "start_time",
  endTime: "end_time",
  createdAt: "created_at",
} as const;

export const FORM_INSTANCE_HAZARDS = {
  id: "id",
  formId: "form_id",
  formModuleId: "form_module_id",
  task: "task",
  hazard: "hazard",
  riskLevelBefore: "risk_level_before",
  control: "control",
  riskLevelAfter: "risk_level_after",
  createdAt: "created_at",
} as const;

export const FORM_INSTANCE_PPE_PLATFORM = {
  id: "id",
  formId: "form_id",
  formModuleId: "form_module_id",
  ppeHardhat: "ppe_hardhat",
  ppeSafetyVest: "ppe_safety_vest",
  ppeSafetyGlasses: "ppe_safety_glasses",
  ppeFallProtection: "ppe_fall_protection",
  ppeCoveralls: "ppe_coveralls",
  ppeGloves: "ppe_gloves",
  ppeMask: "ppe_mask",
  ppeRespirator: "ppe_respirator",
  platformLadder: "platform_ladder",
  platformStepBench: "platform_step_bench",
  platformSawhorses: "platform_sawhorses",
  platformBakerScaffold: "platform_baker_scaffold",
  platformScaffold: "platform_scaffold",
  platformScissorLift: "platform_scissor_lift",
  platformBoomLift: "platform_boom_lift",
  platformSwingStage: "platform_swing_stage",
  platformHydroLift: "platform_hydro_lift",
  createdAt: "created_at",
} as const;

export const FORM_INSTANCE_PRE_JOB_CHECKLIST = {
  id: "id",
  formId: "form_id",
  formModuleId: "form_module_id",
  isFitForDuty: "is_fit_for_duty",
  reviewedWorkAreaForHazards: "reviewed_work_area_for_hazards",
  requiredPpeForToday: "required_ppe_for_today",
  equipmentInspectionUpToDate: "equipment_inspection_up_to_date",
  completedFlraHazardAssessment: "completed_flra_hazard_assessment",
  safetySignageInstalledAndChecked: "safety_signage_installed_and_checked",
  workingAloneToday: "working_alone_today",
  requiredPermitsForTasks: "required_permits_for_tasks",
  barricadesSignageBarriersInstalledGood:
    "barricades_signage_barriers_installed_good",
  clearAccessToEmergencyExits: "clear_access_to_emergency_exits",
  trainedAndCompetentForTasks: "trained_and_competent_for_tasks",
  inspectedToolsAndEquipment: "inspected_tools_and_equipment",
  reviewedControlMeasuresNeeded: "reviewed_control_measures_needed",
  reviewedEmergencyProcedures: "reviewed_emergency_procedures",
  allRequiredPermitsInPlace: "all_required_permits_in_place",
  communicatedWithCrewAboutPlan: "communicated_with_crew_about_plan",
  needForSpottersBarricadesSpecialControls:
    "need_for_spotters_barricades_special_controls",
  weatherSuitableForWork: "weather_suitable_for_work",
  knowDesignatedFirstAidAttendant: "know_designated_first_aid_attendant",
  awareOfSiteNoticesOrBulletins: "aware_of_site_notices_or_bulletins",
  createdAt: "created_at",
} as const;

export const FORM_TEMPLATES = {
  id: "id",
  name: "name",
  description: "description",
  isActive: "is_active",
  isEnabled: "is_enabled",
  createdAt: "created_at",
  updatedAt: "updated_at",
} as const;

export const FORM_TEMPLATE_MODULES = {
  id: "id",
  formListId: "form_list_id",
  moduleOrder: "module_order",
  isRequired: "is_required",
  templateModuleId: "template_module_id",
} as const;

export const TEMPLATE_MODULES = {
  id: "id",
  name: "name",
  label: "label",
  description: "description",
  version: "version",
  scope: "scope",
  companyId: "company_id",
  projectId: "project_id",
  isActive: "is_active",
  createdAt: "created_at",
  rendererKey: "renderer_key",
  usesFields: "uses_fields",
  layoutStyle: "layout_style",
} as const;

export const TEMPLATE_MODULE_FIELDS = {
  id: "id",
  moduleId: "module_id",
  name: "name",
  label: "label",
  type: "type",
  required: "required",
  fieldOrder: "field_order",
  defaultValue: "default_value",
  version: "version",
  scope: "scope",
  companyId: "company_id",
  projectId: "project_id",
} as const;

export const PROFILES = {
  id: "id",
  email: "email",
  fullName: "full_name",
  phoneNumber: "phone_number",
  company: "company",
  positionTitle: "position_title",
  createdAt: "created_at",
  updatedAt: "updated_at",
  lastLogin: "last_login",
  isActive: "is_active",
  logoUrl: "logo_url",
  defaultFormName: "default_form_name",
} as const;

export const COMPANIES = {
  id: "id",
  name: "name",
  createdAt: "created_at",
} as const;

export const PROJECTS = {
  id: "id",
  companyId: "company_id",
  name: "name",
  createdAt: "created_at",
} as const;

export const USER_FORM_MODULE_PREFERENCES = {
  id: "id",
  userId: "user_id",
  formListId: "form_list_id",
  moduleOrder: "module_order",
  isRequired: "is_required",
  createdAt: "created_at",
  templateModuleId: "template_module_id",
} as const;

export const FORM_DATA_ENTRIES = {
  id: "id",
  formId: "form_id",
  moduleId: "module_id",
  data: "data",
  createdAt: "created_at",
  updatedAt: "updated_at",
} as const;

export const FORM_ASSET_PHOTOS = {
  id: "id",
  formId: "form_id",
  formModuleId: "form_module_id",
  photoUrl: "photo_url",
  photoHash: "photo_hash",
  metadata: "metadata",
  uploadedBy: "uploaded_by",
  uploadedAt: "uploaded_at",
  isDeleted: "is_deleted",
  deletedAt: "deleted_at",
  photoDescription: "photo_description",
  tag: "tag",
  source: "source",
  sortOrder: "sort_order",
} as const;

export const STORAGE_BUCKETS = {
  formUploads: "form_uploads",
  photos: "photos",
  signatures: "signatures",
} as const;
