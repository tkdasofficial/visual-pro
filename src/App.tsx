import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
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
import AdminPage from "@/pages/AdminPage";
import AccountSettingsPage from "@/pages/AccountSettingsPage";
import ReferralPage from "@/pages/ReferralPage";
import PlansPage from "@/pages/PlansPage";
import HistoryPage from "@/pages/HistoryPage";
import FeedbackPage from "@/pages/FeedbackPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function UserPage({ children }: { children: React.ReactNode }) {
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
            <Route path="/invite/:code" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* Feature pages */}
            <Route path="/create" element={<UserPage><CreatePage /></UserPage>} />
            <Route path="/character" element={<UserPage><CharacterPage /></UserPage>} />
            <Route path="/structured" element={<UserPage><StructuredPage /></UserPage>} />
            <Route path="/advanced" element={<UserPage><DesignStudioPage /></UserPage>} />
            <Route path="/edit" element={<UserPage><EditorPage /></UserPage>} />
            <Route path="/style" element={<UserPage><StyleTransferPage /></UserPage>} />
            <Route path="/motion" element={<UserPage><MotionPage /></UserPage>} />
            <Route path="/assets" element={<UserPage><AssetsPage /></UserPage>} />
            <Route path="/prompt-lab" element={<UserPage><PromptLabPage /></UserPage>} />
            <Route path="/batch" element={<UserPage><BatchPage /></UserPage>} />

            {/* Profile pages (full screen within layout) */}
            <Route path="/account" element={<UserPage><AccountSettingsPage /></UserPage>} />
            <Route path="/referral" element={<UserPage><ReferralPage /></UserPage>} />
            <Route path="/plans" element={<UserPage><PlansPage /></UserPage>} />
            <Route path="/history" element={<UserPage><HistoryPage /></UserPage>} />
            <Route path="/feedback" element={<UserPage><FeedbackPage /></UserPage>} />

            {/* Admin panel - separate route with admin-only access */}
            <Route path="/admin/*" element={<AdminRoute><AdminPage /></AdminRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
