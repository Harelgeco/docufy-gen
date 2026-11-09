import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import ManualEntry from "./pages/ManualEntry";
import NotFound from "./pages/NotFound";
import LegalPage from "./pages/LegalPage";
import { SiteFooter } from "@/components/SiteFooter";
import { lazy, Suspense } from "react";
const Admin = lazy(() => import("./pages/Admin"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/excel" element={<Index />} />
          <Route path="/manual" element={<ManualEntry />} />
          <Route path="/privacy" element={<LegalPage kind="privacy" />} />
          <Route path="/terms" element={<LegalPage kind="terms" />} />
          <Route path="/admin" element={<Suspense fallback={null}><Admin /></Suspense>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <SiteFooter hideOn={["/"]} />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
