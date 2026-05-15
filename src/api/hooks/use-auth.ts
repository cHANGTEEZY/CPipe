import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, type LoginPayload } from "../auth";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/get-error-message";

export const authKeys = {
  all: ["auth"] as const,
  me: ["auth", "me"] as const,
};

export function useMe(enabled = true) {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => authApi.me(),
    staleTime: 60 * 60 * 1_000, // 1 hour
    enabled,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authKeys.me });
      toast.success("Logged in successfully");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
      console.log("Logging in");
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      qc.clear();
      toast.success("Logged out successfully");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
      console.log("Logging out");
    },
  });
}
