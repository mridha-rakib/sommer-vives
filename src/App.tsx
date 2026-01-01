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
import Contact from "./pages/Contact";
import Rentals from "./pages/Rentals";

// Owner pages
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerProperties from "./pages/owner/OwnerProperties";
import PropertyForm from "./pages/owner/PropertyForm";
import CreateProperty from "./pages/owner/CreateProperty";
import OwnerInquiries from "./pages/owner/OwnerInquiries";
import OwnerPayouts from "./pages/owner/OwnerPayouts";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOwners from "./pages/admin/AdminOwners";
import AdminProperties from "./pages/admin/AdminProperties";
import AdminListings from "./pages/admin/AdminListings";
import AdminInquiries from "./pages/admin/AdminInquiries";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, loading, isAdmin } = useAuth();
  
  if (loading) {
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
    return <Navigate to="/auth" replace />;
  }
  
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/owner" replace />;
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
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/rentals" element={<Rentals />} />

            {/* Owner routes */}
            <Route path="/owner" element={<ProtectedRoute><OwnerDashboard /></ProtectedRoute>} />
            <Route path="/owner/properties" element={<ProtectedRoute><OwnerProperties /></ProtectedRoute>} />
            <Route path="/owner/properties/new" element={<ProtectedRoute><CreateProperty /></ProtectedRoute>} />
            <Route path="/owner/properties/:id/edit" element={<ProtectedRoute><PropertyForm /></ProtectedRoute>} />
            <Route path="/owner/properties/:id/edit" element={<ProtectedRoute><PropertyForm /></ProtectedRoute>} />
            <Route path="/owner/inquiries" element={<ProtectedRoute><OwnerInquiries /></ProtectedRoute>} />
            <Route path="/owner/payouts" element={<ProtectedRoute><OwnerPayouts /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/owners" element={<ProtectedRoute requireAdmin><AdminOwners /></ProtectedRoute>} />
            <Route path="/admin/properties" element={<ProtectedRoute requireAdmin><AdminProperties /></ProtectedRoute>} />
            <Route path="/admin/listings" element={<ProtectedRoute requireAdmin><AdminListings /></ProtectedRoute>} />
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
