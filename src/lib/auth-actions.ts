
"use server";

import type { User } from "@/lib/types";
import fs from 'fs';
import path from 'path';

const MOCK_USERS_DB_FILE_PATH = path.join(process.cwd(), 'mock_users.json');
const PREDEFINED_GOOGLE_USER_EMAIL = "google.user@testpilot.com";
const PREDEFINED_GOOGLE_USER_ID = "google-testpilot-user-001";

function generateDisplayNameFromEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const namePart = email.split('@')[0];
  return namePart
    .replace(/[._-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function readUsersDb(): User[] {
  try {
    if (fs.existsSync(MOCK_USERS_DB_FILE_PATH)) {
      const fileContent = fs.readFileSync(MOCK_USERS_DB_FILE_PATH, 'utf-8');
      if (fileContent.trim() === "") {
        console.warn('[AUTH-DB] DB file is empty. Initializing empty.');
        writeUsersDb([]); // Initialize with an empty array if file is empty
        return [];
      }
      const data = JSON.parse(fileContent);
      if (!Array.isArray(data)) {
        console.warn('[AUTH-DB] DB file content is not an array. Initializing empty.');
        writeUsersDb([]);
        return [];
      }
      return data.map(user => ({
        ...user,
        displayName: user.displayName || generateDisplayNameFromEmail(user.email)
      }));
    }
  } catch (error) {
    console.error('[AUTH-DB] Error reading or parsing users DB file:', error);
  }
  console.log('[AUTH-DB] Users DB file not found or error. Initializing empty and creating file.');
  writeUsersDb([]);
  return [];
}

function writeUsersDb(data: User[]): boolean {
  try {
    fs.writeFileSync(MOCK_USERS_DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[AUTH-DB] User data successfully written to ${MOCK_USERS_DB_FILE_PATH}. Total users: ${data.length}`);
    return true;
  } catch (error) {
    console.error('[AUTH-DB] Error writing to users DB file:', error);
    return false;
  }
}

interface AuthResult {
  success: boolean;
  message: string;
  user?: User;
}

export async function signInWithGoogleAction(): Promise<AuthResult> {
  const currentUsers = readUsersDb();
  let user = currentUsers.find((u) => u.email.toLowerCase() === PREDEFINED_GOOGLE_USER_EMAIL.toLowerCase());

  if (user) {
    user.displayName = user.displayName || generateDisplayNameFromEmail(user.email);
    console.log(`[Google Sign-In] Existing user found:`, JSON.stringify(user, null, 2));
    return { success: true, message: "Login successful", user };
  } else {
    console.log(`[Google Sign-In] User not found. Creating new user: ${PREDEFINED_GOOGLE_USER_EMAIL}`);
    const newUser: User = {
      id: PREDEFINED_GOOGLE_USER_ID,
      email: PREDEFINED_GOOGLE_USER_EMAIL,
      displayName: generateDisplayNameFromEmail(PREDEFINED_GOOGLE_USER_EMAIL),
      role: "teacher",
    };
    
    const updatedUsers = [...currentUsers, newUser];
    const successWrite = writeUsersDb(updatedUsers);

    if (successWrite) {
      console.log(`[Google Sign-In] New user added to DB:`, JSON.stringify(newUser, null, 2));
      return { success: true, message: "Account created and login successful", user: newUser };
    } else {
      console.log(`[Google Sign-In] Failed to write new user to DB.`);
      return { success: false, message: "Failed to create user account due to a server error." };
    }
  }
}

export async function logoutUser(): Promise<{ success: boolean }> {
  console.log("[LOGOUT ATTEMPT] User logged out.");
  // In a real app, this would clear server-side session if any.
  // For this mock, client-side localStorage removal is the main part.
  return { success: true };
}
