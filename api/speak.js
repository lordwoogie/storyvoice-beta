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
  if (!code || code !== process.env.ACCESS_CODE) {
    return res.status(401).json({ error: 'Invalid access code' });
  }

  // Check API key is configured
  if (!process.env.ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: 'Server misconfigured: missing API key' });
  }

  try {
    const body = req.body;
    if (!body || !body.voice_id || !body.text) {
      return res.status(400).json({ error: 'voice_id and text are required' });
    }

    const postData = JSON.stringify({
      text: body.text,
      model_id: body.model_id || 'eleven_multilingual_v2',
      voice_settings: body.voice_settings || { stability: 0.6, similarity_boost: 0.85 }
    });

    await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.elevenlabs.io',
        path: '/v1/text-to-speech/' + encodeURIComponent(body.voice_id),
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
          // Collect error response
          let errData = [];
          proxyRes.on('data', chunk => errData.push(chunk));
          proxyRes.on('end', () => {
            const errBody = Buffer.concat(errData).toString();
            try {
              const parsed = JSON.parse(errBody);
              res.status(proxyRes.statusCode).json(parsed);
            } catch {
              res.status(proxyRes.statusCode).json({
                error: 'ElevenLabs error (status ' + proxyRes.statusCode + '): ' + errBody.substring(0, 200)
              });
            }
            resolve();
          });
          return;
        }

        // Stream audio back
        res.setHeader('Content-Type', 'audio/mpeg');
        proxyRes.pipe(res);
        proxyRes.on('end', resolve);
      });

      proxyReq.on('error', (e) => {
        res.status(500).json({ error: 'Connection error: ' + e.message });
        resolve();
      });

      proxyReq.write(postData);
      proxyReq.end();
    });

  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
};
