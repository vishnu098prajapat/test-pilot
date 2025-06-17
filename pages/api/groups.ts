
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Placeholder for future groups API
  // For now, it indicates the feature is not implemented or on hold
  res.setHeader('Allow', []); // No methods allowed for now
  res.status(405).json({ message: `Method ${req.method} Not Allowed. Groups feature is currently on hold.` });
}
