import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { LanguageProvider } from "@/lib/i18n";
import ScrollToTop from "@/components/ScrollToTop";
import { ComingSoonGate } from "@/components/ComingSoonGate";

// Public pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import HowItWorks from "./pages/HowItWorks";
import Pricing from "./pages/Pricing";
// Contact and Team now redirect to About
import About from "./pages/About";
// FAQ page removed — content distributed contextually
import PriceCalculator from "./pages/PriceCalculator";
// Team import removed — redirects to /about
import ReferAHost from "./pages/ReferAHost";
import GetStarted from "./pages/GetStarted";
import BookValuation from "./pages/BookValuation";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import AppDownload from "./pages/AppDownload";
import Listings from "./pages/Listings";
import ListingDetail from "./pages/ListingDetail";

// Owner pages
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerProperty from "./pages/owner/OwnerProperty";
import OwnerBookings from "./pages/owner/OwnerBookings";
import OwnerListings from "./pages/owner/OwnerListings";
import OwnerInquiries from "./pages/owner/OwnerInquiries";
import OwnerPayouts from "./pages/owner/OwnerPayouts";
import OwnerEarnings from "./pages/owner/OwnerEarnings";
import OwnerCalendar from "./pages/owner/OwnerCalendar";
import OwnerGuests from "./pages/owner/OwnerGuests";
import OwnerMessages from "./pages/owner/OwnerMessages";
import OwnerOperations from "./pages/owner/OwnerOperations";
import OwnerDocuments from "./pages/owner/OwnerDocuments";
import OwnerTasks from "./pages/owner/OwnerTasks";
import OwnerSupport from "./pages/owner/OwnerSupport";
import OwnerSettings from "./pages/owner/OwnerSettings";
import OwnerPackages from "./pages/owner/OwnerPackages";
import OwnerAgreement from "./pages/owner/OwnerAgreement";
import OwnerAccount from "./pages/owner/OwnerAccount";

// Admin pages
import AdminAuth from "./pages/admin/AdminAuth";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBeskeder from "./pages/admin/AdminBeskeder";
import AdminKalender from "./pages/admin/AdminKalender";
import AdminOpgaver from "./pages/admin/AdminOpgaver";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminOwners from "./pages/admin/AdminOwners";
import AdminCrmGaester from "./pages/admin/AdminCrmGaester";

import AdminModtagelse from "./pages/admin/AdminModtagelse";
import AdminSager from "./pages/admin/AdminSager";
import AdminSagDetail from "./pages/admin/AdminSagDetail";
import AdminSagerKalender from "./pages/admin/AdminSagerKalender";
import AdminSagerTilkoeb from "./pages/admin/AdminSagerTilkoeb";
import AdminSagerKanaler from "./pages/admin/AdminSagerKanaler";
import AdminDokumenter from "./pages/admin/AdminDokumenter";
import AdminOekonomi from "./pages/admin/AdminOekonomi";
import AdminIndstillinger from "./pages/admin/AdminIndstillinger";
import AdminTeam from "./pages/admin/AdminTeam";
import AdminTemplates from "./pages/admin/AdminTemplates";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminPipelineTemplates from "./pages/admin/AdminPipelineTemplates";

// Guest pages
import GuestAuth from "./pages/guest/GuestAuth";
import GuestDashboard from "./pages/guest/GuestDashboard";
import GuestReservation from "./pages/guest/GuestReservation";
import GuestProperty from "./pages/guest/GuestProperty";
import GuestAddons from "./pages/guest/GuestAddons";
import GuestMessages from "./pages/guest/GuestMessages";
import GuestCheckout from "./pages/guest/GuestCheckout";
import GuestPayment from "./pages/guest/GuestPayment";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, loading, isAdmin, rolesLoaded } = useAuth();
  
  if (loading || (user && !rolesLoaded)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-muted-foreground">Indlæser...</div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to={requireAdmin ? "/admin/auth" : "/auth"} replace />;
  }
  
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/admin/auth" replace />;
  }
  
  return <>{children}</>;
}

function GuestProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/guest/auth" replace />;
  }
  
  return <>{children}</>;
}

