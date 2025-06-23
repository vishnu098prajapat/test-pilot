
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import type { Batch as Group } from '@/lib/types';

const GROUPS_DB_FILE_PATH = path.join(process.cwd(), 'groups_db.json');

function readGroupsDb(): Group[] {
  try {
    if (fs.existsSync(GROUPS_DB_FILE_PATH)) {
      const fileContent = fs.readFileSync(GROUPS_DB_FILE_PATH, 'utf-8');
      if (fileContent.trim() === "") return [];
      const data = JSON.parse(fileContent);
      return Array.isArray(data) ? data : [];
    }
  } catch (error) {
    console.error('[API-GROUPS-JOIN] Error reading or parsing DB file:', error);
  }
  return [];
}

function writeGroupsDb(data: Group[]): boolean {
  try {
    fs.writeFileSync(GROUPS_DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('[API-GROUPS-JOIN] Error writing to DB file:', error);
    return false;
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { groupCode, studentIdentifier } = req.body;

  if (!groupCode || typeof groupCode !== 'string' || groupCode.trim().length === 0) {
    return res.status(400).json({ message: 'A valid group code is required.' });
  }
  if (!studentIdentifier || typeof studentIdentifier !== 'string' || studentIdentifier.trim().length === 0) {
    return res.status(400).json({ message: 'A valid student identifier is required.' });
  }

  const allGroups = readGroupsDb();
  const groupIndex = allGroups.findIndex(g => g.groupCode.toUpperCase() === groupCode.toUpperCase());

  if (groupIndex === -1) {
    return res.status(404).json({ message: 'Group with this code not found.' });
  }

  const group = allGroups[groupIndex];

  if (group.studentIdentifiers.includes(studentIdentifier)) {
    return res.status(200).json({ message: 'You are already a member of this group.', groupId: group.id });
  }

  group.studentIdentifiers.push(studentIdentifier);
  allGroups[groupIndex] = group;

  const success = writeGroupsDb(allGroups);

  if (success) {
    res.status(200).json({ message: `Successfully joined group: ${group.name}`, groupId: group.id });
  } else {
    res.status(500).json({ message: 'Failed to update group information.' });
  }
}
