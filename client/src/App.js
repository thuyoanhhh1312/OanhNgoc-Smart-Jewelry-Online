import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import 'react-toastify/dist/ReactToastify.css';

import AdminRoute from './components/routes/AdminRoute';
import UserRoute from './components/routes/UserRoute';

import AdminOrStaffRoute from './components/routes/AdminOrStaffRoute';

import AdminLayout from './layout/AdminLayout';
import './App.css';

import SignIn from './pages/AuthPages/SignIn';
import SignUp from './pages/AuthPages/SignUp';
import ForgotPassword from './pages/AuthPages/ForgotPassword';
import VerifyOtp from './pages/AuthPages/VerifyOtp';
import ResetPassword from './pages/AuthPages/ResetPassword';

import Category from './pages/admin/Category/index';
import AddCategory from './pages/admin/Category/add';
import EditCategory from './pages/admin/Category/edit';

import Product from './pages/admin/Product/index';
import AddProduct from './pages/admin/Product/add';
import EditProduct from './pages/admin/Product/edit';

import SubCategory from './pages/admin/SubCategory/index';
import AddSubCategory from './pages/admin/SubCategory/add';
import EditSubCategory from './pages/admin/SubCategory/edit';

import Promotion from './pages/admin/Promotion/index';
import AddPromotion from './pages/admin/Promotion/add';
import EditPromotion from './pages/admin/Promotion/edit';

import Order from './pages/admin/Order/index';
import EditOrder from './pages/admin/Order/edit';

import User from './pages/admin/User';
import AddUser from './pages/admin/User/AddUser';
import EditUser from './pages/admin/User/edit';

import Dashboard from './pages/admin/Dashboard';

import AdminBankAccounts from './pages/admin/Bank/AdminBankAccounts';

import CustomerList from './pages/admin/Customer/index';

import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import UpdateProfile from './pages/Customer/UpdateProfile';
import Search from './pages/Search';
import ProductCategoryPage from './pages/ProductCategoryPage';
import OrderPage from './pages/OrderPage';
import Checkout from './pages/checkout';
import PromotionsPage from './pages/PromotionsPage';
import OrderSuccess from './pages/OrderSuccess';
import UserOrderHistory from './pages/UserOrderHistory';

import GoldPricePage from './pages/GoldPricePage';

import AdminNews from './pages/admin/News/index';
import AddNews from './pages/admin/News/add';
import EditNews from './pages/admin/News/edit';

import NewsCategory from './pages/admin/NewsCategory/index';
import AddNewsCategory from './pages/admin/NewsCategory/add';
import EditNewsCategory from './pages/admin/NewsCategory/edit';

import ReviewManagement from './pages/admin/Review/ReviewManagement';

