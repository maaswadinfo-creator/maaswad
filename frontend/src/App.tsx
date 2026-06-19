import { useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, ClipboardList, Users, Settings, Store, Receipt, ChefHat, Calendar } from 'lucide-react';
import { AppSplash } from './components/AppSplash';
import { CustomerLayout } from './components/layout/CustomerLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { api } from './lib/api';

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

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminChefs from './pages/admin/AdminChefs';
import AdminDishes from './pages/admin/AdminDishes';
import AdminOrders from './pages/admin/AdminOrders';
import AdminSettings from './pages/admin/AdminSettings';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTasks from './pages/admin/AdminTasks';
import AdminChefProfiles from './pages/admin/AdminChefProfiles';
import AdminVisits from './pages/admin/AdminVisits';
import EvalChefDashboard from './pages/evalchef/EvalChefDashboard';

// Generate or retrieve a stable anonymous session ID for unique visitor counting
function getSessionId() {
  const key = 'mw_sid';
  let sid = localStorage.getItem(key);
  if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(key, sid); }
  return sid;
}

// Fire-and-forget page view tracker
function usePageTracking() {
  const location = useLocation();
  const lastPath = useRef('');
  useEffect(() => {
    if (location.pathname === lastPath.current) return;
    lastPath.current = location.pathname;
    // Skip admin/chef internal pages to avoid noise — track only public + landing
    api.post('/analytics/pageview', {
      path: location.pathname,
      sessionId: getSessionId(),
      referrer: document.referrer || null,
    }).catch(() => { /* silent */ });
  }, [location.pathname]);
}

const chefNav = [
  { to: '/chef', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/chef/dishes', label: 'My Dishes', icon: UtensilsCrossed },
  { to: '/chef/orders', label: 'Orders', icon: ClipboardList },
];

const adminNav = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/chefs', label: 'Chef Applications', icon: Store },
  { to: '/admin/chef-evaluators', label: 'Master Chefs', icon: ChefHat },
  { to: '/admin/visits', label: 'Home Visits', icon: Calendar },
  { to: '/admin/dishes', label: 'Dishes', icon: UtensilsCrossed },
  { to: '/admin/orders', label: 'Orders', icon: Receipt },
  { to: '/admin/tasks', label: 'Tasks', icon: ClipboardList },
  { to: '/admin/users', label: 'Admin Users', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

const evalChefNav = [
  { to: '/eval', label: 'My Visits', icon: Calendar },
];

function AppRoutes() {
  usePageTracking();
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
        <Route path="/become-chef" element={<ChefApply />} />
      </Route>

      {/* Chef portal */}
      <Route path="/chef" element={<ProtectedRoute roles={['home_chef']}><DashboardLayout title="Chef Portal" items={chefNav} /></ProtectedRoute>}>
        <Route index element={<ChefDashboard />} />
        <Route path="dishes" element={<ChefDishes />} />
        <Route path="orders" element={<ChefOrders />} />
      </Route>

      {/* Admin / Owner portal */}
      <Route path="/admin" element={<ProtectedRoute roles={['platform_owner', 'operations_manager']}><DashboardLayout title="Admin Console" items={adminNav} /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="chefs" element={<AdminChefs />} />
        <Route path="chef-evaluators" element={<AdminChefProfiles />} />
        <Route path="visits" element={<AdminVisits />} />
        <Route path="dishes" element={<AdminDishes />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="tasks" element={<AdminTasks />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Master Chef Evaluator portal */}
      <Route path="/eval" element={<ProtectedRoute roles={['admin_chef']}><DashboardLayout title="Evaluator Portal" items={evalChefNav} /></ProtectedRoute>}>
        <Route index element={<EvalChefDashboard />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <>
      <AppSplash />
      <AppRoutes />
    </>
  );
}
