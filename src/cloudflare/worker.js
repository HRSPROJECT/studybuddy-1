/**
 * StudyBuddy API Worker
 * 
 * This Cloudflare Worker proxies requests to various AI services and manages API keys.
 * It handles rotation between multiple API keys to prevent rate limiting issues.
 */

// Configuration constants
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

// API keys for different services (to be stored in Cloudflare Worker environment variables)
// For local development, these can be hard-coded, but in production they should be environment variables
const GROQ_API_KEYS = [
  // Add your GROQ API keys here or use environment variables
  // Example: { key: "gsk_abc123", usageCount: 0, lastUsed: 0 }
];

const GEMINI_API_KEYS = [
  // Add your Gemini API keys here or use environment variables
  // Example: { key: "AI123abc", usageCount: 0, lastUsed: 0 }
];

const TAVILY_API_KEYS = [
  // Add your Tavily API keys here or use environment variables
  // Example: { key: "tvly_abc123", usageCount: 0, lastUsed: 0 }
];

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Handle preflight CORS requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: CORS_HEADERS
    });
  }

  // Parse the URL to determine which service to call
  const url = new URL(request.url);
  const path = url.pathname.split('/').pop();

  try {
    switch (path) {
      case 'groq':
        return handleGroqRequest(request);
      case 'gemini':
        return handleGeminiRequest(request);
      case 'search':
        return handleSearchRequest(request);
      default:
        return new Response('Not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error in worker:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      }
    });
  }
}

/**
 * Handles requests to the Groq API
 */
async function handleGroqRequest(request) {
  const requestData = await request.json();
  
  // Get an available API key
  const apiKeyData = getNextAvailableKey(GROQ_API_KEYS);
  if (!apiKeyData) {
    return new Response(JSON.stringify({ error: 'No Groq API keys available' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      }
    });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeyData.key}`
      },
      body: JSON.stringify(requestData)
    });

    // Update key usage
    apiKeyData.usageCount++;
    apiKeyData.lastUsed = Date.now();

    // Pass through the response from Groq
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      }
    });
  } catch (error) {
    console.error('Groq API error:', error);
    return new Response(JSON.stringify({ error: 'Error calling Groq API' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      }
    });
  }
}

/**
 * Handles requests to the Gemini API
 */
async function handleGeminiRequest(request) {
  const requestData = await request.json();
  
  // Get an available API key
  const apiKeyData = getNextAvailableKey(GEMINI_API_KEYS);
  if (!apiKeyData) {
    return new Response(JSON.stringify({ error: 'No Gemini API keys available' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      }
    });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeyData.key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    // Update key usage
    apiKeyData.usageCount++;
    apiKeyData.lastUsed = Date.now();

    // Pass through the response from Gemini
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      }
    });
  } catch (error) {
    console.error('Gemini API error:', error);
    return new Response(JSON.stringify({ error: 'Error calling Gemini API' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      }
    });
  }
}

/**
 * Handles requests to the Tavily search API
 */
async function handleSearchRequest(request) {
  const requestData = await request.json();
  
  // Get an available API key using our rotation logic
  const apiKeyData = getNextAvailableKey(TAVILY_API_KEYS);
  if (!apiKeyData) {
    return new Response(JSON.stringify({ error: 'No Tavily API keys available' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      }
    });
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tavily-API-Key': apiKeyData.key
      },
      body: JSON.stringify({
        query: requestData.query,
        search_depth: requestData.search_depth || 'basic',
        include_domains: requestData.include_domains || [],
        exclude_domains: requestData.exclude_domains || [],
        max_results: requestData.max_results || 5
      })
    });

    // Update key usage
    apiKeyData.usageCount++;
    apiKeyData.lastUsed = Date.now();

    // Pass through the response from Tavily
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      }
    });
  } catch (error) {
    console.error('Tavily API error:', error);
    return new Response(JSON.stringify({ error: 'Error calling Tavily API' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      }
    });
  }
}

/**
 * Gets the next available API key using a rotation strategy
 * - Prefers keys with lower usage count
 * - Checks if key has exceeded rate limits
 * - Rotates through keys to distribute usage
 */
function getNextAvailableKey(keyArray) {
  if (!keyArray || keyArray.length === 0) {
    return null;
  }
  
  // Sort keys by usage count (least used first)
  keyArray.sort((a, b) => a.usageCount - b.usageCount);
  
  // Check if the least used key is available
  const now = Date.now();
  const minTimeGap = 1000; // Minimum milliseconds between requests to the same key
  
  // Find first key that hasn't been used recently
  for (const keyData of keyArray) {
    if (now - keyData.lastUsed > minTimeGap) {
      return keyData;
    }
  }
  
  // If all keys have been used recently, use the least recently used one
  keyArray.sort((a, b) => a.lastUsed - b.lastUsed);
  return keyArray[0];
}

/**
 * Used to test if a key has hit its rate limit
 * In a production environment, this would need actual error detection logic
 */
async function testKeyRateLimit(keyData, apiEndpoint, testRequest) {
  try {
    // Implementation would depend on the specific API
    // This is a placeholder for actual implementation
    return true; // Key is OK to use
  } catch (error) {
    if (error.status === 429) {
      return false; // Rate limited
    }
    return true; // Other error, key might still be usable
  }
}