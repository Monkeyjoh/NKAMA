import { useAsync } from "@/hooks/useAsync";
import { listExpenses } from "@/services/expensesService";

/** Liste des dépenses. */
export function useExpenses() {
  return useAsync(listExpenses, [], []);
}
