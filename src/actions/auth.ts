"use server";

import {
  loginUser as loginUserLib,
  logoutUser as logoutUserLib,
  getCurrentUser as getCurrentUserLib,
  isLocalhost as isLocalhostLib,
  SessionUser,
  UserRole,
} from "@/lib/auth";

export type { SessionUser, UserRole };

export async function loginUser(username: string, password: string) {
  return loginUserLib(username, password);
}

export async function logoutUser() {
  return logoutUserLib();
}

export async function getCurrentUser() {
  return getCurrentUserLib();
}

export async function isLocalhost() {
  return isLocalhostLib();
}
