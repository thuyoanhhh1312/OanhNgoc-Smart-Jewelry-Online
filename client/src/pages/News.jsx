import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import newsApi from '../api/newsApi';
import newsCategoryApi from '../api/newsCategoryApi';
import MainLayout from '../layout/MainLayout';

const News = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [tempSearchQuery, setTempSearchQuery] = useState('');

  const LIMIT = 12; // 12 bài/trang

  // Search suggestions
  const searchSuggestions = [
    'Kim cương',
    'Vàng',
    'Bạc',
    'Đầu tư',
    'Phong cách',
    'Cưới',
    'Phụ nữ',
    'Trẻ em',
  ];

  // Load categories
  const loadCategories = async () => {
    try {
      const data = await newsCategoryApi.getNewsCategories();
      setCategories(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error('Lỗi lấy danh mục:', error);
    }
  };

  // Load published news
  const fetchNews = async (page = 1, category = '', query = '') => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: LIMIT,
        status: 'published', // Chỉ lấy bài đã xuất bản
      };
      if (category) {
        params.article_category_id = category;
      }
      if (query) {
        params.q = query;
      }

      const response = await newsApi.getNews(params);
      setNews(Array.isArray(response?.data) ? response?.data : []);
      setTotalPages(response?.meta?.total ? Math.ceil(response.meta.total / LIMIT) : 1);
      setCurrentPage(page);
    } catch (error) {
      console.error('Lỗi lấy danh sách bài viết:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    fetchNews(currentPage, selectedCategory, searchQuery);
  }, [currentPage, selectedCategory, searchQuery]);

  // Handle search modal submit
  const handleSearchModalSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(tempSearchQuery);
    setCurrentPage(1);
    fetchNews(1, selectedCategory, tempSearchQuery);
    setSearchParams({ category: selectedCategory, q: tempSearchQuery });
    setShowSearchModal(false);
    setTempSearchQuery('');
  };

  // Handle suggestion click in modal
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setCurrentPage(1);
    fetchNews(1, selectedCategory, suggestion);
    setSearchParams({ category: selectedCategory, q: suggestion });
    setShowSearchModal(false);
    setTempSearchQuery('');
  };

  // Handle category filter
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
    setSearchParams({ category: categoryId, q: searchQuery });
  };

  // Render article card
  const ArticleCard = ({ article }) => {
    const excerpt = article.excerpt || article.content || '';
    const text = (excerpt || '').replace(/<[^>]*>/g, '').substring(0, 120);
    const imageUrl = article.thumbnail_url || '/placeholder-news.jpg';

    return (
      <div className="bg-white rounded-xl shadow-sm hover:shadow-xl overflow-hidden transition-all duration-300 group border border-gray-100">
        {/* Thumbnail */}
        <div className="h-48 overflow-hidden bg-gray-200 relative">
          <img
            src={imageUrl}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          {/* View Count Badge */}
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            👁 {article.view_count || 0}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Category & Date */}
          <div className="flex justify-between items-center mb-3">
            <span className="inline-block text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full uppercase tracking-wide">
              {article.category?.category_name || '📰 Tin tức'}
            </span>
            <span className="text-xs text-gray-400 font-medium">
              📅 {dayjs(article.published_at).format('DD/MM/YYYY')}
            </span>
          </div>

          {/* Title */}
          <Link to={`/news/${article.slug}`}>
            <h3 className="font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition text-lg">
              {article.title}
            </h3>
          </Link>

          {/* Excerpt */}
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{text}...</p>

          {/* Read More */}
          <Link to={`/news/${article.slug}`}>
            <button className="text-blue-600 text-sm font-bold hover:text-blue-800 group-hover:translate-x-1 transition-transform inline-flex items-center gap-2">
              Đọc thêm <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </Link>
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header Banner */}
          <div className="mb-10 text-center">
            <div className="inline-block mb-3">
              <span className="text-6xl">📰</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Tin Tức & Blog</h1>
            <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Khám phá những bài viết mới nhất về trang sức, phong cách sống và các xu hướng thời
              trang
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="mb-8">
            {/* Compact Search Button - PNJ Style */}
            <div className="mb-5 flex justify-center">
              <button
                onClick={() => {
                  setShowSearchModal(true);
                  setTempSearchQuery(searchQuery);
                }}
                className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-300 rounded-full hover:border-blue-400 hover:shadow-lg transition-all duration-300 flex items-center gap-2 text-gray-600 font-medium text-base"
              >
                <span className="text-lg">🔍</span>
                <span>Tìm kiếm nhanh</span>
              </button>
            </div>

            {/* Search Modal */}
            {showSearchModal && (
              <div
                className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 pt-20"
                onClick={() => setShowSearchModal(false)}
              >
                <div
                  className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-800">Tìm kiếm bài viết</h2>
                      <button
                        onClick={() => setShowSearchModal(false)}
                        className="text-gray-400 hover:text-gray-600 text-xl"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Search Input in Modal */}
                    <form onSubmit={handleSearchModalSubmit}>
                      <input
                        type="text"
                        placeholder="Nhập từ khóa..."
                        value={tempSearchQuery}
                        onChange={(e) => setTempSearchQuery(e.target.value)}
                        autoFocus
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </form>
                  </div>

                  {/* Suggestions List */}
                  <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                    <p className="text-xs font-semibold text-gray-500 uppercase px-2 mb-3">
                      Tìm kiếm phổ biến
                    </p>
                    {searchSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200 font-medium"
                      >
                        <span className="flex items-center gap-3">
                          <span className="text-gray-400">🔍</span>
                          {suggestion}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Modal Footer */}
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 rounded-b-2xl flex gap-3">
                    <button
                      onClick={() => setShowSearchModal(false)}
                      className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition"
                    >
                      Đóng
                    </button>
                    <button
                      onClick={handleSearchModalSubmit}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition"
                    >
                      Tìm kiếm
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form className="space-y-4">
              {/* Category Filter */}
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <label className="block text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
                  📂 Danh mục:
                </label>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('')}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                      selectedCategory === ''
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Tất cả
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.article_category_id}
                      type="button"
                      onClick={() => handleCategoryChange(cat.article_category_id)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                        selectedCategory === String(cat.article_category_id)
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat.category_name}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <p className="text-gray-600">Đang tải bài viết...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && news.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-600">Không tìm thấy bài viết nào</p>
            </div>
          )}

          {/* Articles Grid */}
          {!loading && news.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {news.map((article) => (
                  <ArticleCard key={article.article_id} article={article} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mb-8">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    ← Trước
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Sau →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default News;
