"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import {
  authKeys,
  getMe,
  login as loginApi,
  logout as logoutApi,
  persistAuth,
  register as registerApi,
  tokenStorage,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
  Role,
} from "@/api";

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const hasSession = tokenStorage.hasSession();

  const meQuery = useQuery({
    queryKey: authKeys.me(),
    queryFn: getMe,
    enabled: hasSession,
    retry: false,
  });

  useEffect(() => {
    if (meQuery.isError) tokenStorage.clear();
  }, [meQuery.isError]);

  const loginMutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (res) => {
      queryClient.setQueryData(authKeys.me(), persistAuth(res));
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerApi,
    onSuccess: (res) => {
      queryClient.setQueryData(authKeys.me(), persistAuth(res));
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      queryClient.setQueryData(authKeys.me(), null);
      queryClient.clear();
    },
  });

  const ready = !hasSession || !meQuery.isPending;
  const user = (meQuery.data as AuthUser | null | undefined) ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        login: async (payload) => {
          const res = await loginMutation.mutateAsync(payload);
          return res.user;
        },
        register: async (payload) => {
          const res = await registerMutation.mutateAsync(payload);
          return res.user;
        },
        logout: () => logoutMutation.mutateAsync(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useRequireAuth(role?: Role) {
  const auth = useAuth();
  const router = useRouter();
  const allowed = !!auth.user && (!role || auth.user.role === role);

  useEffect(() => {
    if (!auth.ready) return;
    if (!auth.user) router.replace("/login");
    else if (role && auth.user.role !== role) router.replace("/");
  }, [auth.ready, auth.user, role, router]);

  return { ...auth, allowed };
}

export function homePathFor(user: AuthUser) {
  return user.role === Role.Admin ? "/admin/users" : "/";
}
