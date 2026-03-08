
export const TABLE_NAMES = ['allTrustControls', 'allTrustFaqs', 'allTeams'] as const;
export type TableName = typeof TABLE_NAMES[number];

export const COLUMN_NAMES = [
  'id', 'firstName', 'lastName', 'role', 'email', 'isActive', 'employeeId',
  'responseTimeHours', 'short', 'long', 'question', 'answer', 'category',
  'searchText', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'
] as const;
export type ColumnName = typeof COLUMN_NAMES[number];

export const CATEGORY_VALUES = [
  'Cloud Security',
  'Data Security',
  'Organizational Security',
  'Secure Development',
  'Privacy',
  'Security Monitoring'
] as const;
export type Category = typeof CATEGORY_VALUES[number];

const TEAMS_COLUMNS = [
  'id:text', 'firstName:text', 'lastName:text', 'role:text', 'email:text',
  'isActive:boolean', 'employeeId:integer', 'responseTimeHours:numeric',
  'category:text', 'searchText:text', 'createdAt:timestamp', 'createdBy:text',
  'updatedAt:timestamp', 'updatedBy:text'
];

const CONTROLS_COLUMNS = [
  'id:text', 'category:text', 'short:text', 'long:text', 'searchText:text',
  'createdAt:timestamp', 'createdBy:text', 'updatedAt:timestamp', 'updatedBy:text'
];

const FAQS_COLUMNS = [
  'id:text', 'category:text', 'question:text', 'answer:text', 'searchText:text',
  'createdAt:timestamp', 'createdBy:text', 'updatedAt:timestamp', 'updatedBy:text'
];

export function generateSchemaDescription(): string {
  const lines: string[] = [];
  
  lines.push('INSTRUCTIONS:');
  lines.push('- Generate PostgreSQL SELECT only');
  lines.push('- Return ONLY SQL, no explanations');
  lines.push('- Use ILIKE for text matching');
  lines.push('- Double-quote all identifiers');
  lines.push('');

  lines.push('TABLES:');
  
  lines.push('"allTeams" columns:');
  lines.push('  ' + TEAMS_COLUMNS.join(', '));
  lines.push('  Notes: firstName NOT "name", role NOT "title", responseTimeHours NOT "response_time", category NOT "team"');
  lines.push('');
  
  lines.push('"allTrustControls" columns:');
  lines.push('  ' + CONTROLS_COLUMNS.join(', '));
  lines.push('  Notes: short NOT "name", long NOT "description"');
  lines.push('');
  
  lines.push('"allTrustFaqs" columns:');
  lines.push('  ' + FAQS_COLUMNS.join(', '));
  lines.push('  Notes: question NOT "faq_question", answer NOT "faq_answer"');
  lines.push('');
  
  lines.push('CATEGORIES (exact case):');
  lines.push('  ' + CATEGORY_VALUES.join(', '));
  lines.push('');
  
  lines.push('FORBIDDEN TABLES (DO NOT USE):');
  lines.push('  controls, control, security_controls, faqs, users, employees');
  lines.push('  team_members, responses, response_times, policies, documents');
  lines.push('  SecurityArchitects, DepartmentDataSecurity, DataSecurityControl');
  lines.push('');
  
  return lines.join('\n');
}

export function getFewShotExamples(): Array<{ q: string; sql: string }> {
  return [
    {
      q: "how many controls are in each category",
      sql: `SELECT "category", COUNT(*) as count FROM "allTrustControls" GROUP BY "category" ORDER BY "category";`
    },
    {
      q: "which team members are responsible for cloud security",
      sql: `SELECT "firstName", "lastName", "role" FROM "allTeams" WHERE "category" ILIKE 'Cloud Security' AND "isActive" = true;`
    },
    {
      q: "what is the average response time for the data security team",
      sql: `SELECT AVG("responseTimeHours") as avg_response FROM "allTeams" WHERE "category" ILIKE 'Data Security' AND "isActive" = true;`
    },
    {
      q: "list controls that mention both data and encryption",
      sql: `SELECT "short", "long" FROM "allTrustControls" WHERE ("short" ILIKE '%data%' OR "long" ILIKE '%data%') AND ("short" ILIKE '%encrypt%' OR "long" ILIKE '%encrypt%');`
    },
    {
      q: "find all controls and faqs about privacy",
      sql: `SELECT 'control' as type, "short", "long" FROM "allTrustControls" WHERE "category" ILIKE 'Privacy' UNION ALL SELECT 'faq' as type, "question", "answer" FROM "allTrustFaqs" WHERE "category" ILIKE 'Privacy';`
    },
    {
      q: "show me controls and faqs about API security",
      sql: `SELECT 'control' as type, "short", "long" FROM "allTrustControls" WHERE "searchText" ILIKE '%api%' UNION ALL SELECT 'faq' as type, "question", "answer" FROM "allTrustFaqs" WHERE "searchText" ILIKE '%api%';`
    }
  ];
}