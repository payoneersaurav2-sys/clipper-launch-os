import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingLayout from './layouts/LandingLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AuthCallback from './pages/AuthCallback';
import AuthIframe from './pages/AuthIframe';
import ExpiredPage from './pages/ExpiredPage';
import DashboardHome from './pages/DashboardHome';
import TermsPage from './pages/TermsPage';
import FAQPage from './pages/FAQPage';
import ProtectedRoute from './components/ProtectedRoute';
import AISettingsPage from './pages/AISettingsPage';
import { 
  IdeaStudio, HookEngine, CaptionOS, LaunchCenter, 
  ClipTracker, KnowledgeVault, PromptLibrary, Analytics 
} from './components/ModulePlaceholders';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingLayout><LandingPage /></LandingLayout>} />
        <Route path="/faq" element={<LandingLayout><FAQPage /></LandingLayout>} />
        <Route path="/terms" element={<LandingLayout><TermsPage /></LandingLayout>} />
        
        {/* Authentication */}
        <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/iframe" element={<AuthIframe />} />
        <Route path="/expired" element={<ExpiredPage />} />
        
        {/* Dashboard OS */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
             <Route index element={<DashboardHome />} />
             <Route path="idea-studio" element={<IdeaStudio />} />
             <Route path="hook-engine" element={<HookEngine />} />
             <Route path="caption-os" element={<CaptionOS />} />
             <Route path="launch-center" element={<LaunchCenter />} />
             <Route path="clip-tracker" element={<ClipTracker />} />
             <Route path="knowledge-vault" element={<KnowledgeVault />} />
             <Route path="prompt-library" element={<PromptLibrary />} />
             <Route path="analytics" element={<Analytics />} />
             <Route path="ai-settings" element={<AISettingsPage />} />
             <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
