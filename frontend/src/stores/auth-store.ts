import { create } from "zustand";
import type { User, LoginRequest, RegisterRequest } from "@/types/auth";
import { authApi } from "@/services/auth-api";

interface AuthState {
  token: string | null;
  user: User | null;
  isInitialized: boolean;

  authModalOpen: boolean;
  authModalTab: "login" | "register";
  authModalMessage: string | null;
  pendingAction: (() => void) | null;
}

interface AuthActions {
  initialize: () => void;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  openAuthModal: (
    tab?: "login" | "register",
    message?: string | null,
    pendingAction?: (() => void) | null,
  ) => void;
  closeAuthModal: () => void;
  clearAuth: () => void;
}

const TOKEN_KEY = "nextstep_token";
const USER_KEY = "nextstep_user";

function saveToStorage(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  token: null,
  user: null,
  isInitialized: false,

  authModalOpen: false,
  authModalTab: "register",
  authModalMessage: null,
  pendingAction: null,

  initialize: () => {
    if (typeof window === "undefined") {
      set({ isInitialized: true });
      return;
    }
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);
    let user: User | null = null;
    if (userJson) {
      try {
        user = JSON.parse(userJson);
      } catch {
        clearStorage();
      }
    }
    set({ token, user, isInitialized: true });
  },

  login: async (data) => {
    const res = await authApi.login(data);
    saveToStorage(res.access_token, res.user);
    const pending = get().pendingAction;
    set({
      token: res.access_token,
      user: res.user,
      authModalOpen: false,
      authModalMessage: null,
      pendingAction: null,
    });
    pending?.();
  },

  register: async (data) => {
    const res = await authApi.register(data);
    saveToStorage(res.access_token, res.user);
    const pending = get().pendingAction;
    set({
      token: res.access_token,
      user: res.user,
      authModalOpen: false,
      authModalMessage: null,
      pendingAction: null,
    });
    pending?.();
  },

  logout: () => {
    clearStorage();
    authApi.logout().catch(() => {});
    set({ token: null, user: null });
  },

  openAuthModal: (tab = "register", message = null, pendingAction = null) => {
    set({ authModalOpen: true, authModalTab: tab, authModalMessage: message, pendingAction });
  },

  closeAuthModal: () => {
    set({ authModalOpen: false, authModalMessage: null, pendingAction: null });
  },

  clearAuth: () => {
    clearStorage();
    set({ token: null, user: null });
  },
}));
