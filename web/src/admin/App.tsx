import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { lazy, type ReactNode } from "react";
import AdminShell from "./components/AdminShell";
import SignInPage from "./pages/SignInPage";
import { useSession } from "./lib/session";
import RegisterPage from "./pages/RegisterPage";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";

// Route pages load on demand; Suspense lives in AdminShell around <Outlet />
// so the sidebar and header stay put while a page chunk loads.
const AiHubPage = lazy(() => import("./pages/AiHubPage"));
const CustomersPage = lazy(() => import("./pages/CustomersPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const OrderDetailPage = lazy(() => import("./pages/OrderDetailPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const NewProductPage = lazy(() => import("./pages/NewProductPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const CustomerDetailPage = lazy(() => import("./pages/CustomerDetailPage"));
const FeedbackPage = lazy(() => import("./pages/FeedbackPage"));
const FeedbackDetailPage = lazy(() => import("./pages/FeedbackDetailPage"));
const PromotionsPage = lazy(() => import("./pages/PromotionsPage"));
const SlidesPage = lazy(() => import("./pages/SlidesPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const StoreProfilePage = lazy(() => import("./pages/settings/StoreProfilePage"));
const LocalizationPage = lazy(() => import("./pages/settings/LocalizationPage"));
const ShippingTaxPage = lazy(() => import("./pages/settings/ShippingTaxPage"));
const PaymentsPage = lazy(() => import("./pages/settings/PaymentsPage"));
const AuthenticationPage = lazy(() => import("./pages/settings/AuthenticationPage"));
const ApiKeysPage = lazy(() => import("./pages/settings/ApiKeysPage"));
const AuditLogsPage = lazy(() => import("./pages/settings/AuditLogsPage"));
const DemoDataPage = lazy(() => import("./pages/settings/DemoDataPage"));
const AnomalyAlertsPage = lazy(() => import("./pages/ai/AnomalyAlertsPage"));
const ForecastingPage = lazy(() => import("./pages/ai/ForecastingPage"));
const ProductContentStudioPage = lazy(() => import("./pages/ai/ProductContentStudioPage"));
const PromotionOptimizerPage = lazy(() => import("./pages/ai/PromotionOptimizerPage"));
const ReviewSummarizerPage = lazy(() => import("./pages/ai/ReviewSummarizerPage"));
const SalesCopilotPage = lazy(() => import("./pages/ai/SalesCopilotPage"));
const SmartSearchPage = lazy(() => import("./pages/ai/SmartSearchPage"));
const SupportAssistantPage = lazy(() => import("./pages/ai/SupportAssistantPage"));
const TrendSpotterPage = lazy(() => import("./pages/ai/TrendSpotterPage"));
const DailyBriefingPage = lazy(() => import("./pages/ai/DailyBriefingPage"));
const InventoryAgentPage = lazy(() => import("./pages/ai/InventoryAgentPage"));
const SegmentsPage = lazy(() => import("./pages/ai/SegmentsPage"));
const WinBackPage = lazy(() => import("./pages/ai/WinBackPage"));
const BundlesPage = lazy(() => import("./pages/ai/BundlesPage"));
const PricingPage = lazy(() => import("./pages/ai/PricingPage"));
const ReturnsAnalyzerPage = lazy(() => import("./pages/ai/ReturnsAnalyzerPage"));
const CartRecoveryPage = lazy(() => import("./pages/ai/CartRecoveryPage"));
const ProductHealthPage = lazy(() => import("./pages/ai/ProductHealthPage"));
const RiskTriagePage = lazy(() => import("./pages/ai/RiskTriagePage"));
const CatalogAuditPage = lazy(() => import("./pages/ai/CatalogAuditPage"));
const VendorsPage = lazy(() => import("./pages/ai/VendorsPage"));
const LocalizationAgentPage = lazy(() => import("./pages/ai/LocalizationAgentPage"));
const CampaignsPage = lazy(() => import("./pages/ai/CampaignsPage"));
const LogisticsPage = lazy(() => import("./pages/ai/LogisticsPage"));

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
