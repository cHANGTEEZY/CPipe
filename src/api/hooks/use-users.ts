import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  usersApi,
  type CreateUserPayload,
  type UpdateUserPayload,
  type UserFilters,
} from "../users";
import { getErrorMessage } from "@/utils/get-error-message";

export const userKeys = {
  all: () => ["users"] as const,
  lists: () => [...userKeys.all(), "list"] as const,
  list: (filters?: UserFilters) =>
    [...userKeys.lists(), filters ?? {}] as const,
  detail: (id: string | number) => [...userKeys.all(), "detail", id] as const,
};

export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => usersApi.list(filters),
  });
}

export function useUser(id: string | number | undefined) {
  return useQuery({
    queryKey: userKeys.detail(id!),
    queryFn: () => usersApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.create(payload),
    onSuccess: () => {
      toast.success("User created successfully");
      qc.invalidateQueries({ queryKey: userKeys.lists() });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateUser(id: string | number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateUserPayload) => usersApi.update(id, payload),
    onSuccess: () => {
      toast.success("User updated successfully");
      qc.invalidateQueries({ queryKey: userKeys.detail(id) });
      qc.invalidateQueries({ queryKey: userKeys.lists() });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function usePatchUser(id: string | number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateUserPayload) => usersApi.patch(id, payload),
    onSuccess: () => {
      toast.success("User updated successfully");
      qc.invalidateQueries({ queryKey: userKeys.detail(id) });
      qc.invalidateQueries({ queryKey: userKeys.lists() });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => usersApi.remove(id),
    onSuccess: (_data, id) => {
      toast.success("User deleted successfully");
      qc.removeQueries({ queryKey: userKeys.detail(id) });
      qc.invalidateQueries({ queryKey: userKeys.lists() });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUploadAvatar(id: string | number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress?: (pct: number) => void;
    }) => usersApi.uploadAvatar(id, file, onProgress),
    onSuccess: () => {
      toast.success("Avatar uploaded successfully");
      qc.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
