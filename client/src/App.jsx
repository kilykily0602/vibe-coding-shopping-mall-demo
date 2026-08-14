import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainPage from "./pages/MainPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/admin/AdminPage";
import AdminOrderManagePage from "./pages/admin/AdminOrderManagePage";
import ProductManagePage from "./pages/admin/ProductManagePage";
import ProductCreatePage from "./pages/admin/ProductCreatePage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderListPage from "./pages/OrderListPage";
import OrderPage from "./pages/OrderPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import OrderFailurePage from "./pages/OrderFailurePage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/signup" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/mypage" element={<AdminPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders/complete/:id" element={<OrderSuccessPage />} />
        <Route path="/orders/fail" element={<OrderFailurePage />} />
        <Route path="/orders" element={<OrderListPage />} />
        <Route path="/orders/:id" element={<OrderPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/admin/orders" element={<AdminOrderManagePage />} />
        <Route path="/admin/products" element={<ProductManagePage />} />
        <Route path="/admin/products/new" element={<ProductCreatePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
