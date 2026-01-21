import { format } from "date-fns";
import { he, enUS } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Language } from "@/lib/translations";
import { ImageUploader, UploadedImage } from "./ImageUploader";

interface SmartFieldInputProps {
  fieldName: string;
  value: string;
  onChange: (value: string) => void;
  language: Language;
  images?: UploadedImage[];
  onImagesChange?: (images: UploadedImage[]) => void;
}

// Detect field type based on name
const getFieldType = (
  fieldName: string
): "date" | "textarea" | "images" | "text" => {
  const lowerName = fieldName.toLowerCase();
  const hebrewName = fieldName;

  // Date fields
  if (
    lowerName.includes("date") ||
    lowerName.includes("תאריך") ||
    hebrewName.includes("תאריך")
  ) {
    // Exclude "current date" which is auto-filled
    if (
      lowerName.includes("current") ||
      hebrewName.includes("נוכחי") ||
      hebrewName.includes("היום")
    ) {
      return "text"; // Will be hidden anyway
    }
    return "date";
  }

  // Textarea fields (notes, comments, remarks)
  if (
    lowerName.includes("note") ||
    lowerName.includes("comment") ||
    lowerName.includes("remark") ||
    lowerName.includes("description") ||
    hebrewName.includes("הערות") ||
    hebrewName.includes("הערה") ||
    hebrewName.includes("תיאור") ||
    hebrewName.includes("פירוט")
  ) {
    return "textarea";
  }

  // Image fields
  if (
    lowerName.includes("image") ||
    lowerName.includes("photo") ||
    lowerName.includes("picture") ||
    hebrewName.includes("תמונ") ||
    hebrewName.includes("צילום")
  ) {
    return "images";
  }

  return "text";
};

// Check if field should be hidden (auto-filled)
export const isAutoFilledField = (fieldName: string): boolean => {
  const lowerName = fieldName.toLowerCase();
  const hebrewName = fieldName;

  return (
    lowerName.includes("current date") ||
    lowerName.includes("today") ||
    hebrewName.includes("תאריך נוכחי") ||
    hebrewName.includes("תאריך היום")
  );
};

export const SmartFieldInput = ({
  fieldName,
  value,
  onChange,
  language,
  images,
  onImagesChange,
}: SmartFieldInputProps) => {
  const fieldType = getFieldType(fieldName);
  const locale = language === "he" ? he : enUS;

  // Parse date value if it's a date field
  const dateValue = value ? new Date(value) : undefined;
  const isValidDate = dateValue && !isNaN(dateValue.getTime());

  switch (fieldType) {
    case "date":
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {isValidDate ? (
                format(dateValue, "PPP", { locale })
              ) : (
                <span>
                  {language === "he" ? "בחר תאריך..." : "Pick a date..."}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={isValidDate ? dateValue : undefined}
              onSelect={(date) => {
                if (date) {
                  onChange(date.toISOString());
                }
              }}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      );

    case "textarea":
      return (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`${language === "he" ? "הכנס" : "Enter"} ${fieldName}`}
          dir="auto"
          className="min-h-[120px] resize-y"
        />
      );

    case "images":
      return (
        <ImageUploader
          images={images || []}
          onImagesChange={onImagesChange || (() => {})}
          language={language}
        />
      );

    default:
      return (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`${language === "he" ? "הכנס" : "Enter"} ${fieldName}`}
          dir="auto"
        />
      );
  }
};

export { getFieldType };
