// /api/openrouter.js
export default async function handler(req, res) {
  // Block non-POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  try {
    // Determine which API key to use
    const isImageRequest = req.body?.model?.startsWith('qwen/');
    const apiKey = isImageRequest 
      ? process.env.IMAGE_API_KEY 
      : process.env.TEXT_API_KEY;

    // Validate required fields
    if (!req.body?.model || !req.body?.messages) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Forward request to OpenRouter
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers?.referer || 'https://yourdomain.com',
        'X-Title': 'TAPE - Plant Assistant'
      },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(10000) // 10s timeout
    });

    // Handle OpenRouter errors
    if (!openRouterResponse.ok) {
      const error = await openRouterResponse.json().catch(() => ({}));
      throw new Error(error.error?.message || 'API request failed');
    }

    // Return successful response
    const data = await openRouterResponse.json();
    return res.status(200).json(data);

  } catch (error) {
    // Error handling
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
