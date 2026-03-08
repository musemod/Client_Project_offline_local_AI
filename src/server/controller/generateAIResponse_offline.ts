import { type AIResponseInput, type AIResponseOutput } from "../types"

const modelUrl = process.env.MODEL_URL || 'http://ollama:11434/v1/chat/completions';
const modelName = process.env.AI_RESPONSE_MODEL || 'qwen2.5-coder:7b';

export async function generateAIResponse({
  naturalLanguageQuery,
  databaseQueryResult,
  searchResults,
  source,
  sqlQuery = '',
}: AIResponseInput): Promise<AIResponseOutput> {

  // Determine which data to use
  const data = databaseQueryResult || searchResults || [];

  if (!data || data.length === 0) {
    return {
      response: 'Answer not found at this time. Please try rephrasing your question',
      found: false,
      source,
      sqlQuery,
    };
  }

  // Build context with source information
  let context = '';

  if (source === 'ai') {
    context = 'Database query results:\n' + JSON.stringify(data, null, 2);
  } else {
    context = 'Search results:\n\n';
    data.forEach((item, index) => {
      if (item.title && item.description) {
        context += `${index + 1}. ${item.title} - ${item.description}`;
        if (item.category) context += ` [${item.category}]`;
        context += '\n';
      } else {
        context += `${index + 1}. ${JSON.stringify(item)}\n`;
      }
    });
  }

  const responsePrompt = `You are a security compliance assistant for Vault Defense. Answer the user's question directly using only the provided data.

RULES:
- Start your answer immediately - no introductions, no repeating user prompt
- Use complete sentences, not bullet points
- Include names and roles when relevant
- Keep it concise (2-4 sentences)
- Never mention "results" or "search"

User Question: ${naturalLanguageQuery}

${context}

Answer:`;

  // Retry logic 
  const maxRetries = 3;
  let lastError: Error | null = null;
  let delay = 100;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} to call Ollama...`);

      const response = await fetch(modelUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: 'user', content: responsePrompt }],
          temperature: 0.3,
          max_tokens: 400,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      let aiResponse = responseData.choices?.[0]?.message?.content?.trim();

      if (!aiResponse) {
        throw new Error('Empty response from model');
      }

      // Clean up any remaining artifacts
      aiResponse = aiResponse
        .replace(/<\|[^|]+\|>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      return {
        response: aiResponse,
        found: true,
        source,
        sqlQuery,
        rawData: data,
      };

    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  }

  return {
    response: 'I found some information but am having trouble formatting it. Please try rephrasing your question.',
    found: true,
    source,
    sqlQuery,
    rawData: data,
  };
}