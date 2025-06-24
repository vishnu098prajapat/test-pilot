
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
    console.error('[API-GROUPS-REMOVE] Error reading or parsing DB file:', error);
  }
  return [];
}

function writeGroupsDb(data: Group[]): boolean {
  try {
    fs.writeFileSync(GROUPS_DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('[API-GROUPS-REMOVE] Error writing to DB file:', error);
    return false;
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { groupId, studentIdentifier } = req.body;

  if (!groupId || !studentIdentifier) {
    return res.status(400).json({ message: 'Group ID and Student Identifier are required.' });
  }

  const allGroups = readGroupsDb();
  const groupIndex = allGroups.findIndex(g => g.id === groupId);

  if (groupIndex === -1) {
    return res.status(404).json({ message: 'Group not found.' });
  }

  const group = allGroups[groupIndex];
  const studentIndex = group.studentIdentifiers.findIndex(id => id.toLowerCase() === studentIdentifier.toLowerCase());

  if (studentIndex === -1) {
    // Return success even if student not found, to avoid client-side errors on potential race conditions.
    // The student is already not in the group, so the state is what we want.
    return res.status(200).json({ message: 'Student was not in the group.' });
  }

  // Remove the student
  group.studentIdentifiers.splice(studentIndex, 1);
  allGroups[groupIndex] = group;

  const success = writeGroupsDb(allGroups);

  if (success) {
    res.status(200).json({ message: 'Student removed successfully.' });
  } else {
    res.status(500).json({ message: 'Failed to update group information.' });
  }
}
