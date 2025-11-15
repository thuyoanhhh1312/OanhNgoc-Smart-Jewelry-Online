import React, { useState, useEffect } from 'react';
import { Image } from 'primereact/image';
import { Link } from 'react-router-dom';
import { Dropdown } from '../components/ui/dropdown/Dropdown';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../api/auth';
import { Menu, Badge } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import Header from '../components/ui/home/HomeHeader';

const MainHeader = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const cart = useSelector((state) => state.cart ?? []);

  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      if (token) {
        await logout(token);
      }

      dispatch({
        type: 'LOGOUT',
      });
      dispatch({
        type: 'CLEAR_CART',
      });
      localStorage.removeItem('user');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const goToOrderHistory = () => {
    closeDropdown();
    navigate("/order-history");
  };

  const goToProfile = () => {
    closeDropdown();
    navigate("/profile");
  };

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="shadow-md">
      <div className="flex flex-row justify-between items-center p-6">
        <div></div>
        <div className="flex justify-center">
          <Link to="/" onClick={() => window.scrollTo(0, 0)}>
            <Image
              src="https://cdn.pnj.io/images/logo/pnj.com.vn.png"
              width="100px"
              height="50px"
              alt="Logo PNJ"
            />
          </Link>
        </div>
        <div className="flex flex-row items-center justify-center">
          {/* Nếu người dùng đã đăng nhập thì hiển thị tên, nếu chưa thì hiển thị nút Sign In */}
          {user ? (
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="flex items-center text-gray-700 dropdown-toggle dark:text-gray-400"
              >
                <span className="block mr-1 font-medium text-theme-sm">
                  {'Chào '}
                  {user?.name ? user?.name : user?.email.split('@')[0]}
                </span>
                <svg
                  className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                    }`}
                  width="18"
                  height="20"
                  viewBox="0 0 18 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <Dropdown
                isOpen={isOpen}
                onClose={closeDropdown}
                className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
              >
                <button
                  className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                  onClick={goToProfile}
                >
                  <svg
                    className="fill-gray-500 group-hover:fill-gray-700 dark:group-hover:fill-gray-300"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM12 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor" />
                  </svg>
                  Profile
                </button>

                <button
                  className="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                  onClick={goToOrderHistory}
                >
                  <svg
                    className="fill-gray-500 group-hover:fill-gray-700 dark:group-hover:fill-gray-300"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Icon lịch sử đơn hàng (ví dụ dùng biểu tượng lịch) */}
                    <path d="M7 10H9V12H7V10ZM11 10H13V12H11V10ZM15 10H17V12H15V10ZM19 4H18V2H16V4H8V2H6V4H5C3.9 4 3 4.9 3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20Z" />
                  </svg>
                  Order History
                </button>
                <button
                  className="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                  onClick={handleLogout}
                >
                  <svg
                    className="fill-gray-500 group-hover:fill-gray-700 dark:group-hover:fill-gray-300"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M15.1007 19.247C14.6865 19.247 14.3507 18.9112 14.3507 18.497L14.3507 14.245H12.8507V18.497C12.8507 19.7396 13.8581 20.747 15.1007 20.747H18.5007C19.7434 20.747 20.7507 19.7396 20.7507 18.497L20.7507 5.49609C20.7507 4.25345 19.7433 3.24609 18.5007 3.24609H15.1007C13.8581 3.24609 12.8507 4.25345 12.8507 5.49609V9.74501L14.3507 9.74501V5.49609C14.3507 5.08188 14.6865 4.74609 15.1007 4.74609L18.5007 4.74609C18.9149 4.74609 19.2507 5.08188 19.2507 5.49609L19.2507 18.497C19.2507 18.9112 18.9149 19.247 18.5007 19.247H15.1007ZM3.25073 11.9984C3.25073 12.2144 3.34204 12.4091 3.48817 12.546L8.09483 17.1556C8.38763 17.4485 8.86251 17.4487 9.15549 17.1559C9.44848 16.8631 9.44863 16.3882 9.15583 16.0952L5.81116 12.7484L16.0007 12.7484C16.4149 12.7484 16.7507 12.4127 16.7507 11.9984C16.7507 11.5842 16.4149 11.2484 16.0007 11.2484L5.81528 11.2484L9.15585 7.90554C9.44864 7.61255 9.44847 7.13767 9.15547 6.84488C8.86248 6.55209 8.3876 6.55226 8.09481 6.84525L3.52309 11.4202C3.35673 11.5577 3.25073 11.7657 3.25073 11.9984Z"
                    />
                  </svg>
                  Sign out
                </button>
              </Dropdown>
            </div>
          ) : (
            <Link
              to="/signin"
              className="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Sign In
            </Link>
          )}
          <div className="ml-2 flex flex-row items-center justify-center">
            <Link to="/cart" className="flex items-center gap-1 relative">
              <Badge
                count={cart.length}
                offset={[-5, 5]} // Đẩy badge lên phía trên bên trái icon
                size="small"
                style={{ backgroundColor: '#ff4d4f', fontWeight: 'bold' }} // badge đỏ đậm
                showZero={true} // Hiện số 0 nếu cart rỗng
              >
                <img
                  src="https://cdn.pnj.io/images/image-update/layout/icon-cart-new.svg"
                  alt="icon-cart"
                  className="w-6 h-6"
                />
              </Badge>
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Giỏ hàng
              </span>
            </Link>
          </div>
        </div>
      </div>
      <div className="">
        <Header />
      </div>
    </div>
  );
};

export default MainHeader;
