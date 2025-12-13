import React, { useEffect, useMemo, useState } from 'react';
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
import LightboxViewer from '../components/LightboxViewer';
import { AiOutlineShoppingCart, AiOutlinePhone } from 'react-icons/ai';
import ThreeDViewer from '../components/ThreeDViewer';

// Map all GLB assets by slug (filename without extension)
const modelImports = import.meta.glob('../assets/3d/*.glb', {
  eager: true,
  import: 'default',
});
const MODEL_MAP = Object.entries(modelImports).reduce((acc, [path, url]) => {
  const match = path.match(/\/([^/]+)\.glb$/);
  if (match) {
    acc[match[1]] = url;
  }
  return acc;
}, {});

const ProductDetail = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => ({ ...state }));

  const { slug } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(true);
  const [isPolicyVisible, setIsPolicyVisible] = useState(false);
  const [isFAQVisible, setIsFAQVisible] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBuyNowModalOpen, setIsBuyNowModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxRotate, setLightboxRotate] = useState(0);

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

  useEffect(() => {
    setSelectedMediaIndex(0);
    setLightboxImageIndex(0);
  }, [product?.product_id, slug]);

  useEffect(() => {
    handleGetProduct();
  }, [slug]);

  useEffect(() => {
    loadReviews();
    getRatingSummary();
  }, [product?.product_id]);

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

  const modelPath = useMemo(() => MODEL_MAP[slug] || null, [slug]);

  const mediaItems = useMemo(() => {
    const items =
      product?.ProductImages?.map((image, idx) => ({
        id: image.image_id ?? `img-${idx}`,
        type: 'image',
        image,
      })) || [];

    if (modelPath) {
      items.push({
        id: `model-${slug}`,
        type: 'model',
        label: 'Xem 3D',
        modelPath,
      });
    }

    return items;
  }, [modelPath, product?.ProductImages]);

  const imageItems = useMemo(() => mediaItems.filter((item) => item.type === 'image'), [mediaItems]);
  const safeSelectedIndex = selectedMediaIndex < mediaItems.length ? selectedMediaIndex : 0;
  const selectedMedia = mediaItems[safeSelectedIndex] || imageItems[0] || null;

  if (!product)
    return (
      <MainLayout>
        <div className="text-center py-20">Đang tải...</div>
      </MainLayout>
    );

  return (
    <MainLayout>
      <ToastContainer />

      {/* Breadcrumb */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
        <div className="max-w-[1500px] mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-blue-600 font-medium">
              Trang chủ
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700 font-medium truncate">{product.product_name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto p-4 md:p-8">
        {/* Main Product Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-12">
          <section className="flex flex-col gap-4">
            {/* Main Image with hover zoom */}
            <div
              className={`relative bg-white rounded-xl shadow-sm overflow-hidden group ${
                selectedMedia?.type === 'image' ? 'cursor-zoom-in' : 'cursor-default'
              }`}
              onClick={() => {
                if (selectedMedia?.type !== 'image') return;
                const targetIndex = imageItems.findIndex((item) => item.id === selectedMedia.id);
                setLightboxImageIndex(targetIndex >= 0 ? targetIndex : 0);
                setIsLightboxOpen(true);
              }}
            >
              <div className="w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                {selectedMedia?.type === 'model' ? (
                  <ThreeDViewer modelPath={selectedMedia.modelPath} />
                ) : (
                  <>
                    <img
                      src={
                        selectedMedia?.image?.image_url ||
                        product.ProductImages?.[0]?.image_url ||
                        'http://cdn.pnj.io/images/thumbnails/485/485/detailed/47/sbxm00k000141-bong-tai-bac-pnjsilver.png'
                      }
                      alt={product.product_name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                    />
                    {/* Zoom indicator */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="bg-white rounded-full p-3 shadow-lg">
                        <svg
                          className="w-6 h-6 text-gray-800"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                          />
                        </svg>
                      </div>
                    </div>
                  </>
                )}
              </div>
              {/* In stock badge */}
              <div
                className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold text-white ${
                  product.quantity > 0 ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                {product.quantity > 0 ? 'Còn hàng' : 'Hết hàng'}
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {mediaItems.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {mediaItems.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedMediaIndex(idx);
                      if (item.type === 'image') {
                        const targetIndex = imageItems.findIndex((imgItem) => imgItem.id === item.id);
                        setLightboxImageIndex(targetIndex >= 0 ? targetIndex : 0);
                      }
                    }}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all hover:shadow-lg ${
                      safeSelectedIndex === idx
                        ? 'border-blue-600 shadow-md'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {item.type === 'image' ? (
                      <img
                        src={item.image.image_url}
                        alt="thumbnail"
                        className="w-full h-full object-cover hover:scale-110 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold text-xs flex items-center justify-center">
                        3D VIEW
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Right: Product Info */}
          <section className="flex flex-col">
            {/* Title & Rating */}
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">
                {product.product_name}
              </h1>
              {reviewSummary && reviewSummary.total_reviews > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={
                          i < Math.round(reviewSummary.avg_rating || 0)
                            ? 'text-yellow-400 text-lg'
                            : 'text-gray-300 text-lg'
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    ({reviewSummary.total_reviews || 0} đánh giá)
                  </span>
                </div>
              )}
              {(!reviewSummary || reviewSummary.total_reviews === 0) && (
                <p className="text-sm text-gray-500 italic">Chưa có đánh giá</p>
              )}
            </div>

            {/* Price Section */}
            {product.quantity > 0 ? (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
                <p className="text-gray-600 text-sm mb-2">Giá bán</p>
                <p className="text-4xl font-bold text-red-600 mb-2">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(product.price)}
                </p>
                <p className="text-sm text-gray-600">
                  Số lượng còn lại:{' '}
                  <span className="font-semibold text-green-600">{product.quantity}</span> sản phẩm
                </p>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 mb-6 border-2 border-red-300">
                <p className="text-2xl font-bold text-red-600">Hết hàng</p>
                <p className="text-sm text-red-500 mt-2">Sản phẩm này hiện không có sẵn</p>
              </div>
            )}

            {/* Benefit Items */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { title: 'MIỄN PHÍ\nVẬN CHUYỂN', icon: '🚚', color: 'blue' },
                { title: 'PHỤC VỤ\n24/7', icon: '📞', color: 'green' },
                { title: 'THU ĐỔI\n48H', icon: '🔄', color: 'purple' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`bg-${item.color}-50 rounded-lg p-4 text-center border border-${item.color}-100 hover:shadow-md transition`}
                >
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="text-xs font-semibold text-gray-800 whitespace-pre-line leading-tight">
                    {item.title}
                  </p>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                disabled={product.quantity === 0}
                className={`w-full font-bold rounded-xl py-4 transition-all shadow-lg flex flex-col justify-center items-center ${
                  product.quantity > 0
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white hover:shadow-xl transform hover:scale-105 cursor-pointer'
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60'
                }`}
                onClick={() => product.quantity > 0 && setIsBuyNowModalOpen(true)}
              >
                <span className="text-lg">Mua ngay</span>
                <span className="text-xs opacity-90">Giao hàng miễn phí tận nhà</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={product.quantity === 0}
                  onClick={() => product.quantity > 0 && setIsAddModalOpen(true)}
                  className={`flex items-center justify-center gap-2 font-bold rounded-xl py-3 transition-all ${
                    product.quantity > 0
                      ? 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 cursor-pointer'
                      : 'border-2 border-gray-300 text-gray-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <AiOutlineShoppingCart className="text-xl" />
                  <span>Giỏ hàng</span>
                </button>
                <a
                  href={product.quantity > 0 ? 'tel:1900123456' : '#'}
                  className={`flex items-center justify-center gap-2 font-bold rounded-xl py-3 transition-all ${
                    product.quantity > 0
                      ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                      : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60'
                  }`}
                  onClick={(e) => product.quantity === 0 && e.preventDefault()}
                >
                  <AiOutlinePhone className="text-xl" />
                  <span>Gọi ngay</span>
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* Specifications Section */}
        {product && (
          <div className="mb-12 bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-3xl">📦</span>
              Thông số kỹ thuật
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {product.product_details && typeof product.product_details === 'string'
                ? (() => {
                    try {
                      const details = JSON.parse(product.product_details);
                      return Object.entries(details).map(([key, value], idx) => (
                        <div
                          key={idx}
                          className="flex gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:shadow-md transition"
                        >
                          <div className="text-2xl flex-shrink-0">
                            {['Loại đá', 'Chất liệu', 'Màu'].some((k) => key.includes(k))
                              ? '💎'
                              : ['Kích thước', 'Cân nặng'].some((k) => key.includes(k))
                                ? '⚖️'
                                : ['Phương pháp', 'Bảo hành'].some((k) => key.includes(k))
                                  ? '🛡️'
                                  : '✓'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{key}</p>
                            <p className="text-sm text-gray-700 mt-1 break-words">
                              {String(value)}
                            </p>
                          </div>
                        </div>
                      ));
                    } catch (e) {
                      return null;
                    }
                  })()
                : null}
            </div>
          </div>
        )}

        {/* Tabs Section: Description, Policy, FAQ */}
        <div className="mb-12">
          {/* Tab Buttons */}
          <div className="flex gap-1 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-xl p-1 mb-0">
            <button
              onClick={toggleDescription}
              className={`px-6 py-3 font-bold text-base rounded-t-lg transition-all duration-300 ${
                isDescriptionVisible
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              📋 Mô tả sản phẩm
            </button>
            <button
              onClick={togglePolicy}
              className={`px-6 py-3 font-bold text-base rounded-t-lg transition-all duration-300 ${
                isPolicyVisible
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              🛡️ Chính sách
            </button>
            <button
              onClick={toggleFAQ}
              className={`px-6 py-3 font-bold text-base rounded-t-lg transition-all duration-300 ${
                isFAQVisible
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              ❓ Câu hỏi thường gặp
            </button>
          </div>

          {/* Tab Content */}
          {isDescriptionVisible && (
            <div className="bg-white rounded-b-xl shadow-md border-t-0 overflow-hidden">
              <div className="p-8 max-w-4xl">
                <div
                  className="prose prose-sm sm:prose-base lg:prose-lg max-w-none
                  prose-headings:font-bold prose-headings:text-gray-900
                  prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                  prose-h1:mt-6 prose-h2:mt-5 prose-h3:mt-4 prose-h1:mb-4 prose-h2:mb-3 prose-h3:mb-2
                  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                  prose-li:text-gray-700 prose-li:leading-relaxed
                  prose-strong:text-gray-900 prose-strong:font-bold
                  prose-em:text-gray-800
                  prose-img:rounded-lg prose-img:shadow-md prose-img:my-4
                  prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:pl-4 prose-blockquote:italic
                  prose-a:text-blue-600 prose-a:font-medium hover:prose-a:text-blue-800
                  prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-red-600
                  prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:p-4
                  prose-hr:border-gray-200 prose-hr:my-6
                  prose-table:border-collapse prose-table:w-full
                  prose-th:bg-gray-100 prose-th:padding-3 prose-th:text-left prose-th:font-bold
                  prose-td:border prose-td:border-gray-200 prose-td:padding-3
                "
                >
                  <div
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product?.description) }}
                  />
                </div>
              </div>
            </div>
          )}

          {isPolicyVisible && (
            <div className="bg-white rounded-b-xl shadow-md p-8 border-t-0">
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">📦</span>
                    Chính sách giao hàng
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    Miễn phí giao hàng trong 3 giờ cho các đơn hàng trong khu vực nội thành. Nếu
                    giao trễ, tặng ngay voucher 100,000đ cho lần mua hàng tiếp theo.
                  </p>
                </div>
                <hr className="border-gray-200" />
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🔄</span>
                    Chính sách đổi trả
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    Áp dụng đổi 48 giờ đối với trang sức vàng và 72 giờ đối với trang sức bạc (chỉ
                    đổi size). Tính từ lúc cửa hàng xuất hóa đơn hoặc khi khách hàng nhận được sản
                    phẩm.
                  </p>
                </div>
                <hr className="border-gray-200" />
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">💳</span>
                    Phương thức thanh toán
                  </h4>
                  <ul className="text-gray-700 space-y-2">
                    <li>✓ Thanh toán khi nhận hàng (COD)</li>
                    <li>✓ Thanh toán qua VNPay</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {isFAQVisible && (
            <div className="bg-white rounded-b-xl shadow-md p-8 border-t-0">
              <div className="space-y-4">
                {[
                  {
                    q: 'Sản phẩm có bảo hành không?',
                    a: 'Có, tất cả sản phẩm đều có bảo hành 1 năm từ ngày mua. Nếu có lỗi kỹ thuật, chúng tôi sẽ thay thế miễn phí.',
                  },
                  {
                    q: 'Làm thế nào để kiểm tra tính chính hãng?',
                    a: 'Tất cả sản phẩm của chúng tôi đều được nhập khẩu trực tiếp từ nhà sản xuất. Mỗi sản phẩm đều có giấy chứng nhận bảo hành chính hãng.',
                  },
                  {
                    q: 'Có thể trả lại nếu không hài lòng không?',
                    a: 'Có thể trả lại trong vòng 48 giờ từ khi nhận hàng với điều kiện sản phẩm còn nguyên vẹn và chưa qua sử dụng.',
                  },
                  {
                    q: 'Giao hàng đến các tỉnh thành khác?',
                    a: 'Có, chúng tôi giao hàng khắp các tỉnh thành trên cả nước. Chi phí vận chuyển sẽ được tính dựa trên khoảng cách.',
                  },
                ].map((item, idx) => (
                  <details
                    key={idx}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer group"
                  >
                    <summary className="font-bold text-gray-900 flex items-center justify-between">
                      <span>{item.q}</span>
                      <span className="text-blue-600 group-open:rotate-180 transition-transform">
                        ▼
                      </span>
                    </summary>
                    <p className="text-gray-700 mt-3 leading-relaxed">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <section className="bg-white rounded-xl shadow-sm p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Đánh giá sản phẩm</h2>

          {user && (
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="mb-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition shadow-md hover:shadow-lg"
            >
              ✍️ Viết đánh giá của bạn
            </button>
          )}

          {reviewSummary &&
            (user?.role === 'admin' || user?.role === 'staff' ? (
              <ReviewSummaryAdmin summary={{ data: reviewSummary }} />
            ) : (
              <ReviewSummaryDetailed summary={{ data: reviewSummary }} />
            ))}

          {reviews && reviews.length > 0 && <ReviewTabs reviews={reviews} />}
        </section>

        {/* Viewed Products */}
        <ViewedProducts />

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

        {/* Lightbox Viewer */}
        <LightboxViewer
          isOpen={isLightboxOpen}
          images={imageItems.map((item) => item.image)}
          currentIndex={lightboxImageIndex}
          zoom={lightboxZoom}
          rotate={lightboxRotate}
          onClose={() => {
            setIsLightboxOpen(false);
            setLightboxZoom(1);
            setLightboxRotate(0);
          }}
          onPrevImage={() =>
            setLightboxImageIndex((p) =>
              !imageItems.length ? 0 : p === 0 ? imageItems.length - 1 : p - 1,
            )
          }
          onNextImage={() =>
            setLightboxImageIndex((p) =>
              !imageItems.length ? 0 : p === imageItems.length - 1 ? 0 : p + 1,
            )
          }
          onSelectImage={(idx) => {
            setLightboxImageIndex(idx);
            setLightboxZoom(1);
            setLightboxRotate(0);
          }}
          onZoomIn={() => setLightboxZoom(Math.min(3, lightboxZoom + 0.2))}
          onZoomOut={() => setLightboxZoom(Math.max(0.5, lightboxZoom - 0.2))}
          onRotate={() => setLightboxRotate((prev) => (prev + 90) % 360)}
          onReset={() => {
            setLightboxZoom(1);
            setLightboxRotate(0);
          }}
        />
      </div>
    </MainLayout>
  );
};

export default ProductDetail;
