module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-access-code');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const code = req.headers['x-access-code'];
  if (!code || code !== process.env.ACCESS_CODE) {
    return res.status(401).json({ valid: false, error: 'Invalid access code' });
  }

  return res.status(200).json({ valid: true });
};
