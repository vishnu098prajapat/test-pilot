
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
  // const password = formData.get("password") as string; // Password check is omitted for mock

  if (!emailInput) {
      return { success: false, message: "Email is required." };
  }
  const normalizedEmailInput = emailInput.toLowerCase().trim();

  // Ensure comparison is also case-insensitive for emails already in mockUsers
  const user = mockUsers.find((u) => u.email.toLowerCase() === normalizedEmailInput);

  if (user) {
    // In a real app, verify password here
    return { success: true, message: "Login successful", user };
  } else {
    return { success: false, message: "Invalid email or password" };
  }
}

export async function signupUser(formData: FormData): Promise<AuthResult> {
  const emailInput = formData.get("email") as string;
  // const password = formData.get("password") as string; // Password handling omitted for mock

  if (!emailInput) {
    return { success: false, message: "Email is required." };
  }
  const normalizedEmailInput = emailInput.toLowerCase().trim();


  if (mockUsers.find((u) => u.email.toLowerCase() === normalizedEmailInput)) {
    return { success: false, message: "User already exists with this email" };
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    email: normalizedEmailInput, // Store normalized email
    role: "teacher", // Defaulting to teacher for signup
  };
  mockUsers.push(newUser);
  console.log("Mock users after signup:", mockUsers); // For debugging
  return { success: true, message: "Signup successful", user: newUser };
}

// For client-side state management of auth, you'd typically use cookies or localStorage
// and a Context provider. These server actions are for processing forms.
// A real logout would clear session/cookies.
export async function logoutUser(): Promise<{ success: boolean }> {
  // Simulate logout
  return { success: true };
}

