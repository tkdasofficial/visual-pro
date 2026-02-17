import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import CreatePage from "@/pages/CreatePage";
import CharacterPage from "@/pages/CharacterPage";
import StructuredPage from "@/pages/StructuredPage";
import DesignStudioPage from "@/pages/DesignStudioPage";
import EditorPage from "@/pages/EditorPage";
import StyleTransferPage from "@/pages/StyleTransferPage";
import MotionPage from "@/pages/MotionPage";
import AssetsPage from "@/pages/AssetsPage";
import PromptLabPage from "@/pages/PromptLabPage";
import BatchPage from "@/pages/BatchPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/create" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            <Route path="/create" element={<ProtectedPage><CreatePage /></ProtectedPage>} />
            <Route path="/character" element={<ProtectedPage><CharacterPage /></ProtectedPage>} />
            <Route path="/structured" element={<ProtectedPage><StructuredPage /></ProtectedPage>} />
            <Route path="/advanced" element={<ProtectedPage><DesignStudioPage /></ProtectedPage>} />
            <Route path="/edit" element={<ProtectedPage><EditorPage /></ProtectedPage>} />
            <Route path="/style" element={<ProtectedPage><StyleTransferPage /></ProtectedPage>} />
            <Route path="/motion" element={<ProtectedPage><MotionPage /></ProtectedPage>} />
            <Route path="/assets" element={<ProtectedPage><AssetsPage /></ProtectedPage>} />
            <Route path="/prompt-lab" element={<ProtectedPage><PromptLabPage /></ProtectedPage>} />
            <Route path="/batch" element={<ProtectedPage><BatchPage /></ProtectedPage>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
