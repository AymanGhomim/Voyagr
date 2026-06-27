/**
 * auth.tsx — thin hook layer over Redux auth slice.
 * Components import from here exactly as before; the slice handles all state.
 */
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  loginThunk,
  signupThunk,
  logout as logoutAction,
  selectAuthStatus,
  selectAuthUser,
  selectIsAuthenticated,
  selectAuthError,
} from "@/store/authSlice";

export type { AuthUser } from "@/store/authSlice";

export function useAuth() {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);
  const user = useAppSelector(selectAuthUser);

  const login = async (email: string, password: string) => {
    const result = await dispatch(loginThunk({ email, password }));
    if (loginThunk.rejected.match(result)) {
      throw new Error(result.payload as string);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    const result = await dispatch(signupThunk({ name, email, password }));
    if (signupThunk.rejected.match(result)) {
      throw new Error(result.payload as string);
    }
  };

  const logout = () => dispatch(logoutAction());

  return { state: { status, user }, login, signup, logout };
}

export function useAuthUser() {
  return useAppSelector(selectAuthUser);
}

export function useIsAuthenticated() {
  return useAppSelector(selectIsAuthenticated);
}

export function useAuthError() {
  return useAppSelector(selectAuthError);
}
