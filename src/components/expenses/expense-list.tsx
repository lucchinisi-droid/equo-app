import { Badge } from "@/components/ui/badge";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Expense } from "@/types/database";

export function ExpenseList({ expenses }: { expenses: Expense[] }) {
  if (!expenses.length) {
    return <p className="text-sm text-muted-foreground">Nessuna spesa registrata questo mese.</p>;
  }

  return (
    <div className="space-y-2">
      {expenses.map((e) => {
        const label = EXPENSE_CATEGORIES.find((c) => c.value === e.category)?.label ?? e.category;
        return (
          <div key={e.id} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">
                {e.description || label} <Badge variant="outline" className="ml-2">{label}</Badge>
              </p>
              <p className="text-xs text-muted-foreground">{formatDate(e.expense_date)}</p>
            </div>
            <span className="font-semibold">{formatCurrency(Number(e.amount))}</span>
          </div>
        );
      })}
    </div>
  );
}
