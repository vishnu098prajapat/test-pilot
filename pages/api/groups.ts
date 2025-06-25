
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
    console.error('[API-GROUPS-DB] Error reading or parsing DB file:', error);
  }
  return [];
}

function writeGroupsDb(data: Group[]): boolean {
  try {
    fs.writeFileSync(GROUPS_DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('[API-GROUPS-DB] Error writing to DB file:', error);
    return false;
  }
}

function generateGroupCode(length = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}


export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { teacherId, studentIdentifier } = req.query;

    if (teacherId && typeof teacherId === 'string') {
        const allGroups = readGroupsDb();
        const teacherGroups = allGroups.filter(g => g.teacherId === teacherId);
        teacherGroups.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return res.status(200).json(teacherGroups);
    }
    
    if (studentIdentifier && typeof studentIdentifier === 'string') {
        const allGroups = readGroupsDb();
        const normalizedStudentId = studentIdentifier.toLowerCase();
        const studentGroups = allGroups.filter(g => 
            g.studentIdentifiers.some(id => id.toLowerCase() === normalizedStudentId)
        );
        studentGroups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return res.status(200).json(studentGroups);
    }
    
    return res.status(400).json({ message: 'A teacherId or studentIdentifier is required.' });

  } else if (req.method === 'POST') {
    const { name, teacherId } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return res.status(400).json({ message: 'Valid group name is required' });
    }
    if (!teacherId || typeof teacherId !== 'string') {
      return res.status(400).json({ message: 'Teacher ID is required' });
    }

    const allGroups = readGroupsDb();
    const newGroup: Group = {
      id: `group-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: name.trim(),
      teacherId,
      groupCode: generateGroupCode(),
      studentIdentifiers: [],
      createdAt: new Date().toISOString(),
    };

    allGroups.push(newGroup);
    const success = writeGroupsDb(allGroups);

    if (success) {
      res.status(201).json(newGroup);
    } else {
      res.status(500).json({ message: 'Failed to save group to the database' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
