import axios from 'axios';

// Cloudflare Worker URL
const CLOUDFLARE_WORKER_URL = 'https://shrill-disk-e215.hrsprojects2024.workers.dev';

// Groq API integration for image and text understanding
export async function processQuestionWithGroq(image, text) {
  try {
    // Convert image to base64 if present
    let imageBase64 = null;
    if (image) {
      imageBase64 = await fileToBase64(image);
    }

    const payload = {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Analyze the following ${text ? 'text' : ''}${text && image ? ' and ' : ''}${image ? 'image' : ''}. Extract the main question being asked and generate 3-5 relevant search terms for web research.` },
            ...(text ? [{ type: "text", text }] : []),
            ...(imageBase64 ? [{ 
              type: "image", 
              image_url: { url: imageBase64 }
            }] : [])
          ]
        }
      ],
      model: "llama-3.2-90b-vision-preview",
      temperature: 0.5,
      max_completion_tokens: 1024,
      top_p: 1
    };

    // Use the provided Cloudflare Worker URL
    const response = await axios.post(
      `${CLOUDFLARE_WORKER_URL}/groq`,
      payload
    );

    // Parse the response to extract question and search terms
    const content = response.data.choices[0].message.content;
    
    // Simple parsing logic - in a real app, use more robust extraction
    const extractedQuestion = extractQuestion(content);
    const searchTerms = extractSearchTerms(content);

    return {
      extractedQuestion,
      searchTerms,
      rawContent: content
    };
  } catch (error) {
    console.error('Error processing with Groq:', error);
    // Return original text if processing fails
    return { 
      extractedQuestion: text || 'Failed to extract question', 
      searchTerms: [] 
    };
  }
}

// Similar to processQuestionWithGroq but focused on explaining concepts
export async function processImageWithGroq(image, text) {
  try {
    // Convert image to base64 if present
    let imageBase64 = null;
    if (image) {
      imageBase64 = await fileToBase64(image);
    }

    const payload = {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Analyze the following ${text ? 'text' : ''}${text && image ? ' and ' : ''}${image ? 'image' : ''}. Identify the main concept that needs explanation and generate 3-5 specific search terms for detailed web research.` },
            ...(text ? [{ type: "text", text }] : []),
            ...(imageBase64 ? [{ 
              type: "image", 
              image_url: { url: imageBase64 }
            }] : [])
          ]
        }
      ],
      model: "llama-3.2-90b-vision-preview",
      temperature: 0.5,
      max_completion_tokens: 1024,
      top_p: 1
    };

    // Use the provided Cloudflare Worker URL
    const response = await axios.post(
      `${CLOUDFLARE_WORKER_URL}/groq`,
      payload
    );

    // Parse the response to extract concept and search terms
    const content = response.data.choices[0].message.content;
    
    const extractedConcept = extractConcept(content);
    const searchTerms = extractSearchTerms(content);

    return {
      extractedConcept,
      searchTerms,
      rawContent: content
    };
  } catch (error) {
    console.error('Error processing with Groq:', error);
    return { 
      extractedConcept: text || 'Failed to extract concept', 
      searchTerms: [] 
    };
  }
}

