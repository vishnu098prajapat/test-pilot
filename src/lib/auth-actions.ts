
// For now, these are conceptual server actions.
// In a real app, you'd integrate with Firebase Auth or another auth provider.

"use server";

import type { User } from "@/lib/types";
import fs from 'fs';
import path from 'path';

const MOCK_USERS_DB_FILE_PATH = path.join(process.cwd(), 'mock_users.json');

const initialMockUser: User = { 
  id: "teacher1", 
  email: "teacher@example.com", 
  displayName: "Teacher Example", 
  role: "teacher" 
};

function readUsersDb(): User[] {
  try {
    if (fs.existsSync(MOCK_USERS_DB_FILE_PATH)) {
      const fileContent = fs.readFileSync(MOCK_USERS_DB_FILE_PATH, 'utf-8');
      if (fileContent.trim() === "") {
        writeUsersDb([initialMockUser]);
        return [initialMockUser];
      }
      const data = JSON.parse(fileContent);
      if (!Array.isArray(data) || data.length === 0) {
        // If data is not an array or is empty, re-initialize
        console.warn('[AUTH-DB] DB file content is invalid or empty. Re-initializing with default user.');
        writeUsersDb([initialMockUser]);
        return [initialMockUser];
      }
      return data.map(user => ({
        ...user,
        displayName: user.displayName || generateDisplayNameFromEmail(user.email)
      }));
    }
  } catch (error) {
    console.error('[AUTH-DB] Error reading or parsing users DB file:', error);
  }
  console.log('[AUTH-DB] Users DB file not found or error. Initializing with default user and creating file.');
  writeUsersDb([initialMockUser]);
  return [initialMockUser];
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

function generateDisplayNameFromEmail(email: string): string {
  if (!email || !email.includes('@')) return email; // Return full email if not valid format
  const namePart = email.split('@')[0];
  // Replace dots or hyphens with spaces and capitalize each word
  return namePart
    .replace(/[._-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}


interface AuthResult {
  success: boolean;
  message: string;
  user?: User;
}

export async function loginUser(formData: FormData): Promise<AuthResult> {
  const emailInput = formData.get("email") as string;
  const passwordInput = formData.get("password") as string; 

  console.log(`[LOGIN ATTEMPT] Received email: "${emailInput}", password: "${passwordInput ? '******' : 'EMPTY'}"`);
  
  if (!emailInput) {
      return { success: false, message: "Email is required." };
  }
  const normalizedEmailInput = emailInput.toLowerCase().trim();
  console.log(`[LOGIN ATTEMPT] Normalized email for search: "${normalizedEmailInput}"`);

  const currentUsers = readUsersDb();
  console.log("[LOGIN ATTEMPT] Current users from DB for find:", JSON.stringify(currentUsers, null, 2));

  const user = currentUsers.find((u) => u.email.toLowerCase() === normalizedEmailInput);

  if (user) {
    const userWithDisplayName = {
      ...user,
      displayName: user.displayName || generateDisplayNameFromEmail(user.email),
    };
    console.log(`[LOGIN SUCCESS] User found:`, JSON.stringify(userWithDisplayName, null, 2));
    return { success: true, message: "Login successful", user: userWithDisplayName };
  } else {
    console.log(`[LOGIN FAILED] User with normalized email "${normalizedEmailInput}" not found in current users DB.`);
    return { success: false, message: "Invalid email or password" };
  }
}

export async function signupUser(formData: FormData): Promise<AuthResult> {
  const emailInput = formData.get("email") as string;
  const passwordInput = formData.get("password") as string; 

  console.log(`[SIGNUP ATTEMPT] Received email: "${emailInput}", password: "${passwordInput ? '******' : 'EMPTY'}"`);

  if (!emailInput) {
    return { success: false, message: "Email is required." };
  }
  const normalizedEmailInput = emailInput.toLowerCase().trim();
  console.log(`[SIGNUP ATTEMPT] Normalized email for new user: "${normalizedEmailInput}"`);

  const currentUsers = readUsersDb();
  console.log("[SIGNUP ATTEMPT] Current users from DB before signup:", JSON.stringify(currentUsers, null, 2));

  if (currentUsers.find((u) => u.email.toLowerCase() === normalizedEmailInput)) {
    console.log(`[SIGNUP FAILED] User already exists with normalized email: "${normalizedEmailInput}"`);
    return { success: false, message: "User already exists with this email" };
  }

  const displayName = generateDisplayNameFromEmail(normalizedEmailInput);
  const newUser: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    email: normalizedEmailInput, 
    displayName: displayName,
    role: "teacher", 
  };
  
  const updatedUsers = [...currentUsers, newUser];
  const successWrite = writeUsersDb(updatedUsers);

  if (successWrite) {
    console.log(`[SIGNUP SUCCESS] New user added to DB:`, JSON.stringify(newUser, null, 2));
    return { success: true, message: "Signup successful", user: newUser };
  } else {
    console.log(`[SIGNUP FAILED] Could not write new user to DB.`);
    return { success: false, message: "Failed to create user account due to a server error." };
  }
}

export async function logoutUser(): Promise<{ success: boolean }> {
  console.log("[LOGOUT ATTEMPT] User logged out.");
  return { success: true };
}
