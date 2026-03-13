const https = require('https');
const { URL } = require('url');

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
    // Forward the multipart form data to ElevenLabs
    const contentType = req.headers['content-type'];

    const options = {
      hostname: 'api.elevenlabs.io',
      path: '/v1/voices/add',
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': contentType,
      }
    };

    const proxyReq = https.request(options, (proxyRes) => {
      let data = [];
      proxyRes.on('data', chunk => data.push(chunk));
      proxyRes.on('end', () => {
        const body = Buffer.concat(data).toString();
        res.status(proxyRes.statusCode).json(JSON.parse(body));
      });
    });

    proxyReq.on('error', (e) => {
      res.status(500).json({ error: 'Proxy error: ' + e.message });
    });

    // Collect raw body and forward
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      proxyReq.write(Buffer.concat(chunks));
      proxyReq.end();
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Disable Vercel body parsing so we get raw multipart data
module.exports.config = { api: { bodyParser: false } };
