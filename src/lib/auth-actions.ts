
"use server";

import type { User } from "@/lib/types";
import fs from 'fs';
import path from 'path';

const MOCK_USERS_DB_FILE_PATH = path.join(process.cwd(), 'mock_users.json');

function readUsersDb(): User[] {
  try {
    if (fs.existsSync(MOCK_USERS_DB_FILE_PATH)) {
      const fileContent = fs.readFileSync(MOCK_USERS_DB_FILE_PATH, 'utf-8');
      if (fileContent.trim() === "") {
        writeUsersDb([]);
        return [];
      }
      const data = JSON.parse(fileContent);
      if (!Array.isArray(data)) {
        writeUsersDb([]);
        return [];
      }
      return data.map(user => ({
        ...user,
        displayName: user.displayName || `User-${user.id.substring(0,5)}`, // Fallback display name
        dob: user.dob || "1900-01-01" // Fallback DOB
      }));
    }
  } catch (error) {
    console.error('[AUTH-DB] Error reading or parsing users DB file:', error);
  }
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

export async function signInWithNameAndDob(name: string, dob: string): Promise<AuthResult> {
  const currentUsers = readUsersDb();
  const user = currentUsers.find(
    (u) => u.displayName.toLowerCase() === name.toLowerCase() && u.dob === dob
  );

  if (user) {
    console.log(`[Name/DOB Sign-In] User found:`, JSON.stringify(user, null, 2));
    return { success: true, message: "Login successful", user };
  } else {
    console.log(`[Name/DOB Sign-In] User not found for Name: ${name}, DOB: ${dob}`);
    return { success: false, message: "Invalid name or date of birth." };
  }
}

export async function signUpWithNameAndDob(name: string, dob: string): Promise<AuthResult> {
  const currentUsers = readUsersDb();
  const existingUser = currentUsers.find(
    (u) => u.displayName.toLowerCase() === name.toLowerCase() && u.dob === dob
  );

  if (existingUser) {
    console.log(`[Name/DOB Sign-Up] User already exists:`, JSON.stringify(existingUser, null, 2));
    return { success: false, message: "An account with this name and date of birth already exists. Please try logging in." };
  }

  const newUser: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    displayName: name,
    dob: dob,
    role: "teacher", // Default role for new sign-ups
    // email can be omitted or set to a placeholder if needed later
  };

  const updatedUsers = [...currentUsers, newUser];
  const successWrite = writeUsersDb(updatedUsers);

  if (successWrite) {
    console.log(`[Name/DOB Sign-Up] New user added to DB:`, JSON.stringify(newUser, null, 2));
    return { success: true, message: "Account created successfully. Welcome!", user: newUser };
  } else {
    console.log(`[Name/DOB Sign-Up] Failed to write new user to DB.`);
    return { success: false, message: "Failed to create account due to a server error." };
  }
}

export async function logoutUser(): Promise<{ success: boolean }> {
  console.log("[LOGOUT ATTEMPT] User logged out (simulated).");
  return { success: true };
}
