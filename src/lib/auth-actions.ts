
// For now, these are conceptual server actions.
// In a real app, you'd integrate with Firebase Auth or another auth provider.

"use server";

import type { User } from "@/lib/types";

// Mock user data - in a real app, this would be a database.
const mockUsers: User[] = [
  { id: "teacher1", email: "teacher@example.com", role: "teacher" },
];

interface AuthResult {
  success: boolean;
  message: string;
  user?: User;
}

export async function loginUser(formData: FormData): Promise<AuthResult> {
  const emailInput = formData.get("email") as string;
  const passwordInput = formData.get("password") as string; // Password check is omitted for mock

  console.log(`[LOGIN ATTEMPT] Received email: "${emailInput}", password: "${passwordInput ? '******' : 'EMPTY'}"`);
  console.log("[LOGIN ATTEMPT] Current mockUsers before find:", JSON.stringify(mockUsers, null, 2));


  if (!emailInput) {
      return { success: false, message: "Email is required." };
  }
  const normalizedEmailInput = emailInput.toLowerCase().trim();
  console.log(`[LOGIN ATTEMPT] Normalized email for search: "${normalizedEmailInput}"`);

  const user = mockUsers.find((u) => u.email.toLowerCase() === normalizedEmailInput);

  if (user) {
    // In a real app, verify password here
    console.log(`[LOGIN SUCCESS] User found:`, JSON.stringify(user, null, 2));
    return { success: true, message: "Login successful", user };
  } else {
    console.log(`[LOGIN FAILED] User with normalized email "${normalizedEmailInput}" not found in mockUsers.`);
    return { success: false, message: "Invalid email or password" };
  }
}

export async function signupUser(formData: FormData): Promise<AuthResult> {
  const emailInput = formData.get("email") as string;
  const passwordInput = formData.get("password") as string; // Password handling omitted for mock

  console.log(`[SIGNUP ATTEMPT] Received email: "${emailInput}", password: "${passwordInput ? '******' : 'EMPTY'}"`);
  console.log("[SIGNUP ATTEMPT] Current mockUsers before signup:", JSON.stringify(mockUsers, null, 2));


  if (!emailInput) {
    return { success: false, message: "Email is required." };
  }
  const normalizedEmailInput = emailInput.toLowerCase().trim();
  console.log(`[SIGNUP ATTEMPT] Normalized email for new user: "${normalizedEmailInput}"`);


  if (mockUsers.find((u) => u.email.toLowerCase() === normalizedEmailInput)) {
    console.log(`[SIGNUP FAILED] User already exists with normalized email: "${normalizedEmailInput}"`);
    return { success: false, message: "User already exists with this email" };
  }

  const newUser: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    email: normalizedEmailInput, // Store normalized email
    role: "teacher", // Defaulting to teacher for signup
  };
  mockUsers.push(newUser);
  console.log(`[SIGNUP SUCCESS] New user added:`, JSON.stringify(newUser, null, 2));
  console.log("[SIGNUP SUCCESS] Mock users after signup:", JSON.stringify(mockUsers, null, 2));
  return { success: true, message: "Signup successful", user: newUser };
}

// For client-side state management of auth, you'd typically use cookies or localStorage
// and a Context provider. These server actions are for processing forms.
// A real logout would clear session/cookies.
export async function logoutUser(): Promise<{ success: boolean }> {
  // Simulate logout
  console.log("[LOGOUT ATTEMPT] User logged out.");
  return { success: true };
}
