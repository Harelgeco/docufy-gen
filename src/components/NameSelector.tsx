import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NameSelectorProps {
  names: string[];
  selectedNames: string[];
  onSelectionChange: (name: string, checked: boolean) => void;
}

export const NameSelector = ({
  names,
  selectedNames,
  onSelectionChange,
}: NameSelectorProps) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        Select Names
      </h3>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {names.map((name) => (
            <div
              key={name}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Checkbox
                id={name}
                checked={selectedNames.includes(name)}
                onCheckedChange={(checked) =>
                  onSelectionChange(name, checked as boolean)
                }
              />
              <label
                htmlFor={name}
                className="flex-1 text-sm font-medium text-foreground cursor-pointer"
              >
                {name}
              </label>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
