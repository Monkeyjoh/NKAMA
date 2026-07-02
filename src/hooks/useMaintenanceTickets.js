import { useAsync } from "@/hooks/useAsync";
import { listTickets } from "@/services/maintenanceService";

/** Liste des tickets de maintenance. */
export function useMaintenanceTickets() {
  return useAsync(listTickets, [], []);
}
