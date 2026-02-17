import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import FeaturePlaceholder from "@/components/FeaturePlaceholder";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import CreatePage from "@/pages/CreatePage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import NotFound from "@/pages/NotFound";
import { Users, LayoutGrid, Palette, PenTool, Layers, Film, Package, FlaskConical, Repeat } from "lucide-react";

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
            <Route path="/character" element={<ProtectedPage><FeaturePlaceholder title="Character Engine" description="Generate consistent characters across scenes with face identity lock, pose selection, and emotion control." icon={Users} /></ProtectedPage>} />
            <Route path="/structured" element={<ProtectedPage><FeaturePlaceholder title="Precision Composer" description="High-control scene generation with field-based structured input and layer priority configuration." icon={LayoutGrid} /></ProtectedPage>} />
            <Route path="/advanced" element={<ProtectedPage><FeaturePlaceholder title="Design Studio" description="Logo creation, thumbnail generation, poster mode, and brand-focused design tools." icon={Palette} /></ProtectedPage>} />
            <Route path="/edit" element={<ProtectedPage><FeaturePlaceholder title="AI Editor" description="Inpainting, outpainting, object removal, background replacement, and AI upscaling." icon={PenTool} /></ProtectedPage>} />
            <Route path="/style" element={<ProtectedPage><FeaturePlaceholder title="Style Transfer" description="Apply artistic or cinematic styles to existing images with intensity control." icon={Layers} /></ProtectedPage>} />
            <Route path="/motion" element={<ProtectedPage><FeaturePlaceholder title="Motion Designer" description="Cinematic frame design with camera simulation, parallax, and loop animation export." icon={Film} /></ProtectedPage>} />
            <Route path="/assets" element={<ProtectedPage><FeaturePlaceholder title="Asset Generator" description="Game-ready icons, UI illustrations, sprite sheets, and consistent asset packs." icon={Package} /></ProtectedPage>} />
            <Route path="/prompt-lab" element={<ProtectedPage><FeaturePlaceholder title="Prompt Lab" description="Advanced prompt optimization with analysis, auto-enhancement, and A/B comparison." icon={FlaskConical} /></ProtectedPage>} />
            <Route path="/batch" element={<ProtectedPage><FeaturePlaceholder title="Batch Generation" description="High-volume generation with CSV upload, style-locked mode, and ZIP export." icon={Repeat} /></ProtectedPage>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
