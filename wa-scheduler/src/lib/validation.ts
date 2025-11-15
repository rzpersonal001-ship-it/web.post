/**
 * Simple validation for required fields.
 * @param fields An object where keys are field names and values are the values to check.
 * @returns An array of error messages for missing fields.
 */
export function validateRequiredFields(fields: { [key: string]: any }): string[] {
  const errors: string[] = [];
  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined || value === '') {
      errors.push(`${key} is required.`);
    }
  }
  return errors;
}
