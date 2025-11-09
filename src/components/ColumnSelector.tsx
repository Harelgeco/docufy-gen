import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ColumnSelectorProps {
  columns: string[];
  selectedColumn: string;
  onColumnChange: (column: string) => void;
}

export const ColumnSelector = ({
  columns,
  selectedColumn,
  onColumnChange,
}: ColumnSelectorProps) => {
  return (
    <Card className="p-6 mb-6">
      <div className="space-y-3">
        <Label htmlFor="name-column" className="text-base font-semibold">
          Select Name Column
        </Label>
        <p className="text-sm text-muted-foreground">
          Choose which column contains the names for document generation
        </p>
        <Select value={selectedColumn} onValueChange={onColumnChange}>
          <SelectTrigger id="name-column">
            <SelectValue placeholder="Select a column" />
          </SelectTrigger>
          <SelectContent>
            {columns.map((column, idx) => (
              <SelectItem key={`${column}-${idx}`} value={column}>
                {column}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
};
