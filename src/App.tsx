import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";

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
import AdminOwners from "./pages/admin/AdminOwners";
import AdminListings from "./pages/admin/AdminListings";
import AdminPricing from "./pages/admin/AdminPricing";
import AdminCalendarPage from "./pages/admin/AdminCalendarPage";
import AdminEmailsPage from "./pages/admin/AdminEmailsPage";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminInquiries from "./pages/admin/AdminInquiries";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminGuests from "./pages/admin/AdminGuests";
import AdminPayouts from "./pages/admin/AdminPayouts";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import AdminChat from "./pages/admin/AdminChat";
import AdminOptimizations from "./pages/admin/AdminOptimizations";
import AdminPipeline from "./pages/admin/AdminPipeline";
import AdminAgreements from "./pages/admin/AdminAgreements";
import AdminTemplates from "./pages/admin/AdminTemplates";
import AdminPropertiesMgmt from "./pages/admin/AdminPropertiesMgmt";
import AdminKeyboxes from "./pages/admin/AdminKeyboxes";
import AdminSupportTickets from "./pages/admin/AdminSupportTickets";
import AdminCleaning from "./pages/admin/AdminCleaning";
import AdminMaintenance from "./pages/admin/AdminMaintenance";
import AdminTasks from "./pages/admin/AdminTasks";
import AdminDocuments from "./pages/admin/AdminDocuments";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminStayContent from "./pages/admin/AdminStayContent";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminAddOns from "./pages/admin/AdminAddOns";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminServicePartners from "./pages/admin/AdminServicePartners";
import AdminCMS from "./pages/admin/AdminCMS";
import AdminAutomations from "./pages/admin/AdminAutomations";

// Guest pages
import GuestAuth from "./pages/guest/GuestAuth";
import GuestDashboard from "./pages/guest/GuestDashboard";
import GuestReservation from "./pages/guest/GuestReservation";
import GuestCheckin from "./pages/guest/GuestCheckin";
import GuestHouseInfo from "./pages/guest/GuestHouseInfo";
import GuestAddons from "./pages/guest/GuestAddons";
import GuestMessages from "./pages/guest/GuestMessages";
import GuestSupport from "./pages/guest/GuestSupport";
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
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            <Route path="/guest/checkin" element={<GuestProtectedRoute><GuestCheckin /></GuestProtectedRoute>} />
            <Route path="/guest/house-info" element={<GuestProtectedRoute><GuestHouseInfo /></GuestProtectedRoute>} />
            <Route path="/guest/addons" element={<GuestProtectedRoute><GuestAddons /></GuestProtectedRoute>} />
            <Route path="/guest/payment" element={<GuestProtectedRoute><GuestPayment /></GuestProtectedRoute>} />
            <Route path="/guest/messages" element={<GuestProtectedRoute><GuestMessages /></GuestProtectedRoute>} />
            <Route path="/guest/support" element={<GuestProtectedRoute><GuestSupport /></GuestProtectedRoute>} />
            <Route path="/guest/checkout" element={<GuestProtectedRoute><GuestCheckout /></GuestProtectedRoute>} />

            {/* ─── Admin Panel ─── */}
            <Route path="/admin/auth" element={<AdminAuth />} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/leads" element={<ProtectedRoute requireAdmin><AdminLeads /></ProtectedRoute>} />
            <Route path="/admin/owners" element={<ProtectedRoute requireAdmin><AdminOwners /></ProtectedRoute>} />
            <Route path="/admin/guests" element={<ProtectedRoute requireAdmin><AdminGuests /></ProtectedRoute>} />
            <Route path="/admin/properties-mgmt" element={<ProtectedRoute requireAdmin><AdminPropertiesMgmt /></ProtectedRoute>} />
            <Route path="/admin/agreements" element={<ProtectedRoute requireAdmin><AdminAgreements /></ProtectedRoute>} />
            <Route path="/admin/templates" element={<ProtectedRoute requireAdmin><AdminTemplates /></ProtectedRoute>} />
            <Route path="/admin/pipeline" element={<ProtectedRoute requireAdmin><AdminPipeline /></ProtectedRoute>} />
            <Route path="/admin/tasks" element={<ProtectedRoute requireAdmin><AdminTasks /></ProtectedRoute>} />
            <Route path="/admin/bookings" element={<ProtectedRoute requireAdmin><AdminBookings /></ProtectedRoute>} />
            <Route path="/admin/calendar" element={<ProtectedRoute requireAdmin><AdminCalendarPage /></ProtectedRoute>} />
            <Route path="/admin/listings" element={<ProtectedRoute requireAdmin><AdminListings /></ProtectedRoute>} />
            <Route path="/admin/pricing" element={<ProtectedRoute requireAdmin><AdminPricing /></ProtectedRoute>} />
            <Route path="/admin/addons" element={<ProtectedRoute requireAdmin><AdminAddOns /></ProtectedRoute>} />
            <Route path="/admin/payments" element={<ProtectedRoute requireAdmin><AdminPayments /></ProtectedRoute>} />
            <Route path="/admin/payouts" element={<ProtectedRoute requireAdmin><AdminPayouts /></ProtectedRoute>} />
            <Route path="/admin/chat" element={<ProtectedRoute requireAdmin><AdminChat /></ProtectedRoute>} />
            <Route path="/admin/emails" element={<ProtectedRoute requireAdmin><AdminEmailsPage /></ProtectedRoute>} />
            <Route path="/admin/support" element={<ProtectedRoute requireAdmin><AdminSupportTickets /></ProtectedRoute>} />
            <Route path="/admin/service-partners" element={<ProtectedRoute requireAdmin><AdminServicePartners /></ProtectedRoute>} />
            <Route path="/admin/cleaning" element={<ProtectedRoute requireAdmin><AdminCleaning /></ProtectedRoute>} />
            <Route path="/admin/maintenance" element={<ProtectedRoute requireAdmin><AdminMaintenance /></ProtectedRoute>} />
            <Route path="/admin/keyboxes" element={<ProtectedRoute requireAdmin><AdminKeyboxes /></ProtectedRoute>} />
            <Route path="/admin/documents" element={<ProtectedRoute requireAdmin><AdminDocuments /></ProtectedRoute>} />
            <Route path="/admin/stay-content" element={<ProtectedRoute requireAdmin><AdminStayContent /></ProtectedRoute>} />
            <Route path="/admin/cms" element={<ProtectedRoute requireAdmin><AdminCMS /></ProtectedRoute>} />
            <Route path="/admin/automations" element={<ProtectedRoute requireAdmin><AdminAutomations /></ProtectedRoute>} />
            <Route path="/admin/notifications" element={<ProtectedRoute requireAdmin><AdminNotifications /></ProtectedRoute>} />
            <Route path="/admin/audit-log" element={<ProtectedRoute requireAdmin><AdminAuditLog /></ProtectedRoute>} />
            <Route path="/admin/optimizations" element={<ProtectedRoute requireAdmin><AdminOptimizations /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>} />
            {/* Legacy redirects */}
            <Route path="/admin/properties" element={<Navigate to="/admin/listings" replace />} />
            <Route path="/admin/inquiries" element={<ProtectedRoute requireAdmin><AdminInquiries /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
