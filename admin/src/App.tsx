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
import AnomalyAlertsPage from "./pages/ai/AnomalyAlertsPage";
import ForecastingPage from "./pages/ai/ForecastingPage";
import ProductContentStudioPage from "./pages/ai/ProductContentStudioPage";
import PromotionOptimizerPage from "./pages/ai/PromotionOptimizerPage";
import ReviewSummarizerPage from "./pages/ai/ReviewSummarizerPage";
import SalesCopilotPage from "./pages/ai/SalesCopilotPage";
import SmartSearchPage from "./pages/ai/SmartSearchPage";
import SupportAssistantPage from "./pages/ai/SupportAssistantPage";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/sign-in" state={{ from: location.pathname + location.search }} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
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
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