const App = () => (
  <ComingSoonGate>
  <LanguageProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* ─── Public Website ─── */}
            <Route path="/" element={<Index />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/listing/:slug" element={<ListingDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Navigate to="/about#kontakt" replace />} />
            <Route path="/faq" element={<Navigate to="/#faq" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/kom-i-gang" element={<GetStarted />} />
            <Route path="/book-vurdering" element={<BookValuation />} />
            <Route path="/beregn-lejeindtaegt" element={<PriceCalculator />} />
            <Route path="/team" element={<Navigate to="/about" replace />} />
            <Route path="/refer-a-host" element={<ReferAHost />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/app" element={<AppDownload />} />
            {/* Legacy redirects */}
            <Route path="/rentals" element={<Navigate to="/listings" replace />} />
            <Route path="/property/:id" element={<Navigate to="/listings" replace />} />

            {/* ─── Owner Experience ─── */}
            <Route path="/owner" element={<ProtectedRoute><OwnerDashboard /></ProtectedRoute>} />
            <Route path="/owner/property" element={<ProtectedRoute><OwnerProperty /></ProtectedRoute>} />
            <Route path="/owner/bookings" element={<ProtectedRoute><OwnerBookings /></ProtectedRoute>} />
            <Route path="/owner/listings" element={<ProtectedRoute><OwnerListings /></ProtectedRoute>} />
            <Route path="/owner/calendar" element={<ProtectedRoute><OwnerCalendar /></ProtectedRoute>} />
            <Route path="/owner/earnings" element={<ProtectedRoute><OwnerEarnings /></ProtectedRoute>} />
            <Route path="/owner/packages" element={<ProtectedRoute><OwnerPackages /></ProtectedRoute>} />
            <Route path="/owner/guests" element={<ProtectedRoute><OwnerGuests /></ProtectedRoute>} />
            <Route path="/owner/messages" element={<ProtectedRoute><OwnerMessages /></ProtectedRoute>} />
            <Route path="/owner/documents" element={<ProtectedRoute><OwnerDocuments /></ProtectedRoute>} />
            <Route path="/owner/agreement" element={<ProtectedRoute><OwnerAgreement /></ProtectedRoute>} />
            <Route path="/owner/payouts" element={<ProtectedRoute><OwnerPayouts /></ProtectedRoute>} />
            <Route path="/owner/operations" element={<ProtectedRoute><OwnerOperations /></ProtectedRoute>} />
            <Route path="/owner/tasks" element={<ProtectedRoute><OwnerTasks /></ProtectedRoute>} />
            <Route path="/owner/support" element={<ProtectedRoute><OwnerSupport /></ProtectedRoute>} />
            <Route path="/owner/account" element={<ProtectedRoute><OwnerAccount /></ProtectedRoute>} />
            <Route path="/owner/settings" element={<ProtectedRoute><OwnerSettings /></ProtectedRoute>} />
            <Route path="/owner/inquiries" element={<ProtectedRoute><OwnerInquiries /></ProtectedRoute>} />
            <Route path="/owner/properties" element={<Navigate to="/owner/property" replace />} />

            {/* ─── Guest Experience ─── */}
            <Route path="/guest/auth" element={<GuestAuth />} />
            <Route path="/guest" element={<GuestProtectedRoute><GuestDashboard /></GuestProtectedRoute>} />
            <Route path="/guest/reservation" element={<GuestProtectedRoute><GuestReservation /></GuestProtectedRoute>} />
            <Route path="/guest/property" element={<GuestProtectedRoute><GuestProperty /></GuestProtectedRoute>} />
            <Route path="/guest/addons" element={<GuestProtectedRoute><GuestAddons /></GuestProtectedRoute>} />
            <Route path="/guest/payment" element={<GuestProtectedRoute><GuestPayment /></GuestProtectedRoute>} />
            <Route path="/guest/messages" element={<GuestProtectedRoute><GuestMessages /></GuestProtectedRoute>} />
            <Route path="/guest/checkout" element={<GuestProtectedRoute><GuestCheckout /></GuestProtectedRoute>} />
            {/* Legacy redirects */}
            <Route path="/guest/checkin" element={<Navigate to="/guest/property" replace />} />
            <Route path="/guest/house-info" element={<Navigate to="/guest/property" replace />} />
            <Route path="/guest/support" element={<Navigate to="/guest/messages" replace />} />

            {/* ─── Admin Panel ─── */}
            <Route path="/admin/auth" element={<AdminAuth />} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/beskeder" element={<ProtectedRoute requireAdmin><AdminBeskeder /></ProtectedRoute>} />
            <Route path="/admin/kalender" element={<ProtectedRoute requireAdmin><AdminKalender /></ProtectedRoute>} />
            <Route path="/admin/opgaver" element={<ProtectedRoute requireAdmin><AdminOpgaver /></ProtectedRoute>} />
            <Route path="/admin/leads" element={<ProtectedRoute requireAdmin><AdminLeads /></ProtectedRoute>} />
            <Route path="/admin/crm/udlejere" element={<ProtectedRoute requireAdmin><AdminOwners /></ProtectedRoute>} />
            <Route path="/admin/crm/gaester" element={<ProtectedRoute requireAdmin><AdminCrmGaester /></ProtectedRoute>} />
            <Route path="/admin/crm/arkiv" element={<Navigate to="/admin/leads" replace />} />
            <Route path="/admin/modtagelse" element={<ProtectedRoute requireAdmin><AdminModtagelse /></ProtectedRoute>} />
            <Route path="/admin/sager" element={<ProtectedRoute requireAdmin><AdminSager /></ProtectedRoute>} />
            <Route path="/admin/sager/:id" element={<ProtectedRoute requireAdmin><AdminSagDetail /></ProtectedRoute>} />
            <Route path="/admin/sager/kalender" element={<ProtectedRoute requireAdmin><AdminSagerKalender /></ProtectedRoute>} />
            <Route path="/admin/sager/tilkoeb" element={<ProtectedRoute requireAdmin><AdminSagerTilkoeb /></ProtectedRoute>} />
            <Route path="/admin/sager/kanaler" element={<ProtectedRoute requireAdmin><AdminSagerKanaler /></ProtectedRoute>} />
            <Route path="/admin/dokumenter" element={<ProtectedRoute requireAdmin><AdminDokumenter /></ProtectedRoute>} />
            <Route path="/admin/oekonomi" element={<ProtectedRoute requireAdmin><AdminOekonomi /></ProtectedRoute>} />
            <Route path="/admin/indstillinger" element={<ProtectedRoute requireAdmin><AdminIndstillinger /></ProtectedRoute>} />
            <Route path="/admin/team" element={<ProtectedRoute requireAdmin><AdminTeam /></ProtectedRoute>} />
            <Route path="/admin/templates" element={<ProtectedRoute requireAdmin><AdminTemplates /></ProtectedRoute>} />
            <Route path="/admin/notifications" element={<ProtectedRoute requireAdmin><AdminNotifications /></ProtectedRoute>} />
            <Route path="/admin/audit-log" element={<ProtectedRoute requireAdmin><AdminAuditLog /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/indstillinger/pipeline-opgaver" element={<ProtectedRoute requireAdmin><AdminPipelineTemplates /></ProtectedRoute>} />
            {/* Legacy admin redirects */}
            <Route path="/admin/listings" element={<Navigate to="/admin/sager" replace />} />
            <Route path="/admin/owners" element={<Navigate to="/admin/crm/udlejere" replace />} />
            <Route path="/admin/guests" element={<Navigate to="/admin/crm/gaester" replace />} />
            <Route path="/admin/bookings" element={<Navigate to="/admin/sager" replace />} />
            <Route path="/admin/calendar" element={<Navigate to="/admin/kalender" replace />} />
            <Route path="/admin/addons" element={<Navigate to="/admin/sager/tilkoeb" replace />} />
            <Route path="/admin/documents" element={<Navigate to="/admin/dokumenter" replace />} />
            <Route path="/admin/chat" element={<Navigate to="/admin/beskeder" replace />} />
            <Route path="/admin/payments" element={<Navigate to="/admin/oekonomi" replace />} />
            <Route path="/admin/payouts" element={<Navigate to="/admin/oekonomi" replace />} />
            <Route path="/admin/properties" element={<Navigate to="/admin/sager" replace />} />
            <Route path="/admin/tasks" element={<Navigate to="/admin/opgaver" replace />} />
            <Route path="/admin/pipeline" element={<Navigate to="/admin/leads" replace />} />
            <Route path="/admin/inquiries" element={<Navigate to="/admin/leads" replace />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </LanguageProvider>
  </ComingSoonGate>
);

export default App;
