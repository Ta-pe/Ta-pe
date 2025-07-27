export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const isImageRequest = req.body?.model?.startsWith('qwen/');
    const apiKey = isImageRequest ? process.env.IMAGE_API_KEY : process.env.TEXT_API_KEY;

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers?.referer || '',
        'X-Title': 'TAPE - Technology Assisted Plant Emulator'
      },
      body: JSON.stringify(req.body)
    });

    if (!openRouterResponse.ok) {
      const errorData = await openRouterResponse.json();
      throw new Error(errorData.error?.message || 'API request failed');
    }

    const data = await openRouterResponse.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('OpenRouter API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
