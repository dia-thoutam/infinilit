import { create } from "zustand";
import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  confirmSignUp as amplifyConfirmSignUp,
  resendSignUpCode,
  signOut as amplifySignOut,
  deleteUser as amplifyDeleteUser,
  getCurrentUser,
  fetchAuthSession,
} from "aws-amplify/auth";
import { configureAmplify } from "@/lib/amplify";

export type AuthUser = { userId: string; email: string };

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<{ needsConfirmation: boolean }>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  async init() {
    configureAmplify();
    try {
      const u = await getCurrentUser();
      const session = await fetchAuthSession();
      const email =
        (session.tokens?.idToken?.payload?.email as string | undefined) ??
        u.signInDetails?.loginId ??
        u.username;
      set({ user: { userId: u.userId, email }, initialized: true });
    } catch {
      set({ user: null, initialized: true });
    }
  },

  async signIn(email, password) {
    configureAmplify();
    set({ loading: true });
    try {
      try {
        await amplifySignOut();
      } catch {
        // no one was signed in — fine
      }
      await amplifySignIn({ username: email, password });
      const u = await getCurrentUser();
      set({ user: { userId: u.userId, email }, loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  async signUp(email, password, name) {
    configureAmplify();
    set({ loading: true });
    try {
      const res = await amplifySignUp({
        username: email,
        password,
        options: { userAttributes: { email, name } },
      });
      set({ loading: false });
      return { needsConfirmation: !res.isSignUpComplete };
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  async confirmSignUp(email, code) {
    configureAmplify();
    set({ loading: true });
    try {
      await amplifyConfirmSignUp({ username: email, confirmationCode: code });
      set({ loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  async resendCode(email) {
    configureAmplify();
    await resendSignUpCode({ username: email });
  },

  async signOut() {
    configureAmplify();
    await amplifySignOut();
    set({ user: null });
  },

  async deleteAccount() {
    configureAmplify();
    set({ loading: true });
    try {
      await amplifyDeleteUser();
      set({ user: null, loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },
}));