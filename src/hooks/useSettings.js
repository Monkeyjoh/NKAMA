import { useAsync } from "@/hooks/useAsync";
import { listAppUsers, getOwnerSettings } from "@/services/settingsService";

/** Utilisateurs applicatifs (rôles). */
export function useAppUsers() {
  return useAsync(listAppUsers, [], []);
}

/** Seuils d'anomalie du propriétaire. */
export function useOwnerSettings() {
  return useAsync(getOwnerSettings, [], null);
}
