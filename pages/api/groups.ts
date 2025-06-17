
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import type { Group, GroupAnnouncement } from '@/lib/types';

const GROUPS_DB_FILE_PATH = path.join(process.cwd(), 'groups_db.json');

function readGroupsDb(): Group[] {
  try {
    if (fs.existsSync(GROUPS_DB_FILE_PATH)) {
      const fileContent = fs.readFileSync(GROUPS_DB_FILE_PATH, 'utf-8');
      if (fileContent.trim() === "") {
        fs.writeFileSync(GROUPS_DB_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
        return [];
      }
      const data = JSON.parse(fileContent);
      return (Array.isArray(data) ? data : []).map((group: any) => ({
        ...group,
        createdAt: new Date(group.createdAt),
        announcements: (group.announcements || []).map((anc: any) => ({
            ...anc,
            timestamp: new Date(anc.timestamp)
        })),
      }));
    }
  } catch (error) {
    console.error('[API-GROUPS-DB] Error reading or parsing DB file:', error);
  }
  fs.writeFileSync(GROUPS_DB_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
  return [];
}

function writeGroupsDb(data: Group[]): boolean {
  try {
    // Sort groups by creation date, newest first, before writing
    const sortedData = data.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    fs.writeFileSync(GROUPS_DB_FILE_PATH, JSON.stringify(sortedData, null, 2), 'utf-8');
    console.log(`[API-GROUPS-DB] Group data successfully written. Total groups: ${data.length}`);
    return true;
  } catch (error) {
    console.error('[API-GROUPS-DB] Error writing to DB file:', error);
    return false;
  }
}

function generateGroupCode(length: number = 6): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const allGroups = readGroupsDb();
      const { teacherId, groupId } = req.query;
      if (groupId && typeof groupId === 'string') {
        const group = allGroups.find(g => g.id === groupId);
        return group ? res.status(200).json(group) : res.status(404).json({ error: 'Group not found' });
      }
      if (teacherId && typeof teacherId === 'string') {
        const teacherGroups = allGroups.filter(group => group.teacherId === teacherId);
        return res.status(200).json(teacherGroups);
      }
      return res.status(200).json(allGroups);
    } catch (error) {
      console.error('[API-GROUPS-DB] Failed to read data on GET:', error);
      res.status(500).json({ error: 'Failed to read groups data' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, teacherId } = req.body;
      if (!name || !teacherId) {
        return res.status(400).json({ error: 'Group name and teacherId are required.' });
      }

      const allGroups = readGroupsDb();
      let newGroupCode = generateGroupCode();
      while (allGroups.some(group => group.groupCode === newGroupCode)) {
        newGroupCode = generateGroupCode();
      }
      
      const newGroup: Group = {
        id: `group-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name,
        teacherId,
        groupCode: newGroupCode,
        studentIdentifiers: [],
        createdAt: new Date(),
        announcements: [],
        groupImageUrl: '', // Initialize with empty string
      };

      allGroups.push(newGroup);
      const success = writeGroupsDb(allGroups); // writeGroupsDb now handles sorting

      if (success) {
        res.status(201).json({ message: 'Group created successfully', group: newGroup });
      } else {
        res.status(500).json({ error: 'Failed to write group to database' });
      }
    } catch (error) {
      console.error('[API-GROUPS-DB] Failed to process POST request:', error);
      res.status(500).json({ error: 'Internal server error while creating group' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { groupId } = req.query;
      if (!groupId || typeof groupId !== 'string') {
        return res.status(400).json({ error: 'groupId is required for deletion.' });
      }
      const allGroups = readGroupsDb();
      const initialLength = allGroups.length;
      const filteredGroups = allGroups.filter(group => group.id !== groupId);

      if (filteredGroups.length === initialLength) {
        return res.status(404).json({ error: `Group with ID ${groupId} not found.`});
      }

      const success = writeGroupsDb(filteredGroups);
      if (success) {
        res.status(200).json({ message: `Group ${groupId} deleted successfully.`});
      } else {
        res.status(500).json({ error: 'Failed to update database after deleting group.'});
      }
    } catch (error) {
      console.error('[API-GROUPS-DB] Failed to process DELETE request:', error);
      res.status(500).json({ error: 'Internal server error while deleting group.'});
    }
  } else if (req.method === 'PUT') {
    try {
      const { groupId } = req.query;
      const { studentIdentifiers, announcementContent, senderId, senderName, groupImageUrl } = req.body;

      if (!groupId || typeof groupId !== 'string') {
        return res.status(400).json({ error: 'groupId is required for updating.' });
      }

      const allGroups = readGroupsDb();
      const groupIndex = allGroups.findIndex(g => g.id === groupId);

      if (groupIndex === -1) {
        return res.status(404).json({ error: `Group with ID ${groupId} not found.` });
      }
      
      let updatedGroup = { ...allGroups[groupIndex] };

      if (studentIdentifiers !== undefined) {
        if (!Array.isArray(studentIdentifiers) || !studentIdentifiers.every(id => typeof id === 'string')) {
          return res.status(400).json({ error: 'studentIdentifiers must be an array of strings.' });
        }
        updatedGroup.studentIdentifiers = studentIdentifiers;
      }

      if (announcementContent && senderId && senderName) {
        const newAnnouncement: GroupAnnouncement = {
          id: `anc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          senderId,
          senderName,
          content: announcementContent,
          timestamp: new Date(),
        };
        updatedGroup.announcements = [...(updatedGroup.announcements || []), newAnnouncement];
      }
      
      if (groupImageUrl !== undefined) { // Allows setting to empty string to remove image
         updatedGroup.groupImageUrl = groupImageUrl;
      }


      allGroups[groupIndex] = updatedGroup;

      const success = writeGroupsDb(allGroups);
      if (success) {
        res.status(200).json({ message: `Group ${groupId} updated successfully.`, group: allGroups[groupIndex] });
      } else {
        res.status(500).json({ error: 'Failed to update database after modifying group.' });
      }
    } catch (error) {
      console.error('[API-GROUPS-DB] Failed to process PUT request:', error);
      res.status(500).json({ error: 'Internal server error while updating group.' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
