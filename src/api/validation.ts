/**
 * API Validation Utilities
 *
 * Provides validation functions for API input parameters.
 * Validates UUIDs and other input formats before database queries.
 */

/**
 * RFC 4122 compliant UUID regex
 * Validates version (1-5) and variant bits (8, 9, a, b)
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID v4 format
 *
 * @param value - The value to validate
 * @returns true if the value is a valid UUID, false otherwise
 *
 * @example
 * ```typescript
 * is_valid_uuid('123e4567-e89b-12d3-a456-426614174000'); // true
 * is_valid_uuid('tax-form-agent-new'); // false
 * is_valid_uuid(null); // false
 * ```
 */
export function is_valid_uuid(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }
  return UUID_REGEX.test(value);
}

/**
 * Result of validating an array of UUIDs
 */
export interface UuidArrayValidationResult {
  /** UUIDs that passed validation */
  valid: string[];
  /** UUIDs that failed validation */
  invalid: string[];
  /** True if all UUIDs were valid */
  all_valid: boolean;
}

/**
 * Validates an array of UUID strings, separating valid from invalid
 *
 * @param values - Array of strings to validate as UUIDs
 * @returns Object containing valid UUIDs, invalid UUIDs, and all_valid flag
 *
 * @example
 * ```typescript
 * const result = validate_uuid_array([
 *   '123e4567-e89b-12d3-a456-426614174000',
 *   'not-a-uuid',
 *   'f47ac10b-58cc-4372-a567-0e02b2c3d479'
 * ]);
 * // result.valid = ['123e4567-e89b-12d3-a456-426614174000', 'f47ac10b-58cc-4372-a567-0e02b2c3d479']
 * // result.invalid = ['not-a-uuid']
 * // result.all_valid = false
 * ```
 */
export function validate_uuid_array(values: string[]): UuidArrayValidationResult {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const value of values) {
    if (is_valid_uuid(value)) {
      valid.push(value);
    } else {
      invalid.push(value);
    }
  }

  return { valid, invalid, all_valid: invalid.length === 0 };
}
