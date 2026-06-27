import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
};

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
}

const STORAGE_KEY = "voyagr_auth_user";
const REGISTRY_KEY = "voyagr_registry";

const AVATAR_COLORS = [
  "from-blue-400 to-cyan-500",
  "from-teal-400 to-emerald-500",
  "from-sky-400 to-blue-500",
  "from-emerald-400 to-teal-500",
  "from-cyan-400 to-sky-500",
  "from-indigo-400 to-blue-500",
];

function randomColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function getRegistry(): Record<string, { name: string; password: string; avatarColor: string }> {
  try {
    return JSON.parse(localStorage.getItem(REGISTRY_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveRegistry(r: Record<string, { name: string; password: string; avatarColor: string }>) {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(r));
}

// ── Thunks ──────────────────────────────────────────────────────────────────

export const rehydrateAuth = createAsyncThunk("auth/rehydrate", async () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return null;
});

export const loginThunk = createAsyncThunk(
  "auth/login",
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    await new Promise((r) => setTimeout(r, 700));
    const registry = getRegistry();
    const key = email.toLowerCase().trim();
    const entry = registry[key];
    if (!entry || entry.password !== password) {
      return rejectWithValue("Invalid email or password.");
    }
    const user: AuthUser = {
      id: btoa(key),
      name: entry.name,
      email: key,
      avatarColor: entry.avatarColor,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  },
);

export const signupThunk = createAsyncThunk(
  "auth/signup",
  async (
    { name, email, password }: { name: string; email: string; password: string },
    { rejectWithValue },
  ) => {
    await new Promise((r) => setTimeout(r, 700));
    const key = email.toLowerCase().trim();
    const registry = getRegistry();
    if (registry[key]) {
      return rejectWithValue("An account with this email already exists.");
    }
    const avatarColor = randomColor();
    registry[key] = { name: name.trim(), password, avatarColor };
    saveRegistry(registry);
    const user: AuthUser = { id: btoa(key), name: name.trim(), email: key, avatarColor };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  },
);

// ── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState: {
    status: "loading",
    user: null,
    error: null,
  } as AuthState,
  reducers: {
    logout(state) {
      localStorage.removeItem(STORAGE_KEY);
      state.status = "unauthenticated";
      state.user = null;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Rehydrate
    builder
      .addCase(rehydrateAuth.fulfilled, (state, action: PayloadAction<AuthUser | null>) => {
        if (action.payload) {
          state.status = "authenticated";
          state.user = action.payload;
        } else {
          state.status = "unauthenticated";
        }
      })
      .addCase(rehydrateAuth.rejected, (state) => {
        state.status = "unauthenticated";
      });

    // Login
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action: PayloadAction<AuthUser>) => {
        state.status = "authenticated";
        state.user = action.payload;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = "unauthenticated";
        state.error = action.payload as string;
      });

    // Signup
    builder
      .addCase(signupThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(signupThunk.fulfilled, (state, action: PayloadAction<AuthUser>) => {
        state.status = "authenticated";
        state.user = action.payload;
      })
      .addCase(signupThunk.rejected, (state, action) => {
        state.status = "unauthenticated";
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;

// ── Selectors ────────────────────────────────────────────────────────────────
import type { RootState } from "./index";

export const selectAuthStatus = (s: RootState) => s.auth.status;
export const selectAuthUser = (s: RootState) => s.auth.user;
export const selectIsAuthenticated = (s: RootState) => s.auth.status === "authenticated";
export const selectAuthError = (s: RootState) => s.auth.error;
