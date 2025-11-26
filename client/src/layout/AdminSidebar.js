import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useSidebar } from '../context/SidebarContext';

import DashboardIcon from '@mui/icons-material/Dashboard';
import Inventory2Icon from '@mui/icons-material/Inventory2'; // icon hộp sản phẩm
import CategoryIcon from '@mui/icons-material/Category';
import LocalOfferIcon from '@mui/icons-material/LocalOffer'; // icon khuyến mãi
import ListAltIcon from '@mui/icons-material/ListAlt'; // icon đơn hàng
import PeopleIcon from '@mui/icons-material/People'; // icon khách hàng
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // user profile
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'; // bank account
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import NewspaperIcon from '@mui/icons-material/Newspaper'; // icon tin tức
import RateReviewIcon from '@mui/icons-material/RateReview'; // icon đánh giá

const allNavItems = [
  {
    icon: <Inventory2Icon fontSize="medium" />,
    name: 'Product',
    path: '/admin/products',
  },
  {
    icon: <CategoryIcon fontSize="medium" />,
    name: 'Category',
    path: '/admin/categories',
  },
  {
    icon: <CategoryIcon fontSize="medium" />,
    name: 'Subcategory',
    path: '/admin/subcategories',
  },
  {
    icon: <LocalOfferIcon fontSize="medium" />,
    name: 'Campaign',
    path: '/admin/campaigns',
  },
  {
    icon: <LocalOfferIcon fontSize="medium" />,
    name: 'Promotion',
    path: '/admin/promotions',
  },
  {
    icon: <LocalOfferIcon fontSize="medium" />,
    name: 'Promotion Logs',
    path: '/admin/promotion-logs',
  },
  {
    icon: <NewspaperIcon fontSize="medium" />,
    name: 'News',
    path: '/admin/news',
  },
  {
    icon: <RateReviewIcon fontSize="medium" />,
    name: 'Reviews',
    path: '/admin/reviews',
  },
  {
    icon: <ListAltIcon fontSize="medium" />,
    name: 'Order',
    path: '/admin/orders',
  },
  {
    icon: <DashboardIcon fontSize="medium" />,
    name: 'Dashboard',
    path: '/admin/dashboard',
    rolesAllowed: [1],
  },
  {
    icon: <PeopleIcon fontSize="medium" />,
    name: 'Customer',
    path: '/admin/customers',
  },
  {
    icon: <AccountCircleIcon fontSize="medium" />,
    name: 'User Profile',
    path: '/admin/user',
    rolesAllowed: [1],
  },
  {
    icon: <AccountBalanceIcon fontSize="medium" />,
    name: 'Bank Account',
    path: '/admin/bank-accounts',
    rolesAllowed: [1], // chỉ admin xem được
  },
];

// Hàm lọc menu theo role (giữ nguyên)
const filterNavItemsByRole = (items, roleId) => {
  return items.filter((item) => {
    if (item.rolesAllowed && Array.isArray(item.rolesAllowed)) {
      return item.rolesAllowed.includes(roleId);
    }
    return true;
  });
};

const AdminSidebar = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  // Lấy user từ redux
  const { user } = useSelector((state) => ({ ...state }));

  // Memo navItems theo user.role_id
  const navItems = useMemo(() => {
    let filtered = filterNavItemsByRole(allNavItems, user?.role_id);
    if (user?.role_id === 3) {
      // staff ẩn Dashboard
      filtered = filtered.filter((item) => item.name !== 'Dashboard');
    }
    return filtered;
  }, [user?.role_id]);

  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [subMenuHeight, setSubMenuHeight] = useState({});
  const subMenuRefs = useRef({});

  // Kiểm tra active path
  const isActive = useCallback((path) => location.pathname.startsWith(path), [location.pathname]);

  useEffect(() => {
    let submenuMatched = false;
    ['main'].forEach((menuType) => {
      navItems.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType,
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive, navItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index, menuType) => {
    setOpenSubmenu((prev) => {
      if (prev && prev.type === menuType && prev.index === index) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items, menuType) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? 'menu-item-active'
                  : 'menu-item-inactive'
              } cursor-pointer ${
                !isExpanded && !isHovered ? 'lg:justify-center' : 'lg:justify-start'
              }`}
            >
              <span
                className={`menu-item-icon-size ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? 'menu-item-icon-active'
                    : 'menu-item-icon-inactive'
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ExpandMoreIcon
                  className={`ml-auto transition-transform duration-200 ${
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? 'rotate-180 text-brand-500'
                      : ''
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? 'menu-item-active' : 'menu-item-inactive'
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path) ? 'menu-item-icon-active' : 'menu-item-icon-inactive'
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : '0px',
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? 'menu-dropdown-item-active'
                          : 'menu-dropdown-item-inactive'
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? 'menu-dropdown-badge-active'
                                : 'menu-dropdown-badge-inactive'
                            } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? 'menu-dropdown-badge-active'
                                : 'menu-dropdown-badge-inactive'
                            } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
      ${isExpanded || isMobileOpen ? 'w-[290px]' : isHovered ? 'w-[290px]' : 'w-[90px]'}
      ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${!isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start'}`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="https://cdn.pnj.io/images/logo/pnj.com.vn.png"
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="https://cdn.pnj.io/images/logo/pnj.com.vn.png"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="https://cdn.pnj.io/images/logo/pnj.com.vn.png"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start'
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  'Menu'
                ) : (
                  <MoreHorizIcon fontSize="medium" />
                )}
              </h2>
              {renderMenuItems(navItems, 'main')}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AdminSidebar;
