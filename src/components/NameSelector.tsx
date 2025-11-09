import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNames = names.filter((name) =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        Select Names
      </h3>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search names..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {filteredNames.map((name) => (
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
