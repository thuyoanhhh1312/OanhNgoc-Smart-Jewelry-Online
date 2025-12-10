import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import newsApi from '../api/newsApi';
import DOMPurify from 'dompurify';
import MainLayout from '../layout/MainLayout';

const NewsDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const hasIncrementedRef = useRef(false); // Đảm bảo increment view_count chỉ 1 lần
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedNews, setRelatedNews] = useState([]); // Featured (top view_count)
  const [categoryNews, setCategoryNews] = useState([]); // Related (same category)

  useEffect(() => {
    const loadArticle = async () => {
      // Nếu đã gọi API trong component này rồi thì skip (tránh React Strict Mode double-call)
      if (hasIncrementedRef.current) {
        return;
      }
      hasIncrementedRef.current = true;

      try {
        setLoading(true);

        // Fetch bài viết (backend sẽ increment view_count với throttle 60 giây)
        const data = await newsApi.getNewsBySlug(slug);
        setArticle(data);

        // Load featured news (bài có view_count cao nhất - toàn hệ thống)
        const response = await newsApi.getNews({
          page: 1,
          limit: 10,
          status: 'published',
        });

        // Lọc và sắp xếp theo view_count từ cao xuống
        const filtered = Array.isArray(response?.data)
          ? response.data
              .filter((n) => n.article_id !== data.article_id)
              .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
              .slice(0, 3)
          : [];
        setRelatedNews(filtered);

        // Load related news từ cùng danh mục
        if (data.article_category_id) {
          const categoryResponse = await newsApi.getNews({
            page: 1,
            limit: 4,
            status: 'published',
            article_category_id: data.article_category_id,
          });
          const categoryFiltered = Array.isArray(categoryResponse?.data)
            ? categoryResponse.data.filter((n) => n.article_id !== data.article_id).slice(0, 3)
            : [];
          setCategoryNews(categoryFiltered);
        }
      } catch (error) {
        console.error('Lỗi tải bài viết:', error);
        navigate('/news');
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [slug, navigate]);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">Đang tải bài viết...</p>
        </div>
      </MainLayout>
    );
  }

  if (!article) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">Không tìm thấy bài viết</p>
        </div>
      </MainLayout>
    );
  }

  const safeHTML = DOMPurify.sanitize(article.content);

  return (
    <MainLayout>
      <div className="bg-white py-6 border-b">
        <div className="max-w-6xl mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex gap-2 text-sm text-gray-600 mb-4">
            <Link to="/news" className="hover:text-blue-600">
              Blog
            </Link>
            <span>/</span>
            <span className="text-gray-800 line-clamp-1">{article.title}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - 2/3 width */}
            <div className="lg:col-span-2">
              {/* Article Header */}
              <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                {/* Metadata */}
                <div className="flex flex-wrap gap-4 mb-4 items-center text-sm text-gray-600">
                  <Link to="/news" className="hover:text-blue-600">
                    Blog
                  </Link>
                  {article.category && (
                    <>
                      <span>/</span>
                      <span className="text-blue-600 font-medium">
                        {article.category.category_name}
                      </span>
                    </>
                  )}
                  <span className="ml-auto">
                    {dayjs(article.published_at).format('DD/MM/YYYY')}
                  </span>
                  <span>Thời gian đọc: ~5 Phút</span>
                </div>

                {/* Title */}
                <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {article.title}
                </h1>

                {/* Excerpt */}
                {article.excerpt && (
                  <p className="text-lg text-gray-600 italic mb-6 border-l-4 border-blue-600 pl-4">
                    {article.excerpt}
                  </p>
                )}

                {/* Thumbnail - Full width in white card */}
                {article.thumbnail_url && (
                  <div className="w-full flex justify-center my-8">
                    <figure className="w-full max-w-[640px] bg-white rounded-3xl shadow-md overflow-hidden">
                      <img
                        src={article.thumbnail_url}
                        alt={article.title}
                        className="w-full h-auto object-contain md:max-h-[420px]"
                      />
                    </figure>
                  </div>
                )}
              </div>

              {/* Article Content */}
              <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                <div
                  className="prose prose-lg max-w-none text-gray-700 leading-relaxed article-content"
                  dangerouslySetInnerHTML={{ __html: safeHTML }}
                />

                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="mt-8 pt-8 border-t flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <span
                        key={tag.tag_id}
                        className="text-sm bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600 px-4 py-2 rounded-full transition"
                      >
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Share & Navigation */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium">Share:</div>
                  <div className="flex gap-3">
                    <a
                      href={`https://www.facebook.com/sharer.php?u=${window.location.href}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:bg-blue-50 px-4 py-2 rounded transition"
                    >
                      Facebook
                    </a>
                  </div>
                </div>
              </div>

              {/* Related Articles at Bottom */}
              {categoryNews.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">📰 Bài viết liên quan</h2>
                    {article?.category && (
                      <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                        {article.category.category_name}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {categoryNews.map((news) => (
                      <Link key={news.article_id} to={`/news/${news.slug}`}>
                        <div className="bg-white rounded-lg shadow-sm hover:shadow-lg overflow-hidden transition-all duration-300 group">
                          {/* Thumbnail */}
                          <div className="h-48 bg-gray-200 overflow-hidden relative">
                            <img
                              src={news.thumbnail_url || '/placeholder-news.jpg'}
                              alt={news.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            {/* View count badge */}
                            <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                              👁 {news.view_count || 0}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-4">
                            {news.category && (
                              <p className="text-xs text-blue-600 font-semibold mb-2 uppercase tracking-wide">
                                {news.category.category_name}
                              </p>
                            )}
                            <h3 className="font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition mb-3">
                              {news.title}
                            </h3>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>📅 {dayjs(news.published_at).format('DD/MM/YYYY')}</span>
                              <span className="text-gray-400">→</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - 1/3 width */}
            <div className="lg:col-span-1">
              {/* Featured Articles Sidebar */}
              <div className="bg-white rounded-lg shadow-sm sticky top-24">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <h3 className="text-lg font-bold text-white">⭐ Bài viết nổi bật</h3>
                </div>

                {/* Content */}
                <div className="p-6">
                  {relatedNews.length > 0 ? (
                    <div className="space-y-4">
                      {relatedNews.map((news, idx) => (
                        <Link
                          key={news.article_id}
                          to={`/news/${news.slug}`}
                          className="flex gap-3 hover:bg-gray-50 p-3 rounded-lg transition-all group"
                        >
                          {/* Thumbnail */}
                          <div className="w-16 h-16 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                            <img
                              src={news.thumbnail_url || '/placeholder-news.jpg'}
                              alt={news.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Rank Badge */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-semibold text-red-500">
                                👁 {news.view_count || 0} lượt xem
                              </span>
                            </div>

                            {/* Title */}
                            <h4 className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition">
                              {news.title}
                            </h4>

                            {/* Date */}
                            <p className="text-xs text-gray-400 mt-2">
                              {dayjs(news.published_at).format('DD/MM/YYYY')}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Không có bài viết nổi bật
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default NewsDetail;
