import { useAsync } from "@/hooks/useAsync";
import { listLeads } from "@/services/leadsService";

/** Liste des prospects (CRM). */
export function useLeads() {
  return useAsync(listLeads, [], []);
}
