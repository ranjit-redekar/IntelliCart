import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import AdminShell from "./components/AdminShell";
import SignInPage from "./pages/SignInPage";
import { useSession } from "./lib/session";
import AiHubPage from "./pages/AiHubPage";
import CustomersPage from "./pages/CustomersPage";
import DashboardPage from "./pages/DashboardPage";
import NotFoundPage from "./pages/NotFoundPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import ProductsPage from "./pages/ProductsPage";
import NewProductPage from "./pages/NewProductPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import FeedbackPage from "./pages/FeedbackPage";
import FeedbackDetailPage from "./pages/FeedbackDetailPage";
import PromotionsPage from "./pages/PromotionsPage";
import SlidesPage from "./pages/SlidesPage";
import SettingsPage from "./pages/SettingsPage";
import StoreProfilePage from "./pages/settings/StoreProfilePage";
import LocalizationPage from "./pages/settings/LocalizationPage";
import ShippingTaxPage from "./pages/settings/ShippingTaxPage";
import PaymentsPage from "./pages/settings/PaymentsPage";
import AuthenticationPage from "./pages/settings/AuthenticationPage";
import ApiKeysPage from "./pages/settings/ApiKeysPage";
import AuditLogsPage from "./pages/settings/AuditLogsPage";
import DemoDataPage from "./pages/settings/DemoDataPage";
import RegisterPage from "./pages/RegisterPage";
import AnomalyAlertsPage from "./pages/ai/AnomalyAlertsPage";
import ForecastingPage from "./pages/ai/ForecastingPage";
import ProductContentStudioPage from "./pages/ai/ProductContentStudioPage";
import PromotionOptimizerPage from "./pages/ai/PromotionOptimizerPage";
import ReviewSummarizerPage from "./pages/ai/ReviewSummarizerPage";
import SalesCopilotPage from "./pages/ai/SalesCopilotPage";
import SmartSearchPage from "./pages/ai/SmartSearchPage";
import SupportAssistantPage from "./pages/ai/SupportAssistantPage";
import TrendSpotterPage from "./pages/ai/TrendSpotterPage";
import DailyBriefingPage from "./pages/ai/DailyBriefingPage";
import InventoryAgentPage from "./pages/ai/InventoryAgentPage";
import SegmentsPage from "./pages/ai/SegmentsPage";
import WinBackPage from "./pages/ai/WinBackPage";
import BundlesPage from "./pages/ai/BundlesPage";
import PricingPage from "./pages/ai/PricingPage";
import ReturnsAnalyzerPage from "./pages/ai/ReturnsAnalyzerPage";
import CartRecoveryPage from "./pages/ai/CartRecoveryPage";
import ProductHealthPage from "./pages/ai/ProductHealthPage";
import RiskTriagePage from "./pages/ai/RiskTriagePage";
import CatalogAuditPage from "./pages/ai/CatalogAuditPage";
import VendorsPage from "./pages/ai/VendorsPage";
import LocalizationAgentPage from "./pages/ai/LocalizationAgentPage";
import CampaignsPage from "./pages/ai/CampaignsPage";
import LogisticsPage from "./pages/ai/LogisticsPage";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useSession();
  const location = useLocation();
  // Wait for /auth/me. Redirecting before it resolves bounced a signed-in
  // operator to the login screen on every hard refresh.
  if (!ready) return null;
  if (!user) {
    return <Navigate to="/sign-in" state={{ from: location.pathname + location.search }} replace />;
  }
  return <>{children}</>;
}

/**
 * A store with no owner yet has nothing to sign in to, so send the first
 * visitor to setup instead of a login form they cannot use.
 */
function SignInOrSetup() {
  const status = useApi(() => api.get<{ needsSetup: boolean }>("/auth/setup-status"), []);
  if (status.loading && !status.data) return null;
  if (status.data?.needsSetup) return <Navigate to="/register" replace />;
  return <SignInPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInOrSetup />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AdminShell />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<NewProductPage />} />
        <Route path="products/:id/edit" element={<NewProductPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="feedback/:id" element={<FeedbackDetailPage />} />
        <Route path="promotions" element={<PromotionsPage />} />
        <Route path="slides" element={<SlidesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/store-profile" element={<StoreProfilePage />} />
        <Route path="settings/localization" element={<LocalizationPage />} />
        <Route path="settings/shipping-tax" element={<ShippingTaxPage />} />
        <Route path="settings/payments" element={<PaymentsPage />} />
        <Route path="settings/authentication" element={<AuthenticationPage />} />
        <Route path="settings/demo-data" element={<DemoDataPage />} />
        <Route path="settings/api-keys" element={<ApiKeysPage />} />
        <Route path="settings/audit-logs" element={<AuditLogsPage />} />
        <Route path="ai-hub" element={<AiHubPage />} />
        <Route path="ai-hub/sales-copilot" element={<SalesCopilotPage />} />
        <Route path="ai-hub/content-studio" element={<ProductContentStudioPage />} />
        <Route path="ai-hub/smart-search" element={<SmartSearchPage />} />
        <Route path="ai-hub/support-assistant" element={<SupportAssistantPage />} />
        <Route path="ai-hub/promotion-optimizer" element={<PromotionOptimizerPage />} />
        <Route path="ai-hub/anomaly-alerts" element={<AnomalyAlertsPage />} />
        <Route path="ai-hub/review-summarizer" element={<ReviewSummarizerPage />} />
        <Route path="ai-hub/forecasting" element={<ForecastingPage />} />
        <Route path="ai-hub/trend-spotter" element={<TrendSpotterPage />} />
        <Route path="ai-hub/daily-briefing" element={<DailyBriefingPage />} />
        <Route path="ai-hub/inventory-agent" element={<InventoryAgentPage />} />
        <Route path="ai-hub/segments" element={<SegmentsPage />} />
        <Route path="ai-hub/win-back" element={<WinBackPage />} />
        <Route path="ai-hub/bundles" element={<BundlesPage />} />
        <Route path="ai-hub/pricing" element={<PricingPage />} />
        <Route path="ai-hub/returns-analyzer" element={<ReturnsAnalyzerPage />} />
        <Route path="ai-hub/cart-recovery" element={<CartRecoveryPage />} />
        <Route path="ai-hub/product-health" element={<ProductHealthPage />} />
        <Route path="ai-hub/risk" element={<RiskTriagePage />} />
        <Route path="ai-hub/catalog-audit" element={<CatalogAuditPage />} />
        <Route path="ai-hub/vendors" element={<VendorsPage />} />
        <Route path="ai-hub/localization-agent" element={<LocalizationAgentPage />} />
        <Route path="ai-hub/campaigns" element={<CampaignsPage />} />
        <Route path="ai-hub/logistics" element={<LogisticsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