import { useDispatch } from 'react-redux';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const userFromStorage = localStorage.getItem('user');
    if (userFromStorage) {
      try {
        const parsedUser = JSON.parse(userFromStorage);
        dispatch({
          type: 'LOGGED_IN_USER',
          payload: parsedUser,
        });
      } catch (err) {
        console.error('Lỗi parse user:', err);
      }
    }
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        <Route path="/checkout" element={<Checkout />} />
        <Route element={<AdminLayout />}>
          {/*Dashboard*/}
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <Dashboard />
              </AdminRoute>
            }
          />

          {/*User*/}
          <Route
            path="/admin/user"
            element={
              <AdminOrStaffRoute>
                <User />
              </AdminOrStaffRoute>
            }
          />
          <Route
            path="/admin/user/add"
            element={
              <AdminOrStaffRoute>
                <AddUser />
              </AdminOrStaffRoute>
            }
          />
          <Route
            path="/admin/user/edit/:id"
            element={
              <AdminOrStaffRoute>
                <EditUser />
              </AdminOrStaffRoute>
            }
          />

          {/* Categories */}
          <Route
            path="/admin/categories"
            element={
              <AdminOrStaffRoute>
                <Category />
              </AdminOrStaffRoute>
            }
          />
          <Route
            path="/admin/categories/add"
            element={
              <AdminOrStaffRoute>
                <AddCategory />
              </AdminOrStaffRoute>
            }
          />
          <Route
            path="/admin/categories/edit/:id"
            element={
              <AdminOrStaffRoute>
                <EditCategory />
              </AdminOrStaffRoute>
            }
          />

          {/* Subcategories */}
          <Route
            path="/admin/subcategories"
            element={
              <AdminOrStaffRoute>
                <SubCategory />
              </AdminOrStaffRoute>
            }
          />
          <Route
            path="/admin/subcategories/add"
            element={
              <AdminOrStaffRoute>
                <AddSubCategory />
              </AdminOrStaffRoute>
            }
          />
          <Route
            path="/admin/subcategories/edit/:id"
            element={
              <AdminOrStaffRoute>
                <EditSubCategory />
              </AdminOrStaffRoute>
            }
          />

          {/* Products */}
          <Route
            path="/admin/products"
            element={
              <AdminOrStaffRoute>
                <Product />
              </AdminOrStaffRoute>
            }
          />
          <Route
            path="/admin/products/add"
            element={
              <AdminOrStaffRoute>
                <AddProduct />
              </AdminOrStaffRoute>
            }
          />
          <Route
            path="/admin/products/edit/:id"
            element={
              <AdminOrStaffRoute>
                <EditProduct />
              </AdminOrStaffRoute>
            }
          />

          {/* Promotions */}
          <Route
            path="/admin/promotions"
            element={
              <AdminOrStaffRoute>
                <Promotion />
              </AdminOrStaffRoute>
            }
          />
          <Route
            path="/admin/promotions/add"
            element={
              <AdminOrStaffRoute>
                <AddPromotion />
              </AdminOrStaffRoute>
            }
          />
          <Route
            path="/admin/promotions/edit/:id"
            element={
              <AdminOrStaffRoute>
                <EditPromotion />
              </AdminOrStaffRoute>
            }
          />
          {/* Customers */}
          <Route
            path="/admin/customers"
            element={
              <AdminOrStaffRoute>
                <CustomerList />
              </AdminOrStaffRoute>
            }
          />

          {/* News */}
          <Route
            path="/admin/news"
            element={
              <AdminOrStaffRoute>
                <AdminNews />
              </AdminOrStaffRoute>
            }
          />
          <Route
            path="/admin/news/add"
            element={
              <AdminOrStaffRoute>
                <AddNews />
              </AdminOrStaffRoute>
            }
          />
          <Route
            path="/admin/news/edit/:id"
            element={
              <AdminOrStaffRoute>
                <EditNews />
              </AdminOrStaffRoute>
            }
          />

          {/* News Categories */}
          <Route
            path="/admin/news-categories"
            element={
              <AdminOrStaffRoute>
                <NewsCategory />
              </AdminOrStaffRoute>
            }
          />
          <Route
            path="/admin/news-categories/add"
            element={
              <AdminOrStaffRoute>
                <AddNewsCategory />
              </AdminOrStaffRoute>
            }
          />
          <Route
            path="/admin/news-categories/edit/:id"
            element={
              <AdminOrStaffRoute>
                <EditNewsCategory />
              </AdminOrStaffRoute>
            }
          />

          {/* Orders */}
          <Route
            path="/admin/orders"
            element={
              <AdminOrStaffRoute>
                <Order />
              </AdminOrStaffRoute>
            }
          />
          <Route
            path="/admin/orders/edit/:id"
            element={
              <AdminOrStaffRoute>
                <EditOrder />
              </AdminOrStaffRoute>
            }
          />
          <Route
            path="/admin/orders/edit/:id"
            element={
              <AdminOrStaffRoute>
                <EditOrder />
              </AdminOrStaffRoute>
            }
          />

          {/*Bank */}
          <Route
            path="/admin/bank-accounts"
            element={
              <AdminOrStaffRoute>
                <AdminBankAccounts />
              </AdminOrStaffRoute>
            }
          />

          {/* Reviews Management */}
          <Route
            path="/admin/reviews"
            element={
              <AdminOrStaffRoute>
                <ReviewManagement />
              </AdminOrStaffRoute>
            }
          />
        </Route>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/order" element={<OrderPage />} />
        <Route path="/:slug" element={<ProductDetail />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/forgot-password/verify" element={<VerifyOtp />} />
        <Route path="/forgot-password/reset" element={<ResetPassword />} />
        <Route path="/search" element={<Search />} />
        <Route path="/product-by-category/:categoryName" element={<ProductCategoryPage />} />
        <Route path="/promotions" element={<PromotionsPage />} />
        {/* ⭐ Blog */}

        {/* ⭐ News (tin tức mới - dùng chung BlogList) */}
        <Route path="/news" element={<News />} />
        <Route path="/news/:slug" element={<NewsDetail />} />
        {/* Gold Prices */}
        <Route path="/gold-prices" element={<GoldPricePage />} />
        <Route
          path="/order-success"
          element={
            <UserRoute>
              <OrderSuccess />
            </UserRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <UserRoute>
              <Checkout />
            </UserRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <UserRoute>
              <UpdateProfile />
            </UserRoute>
          }
        />
        <Route
          path="/order-history"
          element={
            <UserRoute>
              <UserOrderHistory />
            </UserRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
