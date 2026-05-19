import { Route, Routes } from "react-router-dom";
import StorefrontShell from "./components/StorefrontShell";
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import AccountLayout from "./pages/AccountLayout";
import AccountOverviewPage from "./pages/AccountOverviewPage";
import AccountOrdersPage from "./pages/AccountOrdersPage";
import AccountOrderDetailPage from "./pages/AccountOrderDetailPage";
import AccountAddressesPage from "./pages/AccountAddressesPage";
import AccountReviewsPage from "./pages/AccountReviewsPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import AboutPage from "./pages/AboutPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StorefrontShell />}>
        <Route index element={<HomePage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="products/:id" element={<ProductPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="order/:id" element={<OrderConfirmationPage />} />
        <Route path="account" element={<AccountLayout />}>
          <Route index element={<AccountOverviewPage />} />
          <Route path="orders" element={<AccountOrdersPage />} />
          <Route path="orders/:id" element={<AccountOrderDetailPage />} />
          <Route path="addresses" element={<AccountAddressesPage />} />
          <Route path="reviews" element={<AccountReviewsPage />} />
        </Route>
        <Route path="sign-in" element={<SignInPage />} />
        <Route path="sign-up" element={<SignUpPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
