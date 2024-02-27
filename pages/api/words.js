// pages/api/words.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), 'public', '100+.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');

  if (!fileContents) {
    return res.status(500).json({ error: 'Failed to read file' });
  }

  const data = JSON.parse(fileContents);
  res.status(200).json(data);
}

