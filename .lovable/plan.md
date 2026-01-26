
# תוכנית לתיקון הכנסת תמונות למסמך DOCX

## סיכום הבעיות שנמצאו

לאחר בדיקה מעמיקה של הקוד והדוקומנטציה של `docxtemplater-image-module-free`, זיהיתי את הבעיות הבאות:

1. **סינטקס שגוי**: השתמשנו ב-`%<<תמונות>>` בעוד שהסינטקס הנכון הוא `{%תמונות}` (סוגריים מסולסלים, לא angle brackets)
2. **פורמט נתונים שגוי**: הפונקציה `getImage` מחזירה `Uint8Array` במקום `ArrayBuffer`
3. **התבנית לא מכילה placeholder לתמונות**: קובץ התבנית הנוכחי לא מכיל את הסינטקס הנדרש לתמונות

## הפתרון

### שלב 1: תיקון פונקציית getImage

שינוי הפונקציה להחזיר `ArrayBuffer` במקום `Uint8Array`:

```typescript
const base64DataURLToArrayBuffer = (dataURL: string): ArrayBuffer | false => {
  const base64Regex = /^data:image\/(png|jpg|jpeg|gif|svg|svg\+xml|webp);base64,/;
  if (!base64Regex.test(dataURL)) {
    return false;
  }
  const stringBase64 = dataURL.replace(base64Regex, "");
  const binaryString = window.atob(stringBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer; // החזרת ArrayBuffer
};
```

### שלב 2: הסרת ה-custom delimiters מה-image module

מכיוון ש-image module משתמש תמיד בסוגריים מסולסלים `{%...}` בלי קשר ל-delimiters של הטקסט:

```typescript
// Template data לתמונות - שמות ללא << >>
templateData["תמונות"] = imageDataUrl;
templateData["image"] = imageDataUrl;
```

### שלב 3: עדכון קובץ התבנית

צריך לערוך את קובץ התבנית `פורמט_פיקוח_עליון.docx` ולהוסיף:
- `{%תמונות}` - למקום שבו רוצים להכניס תמונה

### שלב 4: עדכון ההוראות למשתמש

שינוי ההודעה באתר:
- **קודם**: "כדי שתמונות יופיעו במסמך, התבנית צריכה להכיל: %<<תמונות>>"
- **אחרי**: "כדי שתמונות יופיעו במסמך, התבנית צריכה להכיל: {%תמונות}"

---

## פרטים טכניים

### קבצים שיעודכנו

| קובץ | שינוי |
|------|-------|
| `src/components/ManualExportOptions.tsx` | תיקון פונקציות המרה והגדרות image module |
| `public/templates/פורמט_פיקוח_עליון.docx` | הוספת `{%תמונות}` לתבנית |

### קוד מתוקן ל-ManualExportOptions.tsx

```typescript
// פונקציה חדשה להמרה - מחזירה ArrayBuffer
const base64DataURLToArrayBuffer = (dataURL: string): ArrayBuffer | false => {
  const base64Regex = /^data:image\/(png|jpg|jpeg|gif|svg|svg\+xml|webp);base64,/;
  if (!base64Regex.test(dataURL)) {
    return false;
  }
  const stringBase64 = dataURL.replace(base64Regex, "");
  const binaryString = window.atob(stringBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// הגדרת Image Module
const imageOpts = {
  centered: false,
  fileType: "docx" as const,
  getImage: (tagValue: string) => {
    return base64DataURLToArrayBuffer(tagValue);
  },
  getSize: () => [400, 300],
};
```

### הערה חשובה

הסינטקס של תמונות `{%...}` הוא **נפרד** מהסינטקס של טקסט `<<...>>`:
- טקסט: `<<שם פרויקט>>`, `<<תאריך בדיקה>>`
- תמונות: `{%תמונות}`, `{%image1}`

זה אומר שבאותו מסמך יהיו שני סוגי placeholders.
