import React, { useEffect, useState } from "react";
import promotionApi from "../api/promotionApi"; // import api khuyến mãi của bạn
import MainLayout from "../layout/MainLayout";
import dayjs from "dayjs";
const PromotionsPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        // Kiểm tra xem người dùng đã đăng nhập chưa
        const user = JSON.parse(localStorage.getItem("user"));
        const token = user?.token;
        
        if (token) {
          setIsLoggedIn(true);
          // Lấy danh sách mã khuyến mãi riêng của khách hàng
          const data = await promotionApi.getCustomerPromotions(token);
          setPromotions(data);
        } else {
          setIsLoggedIn(false);
          setError("Đăng nhập để xem các mã khuyến mãi dành riêng cho bạn.");
        }
      } catch (err) {
        setError("Lỗi khi tải danh sách khuyến mãi.");
      } finally {
        setLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  const startDateBodyTemplate = (rowData) => {
    const start_date = rowData.start_date;
    return (
      <div>
        {start_date ? (
          <p className="text-gray-700">
            {dayjs(start_date).format("DD/MM/YYYY ")}
          </p>
        ) : (
          <p className="text-gray-700"></p>
        )}
      </div>
    );
  };

  const endDateBodyTemplate = (rowData) => {
    const endDate = rowData.end_date;
    return (
      <div>
        {endDate ? (
          <p className="text-gray-700">
            {dayjs(endDate).format("DD/MM/YYYY ")}
          </p>
        ) : (
          <p className="text-gray-700"></p>
        )}
      </div>
    );
  };

  if (loading)
    return (
      <MainLayout>
        <div className="p-8">Đang tải khuyến mãi...</div>
      </MainLayout>
    );
  if (error)
    return (
      <MainLayout>
        <div className="p-8">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </MainLayout>
    );

  return (
    <MainLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">
          Danh sách Mã Khuyến Mãi Của Bạn
        </h1>
        {promotions.length === 0 ? (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            Hiện tại bạn chưa có mã khuyến mãi nào.
          </div>
        ) : (
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left">Mã giảm giá</th>
                <th className="border px-4 py-2 text-left">Phần trăm giảm</th>
                <th className="border px-4 py-2 text-left">Ngày bắt đầu</th>
                <th className="border px-4 py-2 text-left">Ngày kết thúc</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((promo) => (
                <tr key={promo.id || promo.promotion_id}>
                  <td className="border px-4 py-2">{promo.promotion_code}</td>
                  <td className="border px-4 py-2">{promo.discount}%</td>
                  <td className="border px-4 py-2">
                    {promo.campaign?.start_date ? dayjs(promo.campaign.start_date).format("DD/MM/YYYY") : "-"}
                  </td>
                  <td className="border px-4 py-2">
                    {promo.campaign?.end_date ? dayjs(promo.campaign.end_date).format("DD/MM/YYYY") : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </MainLayout>
  );
};

export default PromotionsPage;
