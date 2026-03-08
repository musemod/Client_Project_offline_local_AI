// Export constants for use in other files
export const TABLE_NAMES = ['allTrustControls', 'allTrustFaqs', 'allTeams'] as const;

export const COLUMN_NAMES = [
  'firstName', 'lastName', 'searchText', 'isActive', 'employeeId',
  'responseTimeHours', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy',
  'short', 'long', 'question', 'answer', 'id', 'category', 'role', 'email'
] as const;

export const CATEGORY_VALUES = [
  'Cloud Security',
  'Data Security',
  'Organizational Security',
  'Secure Development',
  'Privacy',
  'Security Monitoring'
] as const;

// Helper function to generate schema description for AI
export function generateSchemaDescription(): string {
  const categoryList = CATEGORY_VALUES.map(v => `'${v}'`).join(', ');
  
  return `Database schema for security compliance:

Table: "allTrustControls"
Columns:
  - id (string): Primary key
  - category (string): Values are ${categoryList}
  - short (string): Brief control description
  - long (string): Detailed control description
  - searchText (string): Full-text search column (concatenated searchable text)
  - createdAt (timestamp): Creation timestamp
  - createdBy (string): User who created
  - updatedAt (timestamp): Last update timestamp
  - updatedBy (string): User who last updated

Table: "allTrustFaqs"
Columns:
  - id (string): Primary key
  - category (string): Values are ${categoryList}
  - question (string): FAQ question
  - answer (string): FAQ answer
  - searchText (string): Full-text search column (concatenated searchable text)
  - createdAt (timestamp): Creation timestamp
  - createdBy (string): User who created
  - updatedAt (timestamp): Last update timestamp
  - updatedBy (string): User who last updated

Table: "allTeams"
Columns:
  - id (string): Primary key
  - firstName (string): Team member's first name
  - lastName (string): Team member's last name
  - role (string): Job title
  - email (string): Email address
  - isActive (boolean): Whether team member is active
  - employeeId (integer): Employee ID number
  - responseTimeHours (numeric): Average response time in hours
  - category (string): Team specialty area (matches control/FAQ categories)
  - searchText (string): Full-text search column (concatenated searchable text)
  - createdAt (timestamp): Creation timestamp
  - createdBy (string): User who created
  - updatedAt (timestamp): Last update timestamp
  - updatedBy (string): User who last updated

IMPORTANT QUOTING RULES:
- All table names MUST be double-quoted: "allTrustControls", "allTrustFaqs", "allTeams"
- All column names MUST be double-quoted: "firstName", "lastName", "category", etc.
- String literals use single quotes: 'Cloud Security'
- Use ILIKE for case-insensitive searches
- Category values must use exact case as shown above`;
}


// // Export constants for use in other files
// export const TABLE_NAMES = ['allTrustControls', 'allTrustFaqs', 'allTeams'] as const;

// export const COLUMN_NAMES = [
//   'firstName', 'lastName', 'searchText', 'isActive', 'employeeId',
//   'responseTimeHours', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy',
//   'short', 'long', 'question', 'answer', 'id', 'category', 'role', 'email'
// ] as const;

// export const CATEGORY_VALUES = [
//   'Cloud Security',
//   'Data Security',
//   'Organizational Security',
//   'Secure Development',
//   'Privacy',
//   'Security Monitoring'
// ] as const;


// export function generateSchemaDescription(): string {
//   return `CREATE TABLE "allTeams" (
//   "firstName" TEXT,
//   "lastName" TEXT,
//   "email" TEXT,
//   "role" TEXT,
//   "category" TEXT,
//   "isActive" BOOLEAN,
//   "employeeId" INTEGER,
//   "responseTimeHours" NUMERIC,
//   "searchText" TEXT,
//   "createdAt" TIMESTAMP,
//   "createdBy" TEXT,
//   "updatedAt" TIMESTAMP,
//   "updatedBy" TEXT,
//   "id" TEXT PRIMARY KEY
// );

// CREATE TABLE "allTrustControls" (
//   "short" TEXT,
//   "long" TEXT,
//   "category" TEXT,
//   "searchText" TEXT,
//   "createdAt" TIMESTAMP,
//   "createdBy" TEXT,
//   "updatedAt" TIMESTAMP,
//   "updatedBy" TEXT,
//   "id" TEXT PRIMARY KEY
// );

// CREATE TABLE "allTrustFaqs" (
//   "question" TEXT,
//   "answer" TEXT,
//   "category" TEXT,
//   "searchText" TEXT,
//   "createdAt" TIMESTAMP,
//   "createdBy" TEXT,
//   "updatedAt" TIMESTAMP,
//   "updatedBy" TEXT,
//   "id" TEXT PRIMARY KEY
// );

// CATEGORY VALUES: 'Cloud Security', 'Data Security', 'Organizational Security', 'Secure Development', 'Privacy', 'Security Monitoring'`;
// }