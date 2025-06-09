
// For now, these are conceptual server actions.
// In a real app, you'd integrate with Firebase Auth or another auth provider.

"use server";

import type { User } from "@/lib/types";
import fs from 'fs';
import path from 'path';

const MOCK_USERS_DB_FILE_PATH = path.join(process.cwd(), 'mock_users.json');

const initialMockUser: User = { id: "teacher1", email: "teacher@example.com", role: "teacher" };

function readUsersDb(): User[] {
  try {
    if (fs.existsSync(MOCK_USERS_DB_FILE_PATH)) {
      const fileContent = fs.readFileSync(MOCK_USERS_DB_FILE_PATH, 'utf-8');
      if (fileContent.trim() === "") {
        // File is empty, initialize with default and write back
        writeUsersDb([initialMockUser]);
        return [initialMockUser];
      }
      const data = JSON.parse(fileContent);
      return Array.isArray(data) ? data : [initialMockUser]; // Fallback if not an array
    }
  } catch (error) {
    console.error('[AUTH-DB] Error reading or parsing users DB file:', error);
    // If error, try to re-initialize with default
  }
  // If file doesn't exist or error during read/parse, initialize with default
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


interface AuthResult {
  success: boolean;
  message: string;
  user?: User;
}

export async function loginUser(formData: FormData): Promise<AuthResult> {
  const emailInput = formData.get("email") as string;
  const passwordInput = formData.get("password") as string; // Password check is omitted for mock

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
    // In a real app, verify password here
    console.log(`[LOGIN SUCCESS] User found:`, JSON.stringify(user, null, 2));
    return { success: true, message: "Login successful", user };
  } else {
    console.log(`[LOGIN FAILED] User with normalized email "${normalizedEmailInput}" not found in current users DB.`);
    return { success: false, message: "Invalid email or password" };
  }
}

export async function signupUser(formData: FormData): Promise<AuthResult> {
  const emailInput = formData.get("email") as string;
  const passwordInput = formData.get("password") as string; // Password handling omitted for mock

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

  const newUser: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    email: normalizedEmailInput, 
    role: "teacher", 
  };
  
  const updatedUsers = [...currentUsers, newUser];
  const success = writeUsersDb(updatedUsers);

  if (success) {
    console.log(`[SIGNUP SUCCESS] New user added to DB:`, JSON.stringify(newUser, null, 2));
    console.log("[SIGNUP SUCCESS] Users DB after signup:", JSON.stringify(updatedUsers, null, 2));
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
