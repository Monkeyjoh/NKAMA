import { useAsync } from "@/hooks/useAsync";
import { listUsers } from "@/services/usersService";

/** Liste des utilisateurs (owner/admin). */
export function useUsers() {
  return useAsync(listUsers, [], []);
}
