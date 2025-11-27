import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { translations, Language } from "@/lib/translations";

interface ColumnSelectorProps {
  columns: string[];
  selectedColumn: string;
  onColumnChange: (column: string) => void;
  language: Language;
}

export const ColumnSelector = ({
  columns,
  selectedColumn,
  onColumnChange,
  language,
}: ColumnSelectorProps) => {
  const t = translations[language];
  return (
    <Card className="p-6 mb-6">
      <div className="space-y-3">
        <Label htmlFor="name-column" className="text-base font-semibold">
          {t.selectNameColumn}
        </Label>
        <p className="text-sm text-muted-foreground">
          {t.selectNameColumnDesc}
        </p>
        <Select value={selectedColumn} onValueChange={onColumnChange}>
          <SelectTrigger id="name-column">
            <SelectValue placeholder={t.selectColumn} />
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
