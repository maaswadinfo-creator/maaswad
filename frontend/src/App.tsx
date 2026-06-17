import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, ClipboardList, Bike, Users, Settings, Store, Receipt } from 'lucide-react';
import { CustomerLayout } from './components/layout/CustomerLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import NotFound from './pages/NotFound';

import CustomerHome from './pages/customer/Home';
import SearchPage from './pages/customer/Search';
import DishDetail from './pages/customer/DishDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import Orders from './pages/customer/Orders';
import OrderTracking from './pages/customer/OrderTracking';
import Account from './pages/customer/Account';
import ChefApply from './pages/chef/ChefApply';

import ChefDashboard from './pages/chef/ChefDashboard';
import ChefDishes from './pages/chef/ChefDishes';
import ChefOrders from './pages/chef/ChefOrders';

import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import DeliveryOrders from './pages/delivery/DeliveryOrders';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminChefs from './pages/admin/AdminChefs';
import AdminDishes from './pages/admin/AdminDishes';
import AdminOrders from './pages/admin/AdminOrders';
import AdminSettings from './pages/admin/AdminSettings';

const chefNav = [
  { to: '/chef', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/chef/dishes', label: 'My Dishes', icon: UtensilsCrossed },
  { to: '/chef/orders', label: 'Orders', icon: ClipboardList },
];
const deliveryNav = [
  { to: '/delivery', label: 'Dashboard', icon: Bike },
  { to: '/delivery/orders', label: 'Deliveries', icon: ClipboardList },
];
const adminNav = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/chefs', label: 'Chefs', icon: Store },
  { to: '/admin/dishes', label: 'Dishes', icon: UtensilsCrossed },
  { to: '/admin/orders', label: 'Orders', icon: Receipt },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* Customer portal */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<CustomerHome />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/dish/:id" element={<DishDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/become-chef" element={<ProtectedRoute><ChefApply /></ProtectedRoute>} />
      </Route>

      {/* Chef portal */}
      <Route path="/chef" element={<ProtectedRoute roles={['home_chef']}><DashboardLayout title="Chef Portal" items={chefNav} /></ProtectedRoute>}>
        <Route index element={<ChefDashboard />} />
        <Route path="dishes" element={<ChefDishes />} />
        <Route path="orders" element={<ChefOrders />} />
      </Route>

      {/* Delivery portal */}
      <Route path="/delivery" element={<ProtectedRoute roles={['delivery_partner']}><DashboardLayout title="Delivery Partner" items={deliveryNav} /></ProtectedRoute>}>
        <Route index element={<DeliveryDashboard />} />
        <Route path="orders" element={<DeliveryOrders />} />
      </Route>

      {/* Admin / Owner portal */}
      <Route path="/admin" element={<ProtectedRoute roles={['platform_owner', 'operations_manager']}><DashboardLayout title="Admin Console" items={adminNav} /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="chefs" element={<AdminChefs />} />
        <Route path="dishes" element={<AdminDishes />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
