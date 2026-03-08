import { 
  generateSchemaDescription, 
  getFewShotExamples,
  TABLE_NAMES,
  COLUMN_NAMES,
  CATEGORY_VALUES 
} from "../sql_db/schemas-helper";

/**
 * TEXT-TO-SQL SERVICE
 * 
 * A DEVELOPMENT TOOL designed for rapid prototyping with small datasets, NOT production use.
 * 
 * Purpose:
 * - Generate SQL queries from natural language using local LLM models
 * - Test text-to-SQL pipeline integration
 * - Provide fallback SQL generation when search/cache miss
 * 
 * Why Not RAG or Agentic AI:
 * - Small, focused dataset (3 tables, <50 total rows) fits entirely in context window
 * - Two-week development timeline prioritized working pipeline over complex architecture
 * - RAG would add latency with minimal benefit for this data size
 * - Agentic systems require additional model calls, increasing VRAM pressure
 * - Current approach provides immediate feedback for prompt engineering
 * 
 * When to Upgrade:
 * - Dataset grows beyond context window limits (>4K tokens)
 * - Need to handle hundreds of tables or dynamic schemas
 * - Production deployment requires higher accuracy
 * - Multi-step queries needing reasoning and validation
 * 
 * Limitations:
 * - Models (7B Q4 GGUF) may hallucinate tables/columns not in schema
 * - Not all models reliably follow system instructions
 * - SQL extraction includes post-processing fixes that mask model errors
 * - Limited to SELECT queries only (read-only database)
 * 
 * Design Philosophy:
 * - Schema and examples dynamically generated from single source of truth
 * - Aggressive SQL extraction to handle model hallucinations
 * - Strict SELECT-only enforcement for read-only safety
 */


export class AIService {
  private readonly modelUrl: string;
  private readonly modelName: string;

  constructor() {
    this.modelUrl = process.env.MODEL_URL || '';
    this.modelName = process.env.TEXT2SQL_MODEL || '';
  }

  private get isConfigured(): boolean {
    return Boolean(this.modelUrl && this.modelName);
  }


