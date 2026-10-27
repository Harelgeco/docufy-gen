import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyDocumentDirection } from "./lib/translations";

// Apply the saved language's direction before the first paint to avoid a flash.
const savedLang = localStorage.getItem("preferred-language");
applyDocumentDirection(savedLang === "en" ? "en" : "he");

createRoot(document.getElementById("root")!).render(<App />);
