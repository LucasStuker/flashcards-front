export type UserRole = "super_admin" | "admin";

export type AuthUser = {
  _id: string;
  email: string;
  nome: string | null;
  role: UserRole;
  active: boolean;
};

const TOKEN_KEY = "flashcards_token";
const USER_KEY = "flashcards_user";
const USER_EVENT = "yorkstudy:user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUserRaw(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(USER_KEY);
}

export function parseStoredUser(raw: string | null): AuthUser | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function getStoredUser(): AuthUser | null {
  return parseStoredUser(getStoredUserRaw());
}

export function setStoredUser(user: AuthUser) {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(USER_EVENT));
}

export function subscribeStoredUser(onChange: () => void) {
  window.addEventListener(USER_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(USER_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function setSession(token: string, user: AuthUser) {
  window.localStorage.setItem(TOKEN_KEY, token);
  setStoredUser(user);
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(USER_EVENT));
}

export function isLoggedIn() {
  return Boolean(getToken());
}
