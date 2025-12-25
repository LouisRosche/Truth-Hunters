/**
 * SUBJECTS CONSTANTS
 * List of all available subjects in the claims database
 * This is a static list to avoid importing the entire claims database
 */

export const ALL_SUBJECTS = [
  'Biology',
  'Chemistry',
  'Climate Science',
  'Computer Science',
  'Current Events',
  'Economics',
  'Geography',
  'History',
  'Mathematics',
  'Medicine',
  'Physics',
  'Psychology',
  'Social Media',
  'Space Science',
  'Technology'
].sort();

/**
 * Get all subjects (for compatibility with old API)
 * @returns {Array<string>} Sorted array of subject names
 */
export function getSubjects() {
  return ALL_SUBJECTS;
}
