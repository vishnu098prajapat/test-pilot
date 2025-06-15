
"use server";

import type { User } from "@/lib/types";
import fs from 'fs';
import path from 'path';

const MOCK_USERS_DB_FILE_PATH = path.join(process.cwd(), 'mock_users.json');

// Helper to ensure user object integrity from DB or other sources
function ensureUserIntegrity(user: Partial<User>): User {
  let { id, displayName, email, dob, role } = user;

  id = id || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  if (!displayName) {
    if (email) {
      const namePart = email.split('@')[0];
      displayName = namePart
        .replace(/[._-]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } else {
      displayName = `User-${id.substring(0, 5)}`;
    }
  }

  // Ensure DOB is a valid date string or default
  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    // A simple check, could be more robust if needed for date validity
    dob = "1900-01-01"; // Default DOB if missing or invalid format
  }
  
  role = role || "student"; // Default role if missing
  if (role !== "teacher" && role !== "student") {
      role = "student"; // Force to a valid role
  }


  return {
    id,
    displayName,
    email: email || undefined, 
    dob,
    role,
  };
}


function readUsersDb(): User[] {
  try {
    if (fs.existsSync(MOCK_USERS_DB_FILE_PATH)) {
      const fileContent = fs.readFileSync(MOCK_USERS_DB_FILE_PATH, 'utf-8');
      if (fileContent.trim() === "") {
        writeUsersDb([]);
        return [];
      }
      const data: Partial<User>[] = JSON.parse(fileContent);
      if (!Array.isArray(data)) {
        console.error('[AUTH-DB] DB data is not an array. Reinitializing.');
        writeUsersDb([]);
        return [];
      }
      return data.map(ensureUserIntegrity);
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
  console.log(`[AuthAction] signInWithNameAndDob attempt for Name: "${name}", DOB: "${dob}"`);
  const currentUsers = readUsersDb();
  const user = currentUsers.find(
    (u) => u.displayName.toLowerCase() === name.toLowerCase() && u.dob === dob
  );

  if (user) {
    console.log(`[AuthAction] User found for Name/DOB sign-in:`, JSON.stringify(user, null, 2));
    return { success: true, message: "Login successful", user: ensureUserIntegrity(user) }; // Ensure integrity on return
  } else {
    console.log(`[AuthAction] User not found for Name: "${name}", DOB: "${dob}"`);
    return { success: false, message: "Invalid name or date of birth. Please check your details or sign up." };
  }
}

export async function signUpWithNameAndDob(name: string, dob: string): Promise<AuthResult> {
  console.log(`[AuthAction] signUpWithNameAndDob attempt for Name: "${name}", DOB: "${dob}"`);
  const currentUsers = readUsersDb();
  const existingUser = currentUsers.find(
    (u) => u.displayName.toLowerCase() === name.toLowerCase() && u.dob === dob
  );

  if (existingUser) {
    console.log(`[AuthAction] User already exists during Name/DOB sign-up:`, JSON.stringify(existingUser, null, 2));
    return { success: false, message: "An account with this name and date of birth already exists. Please try logging in." };
  }

  const newUserPartial: Partial<User> = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    displayName: name,
    dob: dob,
    role: "teacher", // Default new signups to teacher
  };
  const newUser = ensureUserIntegrity(newUserPartial); // Ensure full integrity

  const updatedUsers = [...currentUsers, newUser];
  const successWrite = writeUsersDb(updatedUsers);

  if (successWrite) {
    console.log(`[AuthAction] New user added to DB via Name/DOB sign-up:`, JSON.stringify(newUser, null, 2));
    return { success: true, message: "Account created successfully. Welcome!", user: newUser };
  } else {
    console.log(`[AuthAction] Failed to write new user to DB during Name/DOB sign-up.`);
    return { success: false, message: "Failed to create account due to a server error. Please try again." };
  }
}
