
"use server";

import type { User } from "@/lib/types";
import fs from 'fs';
import path from 'path';

const MOCK_USERS_DB_FILE_PATH = path.join(process.cwd(), 'mock_users.json');

// Helper to ensure user object integrity from DB or other sources
function ensureUserIntegrity(user: Partial<User>): User {
  let { id, displayName, email, dob, role, profileImageUrl, signupIp, signupTimestamp } = user;

  id = id || `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`; // Ensure ID for new users

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
  
  // Ensure displayName is a string before calling trim()
  displayName = String(displayName).trim();


  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    dob = "1900-01-01"; // Default DOB if invalid or missing
  }
  
  role = role || "student"; // Default role for new signups
  if (role !== "teacher" && role !== "student") {
      role = "student"; // Enforce valid role
  }

  return {
    id,
    displayName,
    email: email || undefined, // Email remains optional
    dob,
    role,
    profileImageUrl: profileImageUrl || undefined,
    signupIp: signupIp || undefined,
    signupTimestamp: signupTimestamp || undefined,
  };
}


function readUsersDb(): User[] {
  try {
    if (fs.existsSync(MOCK_USERS_DB_FILE_PATH)) {
      const fileContent = fs.readFileSync(MOCK_USERS_DB_FILE_PATH, 'utf-8');
      if (fileContent.trim() === "") {
        writeUsersDb([]); // Initialize if empty
        return [];
      }
      const data: Partial<User>[] = JSON.parse(fileContent);
      if (!Array.isArray(data)) {
        console.error('[AUTH-DB] DB data is not an array. Reinitializing.');
        writeUsersDb([]);
        return [];
      }
      return data.map(ensureUserIntegrity); // Ensure all users from DB are well-formed
    }
  } catch (error) {
    console.error('[AUTH-DB] Error reading or parsing users DB file:', error);
  }
  // If file doesn't exist or error, initialize with empty array
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
    (u) => u.displayName.toLowerCase() === name.trim().toLowerCase() && u.dob === dob
  );

  if (user) {
    console.log(`[AuthAction] User found for Name/DOB sign-in:`, JSON.stringify(user, null, 2));
    return { success: true, message: "Login successful", user: ensureUserIntegrity(user) };
  } else {
    console.log(`[AuthAction] User not found for Name: "${name}", DOB: "${dob}"`);
    return { success: false, message: "Invalid name or date of birth. Please check your details or sign up." };
  }
}

export async function signUpWithNameAndDob(name: string, dob: string, role: 'student' | 'teacher', ipAddress: string): Promise<AuthResult> {
  console.log(`[AuthAction] signUpWithNameAndDob attempt for Name: "${name}", DOB: "${dob}", Role: "${role}", IP: ${ipAddress}`);
  const currentUsers = readUsersDb();

  // IP-based rate limiting
  const signupsFromIp = currentUsers.filter(u => u.signupIp === ipAddress);

  if (signupsFromIp.length >= 2) {
    console.log(`[AuthAction] Signup blocked for IP ${ipAddress} because it has already created ${signupsFromIp.length} accounts.`);
    return { success: false, message: "A maximum of 2 accounts can be created from this network to prevent abuse. Please contact support if you need more." };
  }


  const trimmedName = name.trim();
  const nameLower = trimmedName.toLowerCase();

  const existingUserByNameAndDob = currentUsers.find(
    (u) => u.displayName.toLowerCase() === nameLower && u.dob === dob
  );

  if (existingUserByNameAndDob) {
    console.log(`[AuthAction] User already exists (Name+DOB match) during sign-up:`, JSON.stringify(existingUserByNameAndDob, null, 2));
    return { success: false, message: "An account with this name and date of birth already exists. Please try logging in." };
  }

  const existingUserByNameOnly = currentUsers.find(
    (u) => u.displayName.toLowerCase() === nameLower
  );

  if (existingUserByNameOnly) {
    console.log(`[AuthAction] User name already taken (Name match only) during sign-up: ${trimmedName}`);
    return { success: false, message: `The name "${trimmedName}" is already taken. Please choose a unique name.` };
  }


  const newUserPartial: Partial<User> = {
    displayName: trimmedName,
    dob: dob,
    role: role, 
    signupIp: ipAddress,
    signupTimestamp: new Date().toISOString()
  };
  const newUser = ensureUserIntegrity(newUserPartial); 

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

export async function updateUserProfile(
  userId: string,
  updates: { displayName?: string; dob?: string; profileImageUrl?: string }
): Promise<AuthResult> {
  console.log(`[AuthAction] updateUserProfile attempt for UserID: "${userId}" with updates:`, JSON.stringify(updates));
  const currentUsers = readUsersDb();
  const userIndex = currentUsers.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    console.log(`[AuthAction] User not found for update: UserID "${userId}"`);
    return { success: false, message: "User not found." };
  }
  
  const userToUpdate = currentUsers[userIndex];
  const currentNameLower = userToUpdate.displayName.toLowerCase();
  
  // Validate updates before applying
  if (updates.displayName && updates.displayName.trim().length < 1) {
    return { success: false, message: "Display name cannot be empty." };
  }

  // Check for display name uniqueness if it's being changed
  if (updates.displayName && updates.displayName.trim().toLowerCase() !== currentNameLower) {
    const newNameLower = updates.displayName.trim().toLowerCase();
    const nameConflict = currentUsers.find(u => u.id !== userId && u.displayName.toLowerCase() === newNameLower);
    if (nameConflict) {
      console.log(`[AuthAction] Update failed: New display name "${updates.displayName.trim()}" is already taken.`);
      return { success: false, message: `The name "${updates.displayName.trim()}" is already taken. Please choose a unique name.` };
    }
  }

  if (updates.dob && !/^\d{4}-\d{2}-\d{2}$/.test(updates.dob)) {
    return { success: false, message: "Invalid Date of Birth format. Use YYYY-MM-DD." };
  }
  
  if (updates.profileImageUrl && !updates.profileImageUrl.startsWith('data:image/')) {
    console.warn("[AuthAction] profileImageUrl does not appear to be a data URI, but will be saved as is for mock purposes:", updates.profileImageUrl.substring(0,30) + "...");
  }


  // Create the updated user object, applying updates or keeping existing values
  const updatedUserObject: User = {
    ...userToUpdate,
    displayName: updates.displayName !== undefined ? updates.displayName.trim() : userToUpdate.displayName,
    dob: updates.dob !== undefined ? updates.dob : userToUpdate.dob,
    profileImageUrl: updates.profileImageUrl !== undefined ? updates.profileImageUrl : userToUpdate.profileImageUrl,
  };
  
  const finalUpdatedUser = ensureUserIntegrity(updatedUserObject);

  currentUsers[userIndex] = finalUpdatedUser;
  const successWrite = writeUsersDb(currentUsers);

  if (successWrite) {
    console.log(`[AuthAction] User profile updated in DB:`, JSON.stringify(finalUpdatedUser, null, 2));
    return { success: true, message: "Profile updated successfully.", user: finalUpdatedUser };
  } else {
    console.log(`[AuthAction] Failed to write updated user profile to DB.`);
    return { success: false, message: "Failed to update profile due to a server error." };
  }
}
