
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Prefer x-forwarded-for if behind a proxy, fallback to remoteAddress
    const forwarded = req.headers['x-forwarded-for'];
    let ip;
    if (typeof forwarded === 'string') {
      ip = forwarded.split(',')[0].trim();
    } else if (Array.isArray(forwarded)) {
      ip = forwarded[0].trim();
    } else {
      ip = req.socket?.remoteAddress || req.connection?.remoteAddress;
    }
    
    // Basic check for localhost/internal IPs if needed for development clarity
    if (ip === '::1' || ip === '127.0.0.1') {
        ip = '127.0.0.1 (localhost)';
    } else if (ip?.startsWith('::ffff:')) {
        ip = ip.substring(7); // Clean up IPv4 mapped IPv6 addresses
    }

    res.status(200).json({ ip });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
