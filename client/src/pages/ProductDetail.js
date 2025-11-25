import React, { useEffect, useState } from 'react';
import MainLayout from '../layout/MainLayout';
import { useParams, Link, useNavigate } from 'react-router-dom';
import productApi from '../api/productApi';
import DOMPurify from 'dompurify';
import ViewedProducts from '../components/ViewedProducts';
import { useDispatch, useSelector } from 'react-redux';
import ReviewModal from '../components/ReviewMoal';
import { ToastContainer, toast } from 'react-toastify';
import RatingSummary from '../components/RatingSummary';
import ReviewSummaryDetailed from '../components/ReviewSummaryDetailed';
import ReviewSummaryAdmin from '../components/ReviewSummaryAdmin';
import ReviewTabs from '../components/ReviewTabs';
import AddToCartModal from '../components/AddToCartModal';

const ProductDetail = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => ({ ...state }));

  const { slug } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);
  const [isPolicyVisible, setIsPolicyVisible] = useState(false);
  const [isFAQVisible, setIsFAQVisible] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBuyNowModalOpen, setIsBuyNowModalOpen] = useState(false);

  // Toggle các tab nội dung
  const toggleDescription = () => {
    setIsDescriptionVisible(true);
    setIsPolicyVisible(false);
    setIsFAQVisible(false);
  };
  const togglePolicy = () => {
    setIsDescriptionVisible(false);
    setIsPolicyVisible(true);
    setIsFAQVisible(false);
  };
  const toggleFAQ = () => {
    setIsDescriptionVisible(false);
    setIsPolicyVisible(false);
    setIsFAQVisible(true);
  };

  // Lấy chi tiết sản phẩm và sản phẩm tương tự
  const handleGetProduct = async () => {
    try {
      const res = await productApi.getProductBySlug(slug);
      setProduct(res?.product);
      const similarRes = await productApi.getSimilarProducts(res.category_id, res.subcategory_id);
      setSimilarProducts(similarRes);
      // Mặc định bật tab mô tả
      setIsDescriptionVisible(true);
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
    }
  };

  // Load reviews sản phẩm
  const loadReviews = async () => {
    try {
      if (!product) return;
      const data = await productApi.getProductReviews(product.product_id);
      setReviews(data?.reviews);
    } catch (error) {
      console.error(error);
    }
  };

  // Lấy tóm tắt đánh giá
  const getRatingSummary = async () => {
    try {
      if (!product) return;

      // Nếu user là admin, gọi endpoint admin (có sentiment + suspicious)
      if (user?.role === 'admin' || user?.role === 'staff') {
        const res = await productApi.getProductReviewSummaryAdmin(product.product_id, user?.token);
        setReviewSummary(res?.data);
      } else {
        // Khách hàng thường gọi endpoint public (chỉ rating)
        const res = await productApi.getProductReviewSummaryPublic(product.product_id);
        setReviewSummary(res?.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Thêm vào giỏ hàng
  const handleAddToCart = (count) => {
    if (!product) return;
    const updatedItem = { ...product, count };
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    const existIndex = cart.findIndex((item) => item.product_id === product.product_id);
    if (existIndex >= 0) {
      cart[existIndex].count += count;
    } else {
      cart.push(updatedItem);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    dispatch({ type: 'ADD_TO_CART', payload: updatedItem });
    toast.success('Đã thêm vào giỏ hàng thành công!');
  };

  // Mua ngay
  const handleBuyNow = (count) => {
    if (!product) return;
    const selectedItems = [{ ...product, count }];
    const total = product.price * count;

    navigate('/checkout', {
      state: { selectedItems, totalAmount: total },
    });
    setIsBuyNowModalOpen(false);
  };

  // Gửi đánh giá
  const handleSubmitReview = async (review) => {
    try {
      await productApi.addProductReview(
        product?.product_id,
        { user_id: user.id, ...review },
        user?.token,
      );
      toast.success('Đánh giá đã gửi thành công!');
      setIsReviewModalOpen(false);
      loadReviews();
      getRatingSummary();
    } catch (error) {
      toast.error('Gửi đánh giá thất bại');
    }
  };

  // Lưu sản phẩm đã xem vào localStorage
  useEffect(() => {
    if (!product) return;
    const viewed = JSON.parse(localStorage.getItem('viewedProducts') || '[]');
    const filtered = viewed.filter((p) => p.product_id !== product.product_id);
    filtered.unshift({
      product_id: product.product_id,
      product_name: product.product_name,
      price: product.price,
      image_url: product.ProductImages?.[0]?.image_url || '',
    });
    if (filtered.length > 10) filtered.pop();
    localStorage.setItem('viewedProducts', JSON.stringify(filtered));
  }, [product]);

  useEffect(() => {
    handleGetProduct();
  }, [slug]);

  useEffect(() => {
    loadReviews();
    getRatingSummary();
  }, [product?.product_id]);

  if (!product)
    return (
      <MainLayout>
        <div className="text-center py-20">Đang tải...</div>
      </MainLayout>
    );

  const benefitItems = [
    {
      title: 'MIỄN PHÍ',
      subtitle: 'VẬN CHUYỂN',
      icon: 'https://cdn.pnj.io/images/2023/relayout-pdp/shipping-icon.svg',
      tooltip: (
        <>
          <strong>Miễn phí giao hàng trong 3 giờ.</strong> Nếu giao trễ, tặng ngay voucher 100k cho
          lần mua hàng tiếp theo.
        </>
      ),
    },
    {
      title: 'PHỤC VỤ 24/7',
      subtitle: '',
      icon: 'https://cdn.pnj.io/images/2023/relayout-pdp/shopping%20247-icon.svg',
      tooltip: <>Khách hàng có thể xem, đặt hàng và thanh toán 24/7 tại website PNJ.</>,
    },
    {
      title: 'THU ĐỔI 48H',
      subtitle: '',
      icon: 'https://cdn.pnj.io/images/2023/relayout-pdp/thudoi-icon.svg',
      tooltip: (
        <>
          <strong>
            Áp dụng đổi 48 giờ đối với trang sức vàng và 72 giờ đối với trang sức bạc (chỉ đổi
            size).
          </strong>
          <br />
          Tính từ lúc cửa hàng xuất hóa đơn (nhận tại cửa hàng) hoặc khi khách hàng nhận được sản
          phẩm (giao hàng tận nơi).
        </>
      ),
    },
  ];

  return (
    <MainLayout>
      <ToastContainer />
      <div className="max-w-[1500px] mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Hình ảnh sản phẩm */}
          <section>
            <img
              src={
                product.ProductImages.length > 0
                  ? product.ProductImages[0].image_url
                  : 'http://cdn.pnj.io/images/thumbnails/485/485/detailed/47/sbxm00k000141-bong-tai-bac-pnjsilver.png'
              }
              alt={product.product_name}
              className="w-full rounded-lg shadow-md mb-4 object-contain max-h-[500px]"
            />
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {product.ProductImages.map((image) => (
                <img
                  key={image.image_id}
                  src={image.image_url}
                  alt={image.alt_text || product.product_name}
                  className="w-20 h-20 object-cover rounded cursor-pointer flex-shrink-0"
                />
              ))}
            </div>
          </section>

          {/* Thông tin sản phẩm */}
          <section className="flex flex-col">
            <h1 className="text-3xl font-semibold mb-4">{product.product_name}</h1>
            <p className="text-2xl font-bold text-red-700 mb-3">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(product.price)}
            </p>
            <p className="mb-3 text-gray-700">Số lượng còn lại: {product.quantity}</p>

            {/* Benefit items */}
            <div className="flex mt-[10px] items-center bg-[#f2f2f2] sm:px-[10px] px-[5px] py-[5px] rounded-md justify-between">
              {benefitItems.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center sm:text-[13px] text-[9px] cursor-pointer group"
                >
                  <img
                    alt={item.title}
                    loading="lazy"
                    width="25px"
                    height="25px"
                    decoding="async"
                    className="w-4 h-4"
                    src={item.icon}
                  />
                  <p className="text-[#202E65] font-bold">
                    {item.title} {item.subtitle && <span>{item.subtitle}</span>}
                  </p>
                  {/* Tooltip */}
                  <div className="absolute hidden group-hover:block bg-white border border-gray-300 p-2 rounded text-xs text-gray-700 max-w-xs z-10 mt-1 shadow-lg">
                    {item.tooltip}
                  </div>
                </div>
              ))}
            </div>

            {/* Nút hành động */}
            <div className="flex items-center">
              <button
                className="w-full bg-[#ad2a36] flex justify-center items-center flex-col font-bold text-white rounded-lg mt-[10px] p-2"
                onClick={() => setIsBuyNowModalOpen(true)}
              >
                <span className="text-[16px]">Mua ngay</span>
                <span className="text-[12px]">
                  (Giao hàng miễn phí tận nhà hoặc nhận tại cửa hàng)
                </span>
              </button>
            </div>
            <div className="flex justify-center items-center gap-2 my-[10px]">
              <div className="flex items-center  space-x-4 flex-1">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full border border-[#202E65] flex flex-col justify-center items-center font-bold text-[#202E65] h-[40px] rounded-lg"
                >
                  <span className="text-[13px]">Thêm vào giỏ hàng</span>
                </button>
              </div>
              <div className="flex gap-5 flex-1">
                <a
                  href="#"
                  className="flex-1 w-full md:w-6/12 xl:w-full bg-[#202e65] h-[40px] text-white font-bold rounded-lg flex flex-col items-center justify-center "
                >
                  <span className="text-[16px]">Gọi ngay (miễn phí)</span>
                  <span className="text-[12px]">((Nhận ngay ưu đãi))</span>
                </a>
              </div>
            </div>
          </section>
        </div>
        <div className="prose max-w-none text-gray-700 dark:text-gray-300 mb-8 mt-2">
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product?.description) }} />
        </div>

        {/* Viewed products */}
        <ViewedProducts />

        {/* Reviews & rating */}
        <section className="max-w-[1500px] mx-auto mt-8 px-4 md:px-0">
          {user && (
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="mb-6 bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 font-semibold transition"
            >
              Viết đánh giá của bạn
            </button>
          )}

          {/* Hiển thị summary dựa trên role */}
          {reviewSummary &&
            (user?.role === 'admin' || user?.role === 'staff' ? (
              <ReviewSummaryAdmin summary={{ data: reviewSummary }} />
            ) : (
              <ReviewSummaryDetailed summary={{ data: reviewSummary }} />
            ))}

          {reviews && reviews.length > 0 && <ReviewTabs reviews={reviews} />}
        </section>

        {/* Modals */}
        {isReviewModalOpen && (
          <ReviewModal
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            onSubmit={handleSubmitReview}
          />
        )}
        {isBuyNowModalOpen && (
          <AddToCartModal
            product={product}
            onClose={() => setIsBuyNowModalOpen(false)}
            onConfirm={handleBuyNow}
          />
        )}
        {isAddModalOpen && (
          <AddToCartModal
            product={product}
            onClose={() => setIsAddModalOpen(false)}
            onConfirm={handleAddToCart}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default ProductDetail;
