# FLRA Form Save Plan - Branch Tracking

## CriticalLater

- Implement proper timestamp handling in saveFormModuleData
  - Only set created_at for new records
  - Always set updated_at on changes
  - Add validation to prevent incorrect timestamp updates

## Mandatory

- Add field name consistency utility
  - Create convertToDbFormat function
  - Ensure all field names match database schema (snake_case)
  - Add validation for field name mapping

## Reviewable

- Add bulk operation safety checks
  - Validate unique IDs in arrays
  - Verify foreign key consistency
  - Add error handling for bulk operations

## Future Phase

- Add comprehensive validation tests
- Implement offline support
- Add conflict detection for multi-user editing
- Fix File Instance Validation
  - Remove `.instanceof(File)` checks in SSR/Node contexts
  - Add loose schema validation for Node environments
  - Implement proper file type checking that works in both browser and Node
  - Add tests for file validation in both environments

## Redacted

- ~~Legacy data migration~~ (not needed as all forms are deleted)
- ~~Historical record handling~~ (not needed as all forms are deleted)

This file is for storing things we have to do, new ideas, or future work. Items are categorized as:

- CriticalLater: Must be done but not blocking current work
- Mandatory: Required for current phase
- Reviewable: Items to review and potentially implement
- Future Phase: Planned for later development
- Redacted: idea as marked as not important or required.

We will fill this out as we complete flraformsavePLAN.md.
