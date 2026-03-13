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
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('multipart')) {
      return res.status(400).json({ error: 'Expected multipart form data' });
    }

    // Collect raw body first
    const chunks = [];
    await new Promise((resolve, reject) => {
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', resolve);
      req.on('error', reject);
    });
    const bodyBuffer = Buffer.concat(chunks);

    // Forward to ElevenLabs
    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.elevenlabs.io',
        path: '/v1/voices/add',
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': contentType,
          'Content-Length': bodyBuffer.length,
        }
      };

      const proxyReq = https.request(options, (proxyRes) => {
        let data = [];
        proxyRes.on('data', chunk => data.push(chunk));
        proxyRes.on('end', () => {
          resolve({
            statusCode: proxyRes.statusCode,
            body: Buffer.concat(data).toString()
          });
        });
      });

      proxyReq.on('error', reject);
      proxyReq.write(bodyBuffer);
      proxyReq.end();
    });

    // Try to parse as JSON, handle gracefully if not
    try {
      const parsed = JSON.parse(result.body);
      return res.status(result.statusCode).json(parsed);
    } catch {
      return res.status(result.statusCode).json({
        error: 'ElevenLabs error (status ' + result.statusCode + '): ' + result.body.substring(0, 200)
      });
    }

  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
};

module.exports.config = { api: { bodyParser: false } };