// Gemini API integration for generating answers
export async function getGeminiResponse(question, image, webResults, previousContext = []) {
  try {
    // Convert image to base64 if present
    let imageBase64 = null;
    if (image) {
      imageBase64 = await fileToBase64(image);
    }

    // Prepare web search context
    const webSearchContext = webResults && webResults.length 
      ? "Search results:\n" + webResults.map(r => `Title: ${r.title}\nSnippet: ${r.snippet}\nURL: ${r.url}`).join('\n\n') 
      : "No web search results available.";

    // Prepare conversation history context
    const conversationContext = previousContext && previousContext.length
      ? "Previous conversation:\n" + previousContext.map(ctx => `Q: ${ctx.question}\nA: ${ctx.answer}`).join('\n\n')
      : "";

    const payload = {
      contents: [
        {
          parts: [
            { text: `You are StudyBuddy, an educational AI assistant. Answer the following question based on the provided information and your knowledge.

${conversationContext ? conversationContext + '\n\n' : ''}
Question: ${question}

${webSearchContext}

Provide a comprehensive, accurate, and educational answer. If the web search results contain relevant information, incorporate it into your answer. If the information is incomplete or potentially inaccurate, note this in your response.` },
            ...(imageBase64 ? [{
              inline_data: {
                mime_type: image.type,
                data: imageBase64.split(',')[1] // Remove the data:image/jpeg;base64, prefix
              }
            }] : [])
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048,
      }
    };

    // Send request to Gemini via Cloudflare Worker - use the provided URL
    const response = await axios.post(
      `${CLOUDFLARE_WORKER_URL}/gemini`,
      payload
    );

    // Extract and return the answer
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error getting Gemini response:', error);
    throw new Error('Failed to get answer from Gemini');
  }
}

// Similar to getGeminiResponse but focused on explaining concepts
export async function getExplanationWithGemini(concept, image, webResults) {
  try {
    // Convert image to base64 if present
    let imageBase64 = null;
    if (image) {
      imageBase64 = await fileToBase64(image);
    }

    // Prepare web search context
    const webSearchContext = webResults && webResults.length 
      ? "Research findings:\n" + webResults.map(r => `Title: ${r.title}\nSnippet: ${r.snippet}\nURL: ${r.url}`).join('\n\n') 
      : "No research results available.";

    const payload = {
      contents: [
        {
          parts: [
            { text: `You are StudyBuddy, an educational AI assistant. Provide a detailed explanation of the following concept based on the provided research and your knowledge.

Concept to explain: ${concept}

${webSearchContext}

Provide a comprehensive, educational explanation that is accurate and easy to understand. Structure your response with appropriate headings and paragraphs. If the research contains relevant information, incorporate it into your explanation. Cover all important aspects of the concept.` },
            ...(imageBase64 ? [{
              inline_data: {
                mime_type: image.type,
                data: imageBase64.split(',')[1]
              }
            }] : [])
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048,
      }
    };

    // Send request to Gemini via Cloudflare Worker - use the provided URL
    const response = await axios.post(
      `${CLOUDFLARE_WORKER_URL}/gemini`,
      payload
    );

    // Extract and return the explanation
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error getting explanation from Gemini:', error);
    throw new Error('Failed to generate explanation');
  }
}

// Web search using Tavily API
export async function searchWeb(query) {
  try {
    const response = await axios.post(
      `${CLOUDFLARE_WORKER_URL}/search`,
      { 
        query,
        search_depth: 'advanced',
        include_domains: ['wikipedia.org', 'edu', 'org', 'gov'],
        max_results: 5
      }
    );

    return response.data.results || [];
  } catch (error) {
    console.error('Error searching web:', error);
    return [];
  }
}

// Enhanced web search for explanations using multiple search terms
export async function searchWebForExplanation(concept, searchTerms) {
  try {
    // Search for the main concept
    const mainResults = await searchWeb(concept);
    
    // Search for each specific term if provided
    const termResults = [];
    if (searchTerms && searchTerms.length) {
      // Limit to prevent too many API calls
      const limitedTerms = searchTerms.slice(0, 3);
      
      for (const term of limitedTerms) {
        const specificResults = await searchWeb(`${concept} ${term}`);
        termResults.push(...specificResults);
      }
    }
    
    // Combine and deduplicate results
    const allResults = [...mainResults, ...termResults];
    const uniqueResults = [];
    const seenUrls = new Set();
    
    for (const result of allResults) {
      if (!seenUrls.has(result.url)) {
        seenUrls.add(result.url);
        uniqueResults.push(result);
      }
    }
    
    // Limit to top results
    return uniqueResults.slice(0, 8);
  } catch (error) {
    console.error('Error in searchWebForExplanation:', error);
    return [];
  }
}

// Helper functions
function extractQuestion(text) {
  // Simple extraction logic - in real app, use more robust parsing
  const questionMatches = text.match(/question:?\s*([^?]*\??)/i);
  return questionMatches ? questionMatches[1].trim() : text.split('\n')[0].trim();
}

function extractConcept(text) {
  // Simple extraction logic
  const conceptMatches = text.match(/concept:?\s*([^\.]*\.?)/i);
  return conceptMatches ? conceptMatches[1].trim() : text.split('\n')[0].trim();
}

function extractSearchTerms(text) {
  // Look for search terms section
  const searchTermsMatch = text.match(/search terms:?([\s\S]*?)(?:\n\n|\n$|$)/i);
  
  if (searchTermsMatch && searchTermsMatch[1]) {
    // Extract terms that look like list items
    const listItems = searchTermsMatch[1].match(/(?:^|\n)[\s-]*([^\n-][^\n]*)/g);
    
    if (listItems && listItems.length) {
      return listItems.map(item => item.replace(/^[\s-]*/, '').trim())
        .filter(term => term.length > 0);
    }
  }
  
  // Fallback - extract key phrases
  const words = text.split(/\s+/);
  return words
    .filter(word => word.length > 5)
    .slice(0, 5);
}

// Convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}