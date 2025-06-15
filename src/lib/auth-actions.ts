
"use server";

import type { User } from "@/lib/types";
import fs from 'fs';
import path from 'path';

const MOCK_USERS_DB_FILE_PATH = path.join(process.cwd(), 'mock_users.json');
const PREDEFINED_GOOGLE_USER_EMAIL = "google.user@testpilot.com";
const PREDEFINED_GOOGLE_USER_ID = "google-testpilot-user-001";
const PREDEFINED_GOOGLE_DISPLAY_NAME = "Google User"; // Default display name

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
        writeUsersDb([]); 
        return [];
      }
      const data = JSON.parse(fileContent);
      if (!Array.isArray(data)) {
        console.warn('[AUTH-DB] DB file content is not an array. Initializing empty.');
        writeUsersDb([]);
        return [];
      }
      // Ensure displayName is always present for all users read from DB
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
  let user = currentUsers.find((u) => u.email.toLowerCase() === PREDEFINED_GOOGLE_USER_EMAIL.toLowerCase() && u.id === PREDEFINED_GOOGLE_USER_ID);

  if (user) {
    // Ensure existing user has a displayName
    user.displayName = user.displayName || PREDEFINED_GOOGLE_DISPLAY_NAME || generateDisplayNameFromEmail(user.email);
    console.log(`[Google Sign-In] Existing user found:`, JSON.stringify(user, null, 2));
    // If user exists, update it in the DB to ensure displayName is consistent
    const updatedUsers = currentUsers.map(u => u.id === user!.id ? user : u);
    writeUsersDb(updatedUsers);
    return { success: true, message: "Login successful", user };
  } else {
    console.log(`[Google Sign-In] Predefined Google user not found. Creating/Adding new user: ${PREDEFINED_GOOGLE_USER_EMAIL}`);
    const newUser: User = {
      id: PREDEFINED_GOOGLE_USER_ID,
      email: PREDEFINED_GOOGLE_USER_EMAIL,
      displayName: PREDEFINED_GOOGLE_DISPLAY_NAME || generateDisplayNameFromEmail(PREDEFINED_GOOGLE_USER_EMAIL),
      role: "teacher", // Default role
    };
    
    // Check if a user with this ID already exists, if so, update it, otherwise add.
    const userExistsById = currentUsers.some(u => u.id === newUser.id);
    let updatedUsers;
    if (userExistsById) {
        updatedUsers = currentUsers.map(u => u.id === newUser.id ? newUser : u);
    } else {
        updatedUsers = [...currentUsers, newUser];
    }
    
    const successWrite = writeUsersDb(updatedUsers);

    if (successWrite) {
      console.log(`[Google Sign-In] New/Updated predefined user added/updated in DB:`, JSON.stringify(newUser, null, 2));
      return { success: true, message: "Account processed and login successful", user: newUser };
    } else {
      console.log(`[Google Sign-In] Failed to write new/updated predefined user to DB.`);
      return { success: false, message: "Failed to process user account due to a server error." };
    }
  }
}

// This function remains unchanged but is kept for completeness if needed elsewhere.
export async function logoutUser(): Promise<{ success: boolean }> {
  console.log("[LOGOUT ATTEMPT] User logged out.");
  return { success: true };
}
