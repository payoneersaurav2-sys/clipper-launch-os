import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';

// Eager
import LandingLayout   from './layouts/LandingLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout      from './layouts/AuthLayout';
import ProtectedRoute  from './components/ProtectedRoute';
import LandingPage     from './pages/LandingPage';
import LoginPage       from './pages/LoginPage';
import AuthCallback    from './pages/AuthCallback';
import AuthIframe      from './pages/AuthIframe';
import ExpiredPage     from './pages/ExpiredPage';
import { NotFoundPage, ServerErrorPage } from './pages/ErrorPages';

// Lazy — all heavy pages
const DashboardHome      = lazy(() => import('./pages/DashboardHome'));
const CampaignOSPage     = lazy(() => import('./pages/CampaignOSPage'));
const ClipPipelinePage   = lazy(() => import('./pages/ClipPipelinePage'));
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'));
const AISettingsPage     = lazy(() => import('./pages/AISettingsPage'));
const SettingsPage       = lazy(() => import('./pages/SettingsPage'));
const OnboardingPage     = lazy(() => import('./pages/OnboardingPage'));
const HelpCenterPage     = lazy(() => import('./pages/HelpCenterPage'));
const ChangelogPage      = lazy(() => import('./pages/ChangelogPage'));
const SignupPage          = lazy(() => import('./pages/SignupPage'));
const TermsPage           = lazy(() => import('./pages/TermsPage'));
const FAQPage             = lazy(() => import('./pages/FAQPage'));

const IdeaStudio     = lazy(() => import('./components/modules/IdeaStudio').then(m => ({ default: m.IdeaStudio })));
const HookEngine     = lazy(() => import('./components/modules/HookEngine').then(m => ({ default: m.HookEngine })));
const CaptionOS      = lazy(() => import('./components/modules/CaptionOS').then(m => ({ default: m.CaptionOS })));
const LaunchCenter   = lazy(() => import('./components/modules/LaunchCenter').then(m => ({ default: m.LaunchCenter })));
const KnowledgeVault = lazy(() => import('./components/modules/KnowledgeVault').then(m => ({ default: m.KnowledgeVault })));
const PromptLibrary  = lazy(() => import('./components/modules/StubModules').then(m => ({ default: m.PromptLibrary })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <div className="h-8 w-8 rounded-full border-b-2 border-primary animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/"          element={<LandingLayout><LandingPage /></LandingLayout>} />
            <Route path="/faq"       element={<LandingLayout><FAQPage /></LandingLayout>} />
            <Route path="/terms"     element={<LandingLayout><TermsPage /></LandingLayout>} />
            <Route path="/changelog" element={<LandingLayout><ChangelogPage /></LandingLayout>} />
            <Route path="/help"      element={<LandingLayout><HelpCenterPage /></LandingLayout>} />
            <Route path="/500"       element={<ServerErrorPage />} />

            {/* Auth */}
            <Route path="/login"         element={<AuthLayout><LoginPage /></AuthLayout>} />
            <Route path="/signup"        element={<SignupPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/iframe"   element={<AuthIframe />} />
            {/* Whop Experience View: configure this as /experiences/[experienceId] in Whop. */}
            <Route path="/experiences/:experienceId/*" element={<AuthIframe />} />
            <Route path="/expired"       element={<ExpiredPage />} />
            <Route path="/onboarding"    element={<OnboardingPage />} />

            {/* Protected */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index                  element={<DashboardHome />} />
                <Route path="idea-studio"     element={<IdeaStudio />} />
                <Route path="hook-engine"     element={<HookEngine />} />
                <Route path="caption-os"      element={<CaptionOS />} />
                <Route path="launch-center"   element={<LaunchCenter />} />
                <Route path="campaign-os"     element={<CampaignOSPage />} />
                <Route path="clip-pipeline"   element={<ClipPipelinePage />} />
                <Route path="analytics"       element={<AnalyticsDashboard />} />
                <Route path="knowledge-vault" element={<KnowledgeVault />} />
                <Route path="prompt-library"  element={<PromptLibrary />} />
                <Route path="ai-settings"     element={<AISettingsPage />} />
                <Route path="settings"        element={<SettingsPage />} />
                <Route path="help"            element={<HelpCenterPage />} />
                <Route path="changelog"       element={<ChangelogPage />} />
                <Route path="*"               element={<NotFoundPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
