const https = require('https');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-access-code');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Check access code
  const code = req.headers['x-access-code'];
  if (code !== process.env.ACCESS_CODE) {
    return res.status(401).json({ error: 'Invalid access code' });
  }

  try {
    const { voice_id, text, model_id, voice_settings } = req.body;

    if (!voice_id || !text) {
      return res.status(400).json({ error: 'voice_id and text are required' });
    }

    const postData = JSON.stringify({
      text,
      model_id: model_id || 'eleven_multilingual_v2',
      voice_settings: voice_settings || { stability: 0.6, similarity_boost: 0.85 }
    });

    const options = {
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${encodeURIComponent(voice_id)}`,
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Accept': 'audio/mpeg'
      }
    };

    const proxyReq = https.request(options, (proxyRes) => {
      if (proxyRes.statusCode !== 200) {
        let errData = [];
        proxyRes.on('data', chunk => errData.push(chunk));
        proxyRes.on('end', () => {
          try {
            const errBody = JSON.parse(Buffer.concat(errData).toString());
            res.status(proxyRes.statusCode).json(errBody);
          } catch {
            res.status(proxyRes.statusCode).json({ error: 'ElevenLabs API error' });
          }
        });
        return;
      }

      // Stream audio back
      res.setHeader('Content-Type', 'audio/mpeg');
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (e) => {
      res.status(500).json({ error: 'Proxy error: ' + e.message });
    });

    proxyReq.write(postData);
    proxyReq.end();

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
