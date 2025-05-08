# HrdHat App – Rules for Saving Photos and Signatures

This document defines strict rules for how **photos** and **signatures** must be saved, stored, updated, and secured in the HrdHat FLRA system. These rules are enforced both in frontend logic and backend Supabase policies.

---

## 📸 PHOTO SAVING RULES

1. **Photos must only be uploaded after a `form_id` exists.**  
   Call `ensureFormRowExists(formId, userId)` before allowing upload.

2. **Photos are uploaded to Supabase Storage under:**  
   `form_uploads/${formId}/photos/{timestamp}_{filename}`

3. **Only the following file types are allowed:**  
   `image/jpeg`, `image/png`, `image/heic`, `image/heif`

4. **Max photo size is 5MB.**  
   Files with `file_size <= 0` are rejected.

5. **Metadata must be saved immediately to `form_data_photos`:**  
   Must include:

   - `form_id`
   - `form_module_id`
   - `storage_path`
   - `public_url`
   - `uploaded_by`
   - `uploaded_at`

6. **Photos are soft-deleted, not removed from storage.**  
   On delete, set:

   - `is_deleted = true`
   - `deleted_at = new Date().toISOString()`

7. **Only the original uploader can soft-delete their photo.**  
   Enforced via RLS.

8. **Photo uploads are not debounced.**  
   Save immediately on file selection.

9. **Frontend must show:**
   - Upload progress
   - Thumbnail preview
   - Soft-delete (×) button
   - Upload limit enforcement (e.g., max 10)

---

## ✍️ SIGNATURE SAVING RULES

1. **User must have a `form_id` before signing.**

2. **Signature is drawn in `<canvas>` and exported as a PNG `Blob`.**

3. **Signatures are uploaded to Supabase Storage under:**  
   `signatures/${formId}/signatures/${userId}.png`

4. **Signatures are saved immediately after drawing — no debounce.**

5. **Only PNG format is allowed for signatures.**

6. **Each user may have only one signature per form.**  
   Uploading again overwrites the previous file.

7. **No delete option for signatures.**  
   Overwrite only. This keeps history minimal and secure.

8. **Metadata is saved to `form_signatures`:**

   - `form_id`
   - `signed_by`
   - `signed_at`
   - `storage_path`
   - `public_url`

9. **Signature canvas must show:**
   - Real-time preview
   - Save confirmation
   - Overwrite warning (optional)

---

## 🔐 SECURITY ENFORCEMENT (BACKEND)

1. **All file paths must start with a valid `formId` the user owns.**

2. **Only the user who created the form can upload/view:**

   - Photos (`uploaded_by == auth.uid()`)
   - Signatures (`signed_by == auth.uid()`)

3. **RLS for `form_data_photos`:**

   - SELECT: allowed if `form.created_by == auth.uid()` and `is_deleted == false`
   - INSERT: allowed only if `uploaded_by == auth.uid()` and same form owner
   - UPDATE: allowed for soft delete by uploader
   - DELETE: not allowed (soft delete only)

4. **RLS for `form_signatures`:**

   - SELECT: allowed if `form.created_by == auth.uid()`
   - INSERT: allowed only by `signed_by == auth.uid()`
   - UPDATE: allowed to overwrite by same user
   - DELETE: not allowed

5. **Storage access uses signed URLs only.**
   - No public access
   - Access expires
   - Paths must match the user’s form ownership

---

## ✅ IMPLEMENTATION CHECKPOINTS

- Photos and signatures are linked via `form_id`
- No uploads allowed before form exists
- All uploads saved immediately (no debounce)
- All deletions are soft deletes (photos only)
- Signature can only be overwritten, not removed
- All metadata must be persisted at time of upload
- All access is gated by Row-Level Security in Supabase

---

This file defines enforceable, testable logic for image handling across all environments. Store this in your project’s `docs/rules/` folder or sync into Cursor's `.md` rules system.
