export const translations = {
  he: {
    // Header
    appTitle: "מחולל מסמכים",
    
    // Navigation
    excelMode: "מצב אקסל",
    manualMode: "הזנה ידנית",
    
    // Hero
    heroTitle: "צור מסמכים מותאמים אישית תוך שניות",
    heroDescription: "העלה את נתוני האקסל ותבנית הוורד שלך, בחר שמות וצור מסמכי PDF מותאמים אישית בקלות.",
    
    // Manual Entry Page
    manualHeroTitle: "הזנה ידנית של נתונים",
    manualHeroDescription: "העלה תבנית וורד ומלא את השדות ידנית ליצירת מסמך מותאם אישית.",
    fillFields: "מלא את השדות",
    fillFieldsDesc: "מלא את השדות הבאים שנמצאו בתבנית",
    noPlaceholders: "לא נמצאו שדות בתבנית. ודא שהתבנית מכילה שדות בפורמט <<שם שדה>>",
    generateDocument: "צור מסמך",
    clearFields: "נקה שדות",
    
    // File Upload
    uploadExcel: "העלה קובץ אקסל",
    uploadExcelDesc: "גרור ושחרר או לחץ כדי לבחור את קובץ הנתונים שלך",
    uploadWord: "העלה תבנית וורד",
    uploadWordDesc: "גרור ושחרר או לחץ כדי לבחור את התבנית שלך",
    chooseFile: "בחר קובץ",
    fileSelected: "קובץ נבחר:",
    
    // Column Selector
    selectNameColumn: "בחר עמודת שם",
    selectNameColumnDesc: "בחר איזה עמודה מכילה את השמות ליצירת המסמכים",
    selectColumn: "בחר עמודה",
    
    // Field Mapping
    fieldMapping: "מיפוי שדות",
    excelHeaders: "כותרות אקסל",
    wordPlaceholders: "מציינים בוורד",
    
    // Name Selector
    selectNames: "בחר שמות",
    searchNames: "חפש שמות...",
    
    // Export Options
    exportOptions: "אפשרויות ייצוא",
    downloadWord: "הורד כקובץ וורד",
    downloadPDF: "הורד כקובץ PDF",
    documentsSelected: "מסמכים נבחרו",
    document: "מסמך",
    documents: "מסמכים",
    
    // Document Preview
    documentPreview: "תצוגה מקדימה של מסמך",
    template: "תבנית",
    selectedName: "שם נבחר",
    dataToFill: "נתונים שימולאו:",
    uploadToPreview: "העלה קבצים ובחר שם כדי לראות תצוגה מקדימה",
    uploadTemplateToStart: "העלה תבנית וורד כדי להתחיל",
    empty: "(ריק)",
    
    // Template selector
    selectTemplate: "בחר תבנית",
    selectTemplateDesc: "בחר תבנית מוכנה מראש או העלה תבנית משלך",
    uploadCustomTemplate: "העלה תבנית משלך",
    orUploadOwn: "או העלה משלך",
    
    // Language selector
    hebrew: "עברית",
    english: "English",
  },
  en: {
    // Header
    appTitle: "Document Generator",
    
    // Navigation
    excelMode: "Excel Mode",
    manualMode: "Manual Entry",
    
    // Hero
    heroTitle: "Generate Custom Documents in Seconds",
    heroDescription: "Upload your Excel data and Word template, select names, and create personalized PDF documents with ease.",
    
    // Manual Entry Page
    manualHeroTitle: "Manual Data Entry",
    manualHeroDescription: "Upload a Word template and fill in the fields manually to create a customized document.",
    fillFields: "Fill in Fields",
    fillFieldsDesc: "Fill in the following fields found in the template",
    noPlaceholders: "No fields found in template. Make sure the template contains fields in <<field name>> format",
    generateDocument: "Generate Document",
    clearFields: "Clear Fields",
    
    // File Upload
    uploadExcel: "Upload Excel File",
    uploadExcelDesc: "Drag and drop or click to select your data file",
    uploadWord: "Upload Word Template",
    uploadWordDesc: "Drag and drop or click to select your template",
    chooseFile: "Choose File",
    fileSelected: "File selected:",
    
    // Column Selector
    selectNameColumn: "Select Name Column",
    selectNameColumnDesc: "Choose which column contains the names for document generation",
    selectColumn: "Select a column",
    
    // Field Mapping
    fieldMapping: "Field Mapping",
    excelHeaders: "Excel Headers",
    wordPlaceholders: "Word Placeholders",
    
    // Name Selector
    selectNames: "Select Names",
    searchNames: "Search names...",
    
    // Export Options
    exportOptions: "Export Options",
    downloadWord: "Download as Word Document(s)",
    downloadPDF: "Download as PDF(s)",
    documentsSelected: "selected",
    document: "document",
    documents: "documents",
    
    // Document Preview
    documentPreview: "Document Preview",
    template: "Template",
    selectedName: "Selected Name",
    dataToFill: "Data that will be filled:",
    uploadToPreview: "Upload files and select a name to see preview",
    uploadTemplateToStart: "Upload a Word template to get started",
    empty: "(empty)",
    
    // Template selector
    selectTemplate: "Select Template",
    selectTemplateDesc: "Choose a pre-defined template or upload your own",
    uploadCustomTemplate: "Upload Custom Template",
    orUploadOwn: "or upload your own",
    
    // Language selector
    hebrew: "עברית",
    english: "English",
  },
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.he;