  private extractSQLFromResponse(rawResponse: string): string {
  console.log("[AIService] Raw response:", rawResponse.substring(0, 200) + "...");
  
  // Step 1: Remove ALL comments and explanatory text
  let cleaned = rawResponse
    .replace(/--.*$/gm, '')           // Remove -- line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ block comments
    .replace(/^#.*$/gm, '')           // Remove # comments
    .replace(/^\d+\.\s.*$/gm, '')     // Remove numbered lists
    .replace(/^[-*]\s.*$/gm, '')      // Remove bullet points
    .replace(/^Step\s+\d+.*$/gmi, '') // Remove "Step 1:" etc
    .replace(/^[A-Za-z]+:.*$/gm, '')  // Remove "Answer:" etc
    .trim();
  
  // Step 2: Extract from SQL code blocks (highest priority)
  // Look for ```sql then capture everything until closing ```
  const sqlBlockMatch = cleaned.match(/```sql\n([\s\S]*?)\n```/i);
  if (sqlBlockMatch) {
    let extracted = sqlBlockMatch[1].trim();
    console.log("[AIService] Found SQL code block");
    return extracted;
  }
  
  // Step 3: Extract from generic code blocks
  const codeBlockMatch = cleaned.match(/```\n([\s\S]*?)\n```/i);
  if (codeBlockMatch) {
    let extracted = codeBlockMatch[1].trim();
    console.log("[AIService] Found generic code block");
    return extracted;
  }
  
  // Step 4: Find the first SELECT statement (case-insensitive)
  const selectMatch = cleaned.match(/SELECT\s+[\s\S]+?;/i);
  if (selectMatch) {
    console.log("[AIService] Found SELECT statement");
    return selectMatch[0].trim();
  }
  
  // Step 5: If we have SELECT but no semicolon, take everything from SELECT
  const selectIdx = cleaned.toUpperCase().indexOf('SELECT');
  if (selectIdx !== -1) {
    console.log("[AIService] Found SELECT keyword without semicolon");
    return cleaned.substring(selectIdx).trim();
  }
  
  console.log("[AIService] No SQL found");
  return "";
}

  private fixDoubleQuotes(sql: string): string {
    return sql.replace(/""/g, '"');
  }

  private fixUnionAll(sql: string): string {
    return sql
      .replace(/UNION\s+ALLER/gi, 'UNION ALL')
      .replace(/UNION\s+ALL\s+ER/gi, 'UNION ALL');
  }

  private ensureQuotedIdentifiers(sql: string): string {
    console.log("[AIService] Cleaning SQL...");
    
    // 1. Extract just the SQL query
    sql = this.extractSQLFromResponse(sql);
    
    // 2. If empty, return empty
    if (!sql) {
      return "";
    }
    
    // 3. Fix UNION hallucinations
    sql = this.fixUnionAll(sql);

    // 4. Ensure table names are quoted
    for (const tableName of TABLE_NAMES) {
      const regex = new RegExp(`(?<!")\\b${tableName}\\b(?!")`, 'g');
      sql = sql.replace(regex, `"${tableName}"`);
    }

    // 5. Ensure camelCase column names are quoted
    for (const columnName of COLUMN_NAMES) {
      const aliasColumnRegex = new RegExp(`(\\w+)\\.${columnName}\\b`, 'g');
      sql = sql.replace(aliasColumnRegex, `$1."${columnName}"`);
      
      const standaloneRegex = new RegExp(`(?<!\\.)\\b${columnName}\\b(?!\\s*=)`, 'g');
      sql = sql.replace(standaloneRegex, `"${columnName}"`);
    }

    // 6. Fix category values to proper case
    for (const categoryValue of CATEGORY_VALUES) {
      const regex = new RegExp(`'${categoryValue}'|'${categoryValue.toLowerCase()}'|'${categoryValue.toUpperCase()}'`, 'gi');
      sql = sql.replace(regex, `'${categoryValue}'`);
    }

    // 7. Convert category = 'value' to category ILIKE 'value'
    sql = sql.replace(
      /WHERE\s+(\w+\.)?["']?category["']?\s*=\s*'([^']+)'/gi,
      'WHERE $1"category" ILIKE \'$2\''
    );

    // 8. Final cleanup
    sql = this.fixDoubleQuotes(sql);
    
    return sql;
  }

  async textToSQL(prompt: string): Promise<string> {
  if (!this.isConfigured) {
    throw new Error('[AIService] AI Model not configured');
  }

  const startTime = Date.now();
  console.log('[AIService] Generating SQL for:', prompt.substring(0, 50) + '...');

 try {
      // Generate schema and examples dynamically from schemas-helper
      const schema = generateSchemaDescription();
      const examples = getFewShotExamples();
      
      // Format examples in the exact same style as hardcoded version
      const examplesText = examples.map(ex => `Q: ${ex.q}\nSQL: ${ex.sql}`).join('\n\n');
      
      const userMessage = `INSTRUCTIONS:
- Generate PostgreSQL SELECT queries only
- READ-ONLY database - no INSERT/UPDATE/DELETE
- Use ILIKE for text matching
- Double-quote all identifiers: "table"."column"
- Return ONLY the SQL query, no explanations

SCHEMA:
${schema}

EXAMPLES:
${examplesText}

First, identify which tables from the schema above are needed for this query.
Then, write only the SQL query.

User question: ${prompt}

SQL:`;

      const response = await fetch(this.modelUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            { role: 'system', content: 'You are a PostgreSQL expert.' },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.1,
          max_tokens: 600
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI Model error (${response.status}): ${error}`);
      }

      const data = await response.json();
      let sql = data.choices[0].message.content;
      
      sql = this.ensureQuotedIdentifiers(sql);
      
      // Check it's a SELECT statement
      if (sql && !sql.trim().toUpperCase().startsWith('SELECT')) {
        console.warn("[AIService] Generated SQL is not a SELECT statement, returning empty");
        return "";
      }
      
      if (sql && !sql.trim().endsWith(';')) {
        sql += ';';
      }

      console.log('[AIService] SQL generated in', Date.now() - startTime, 'ms');
      console.log('[AIService] Final SQL:', sql);
      
      return sql;

    } catch (error) {
      console.error('[AIService] Error:', error);
      throw error;
    }
  }

  async isReady(): Promise<boolean> {
    if (!this.modelUrl) return false;

    try {
      const baseUrl = this.modelUrl.replace(/\/chat\/completions$/, '').replace(/\/+$/, '');
      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}