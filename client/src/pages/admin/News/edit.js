import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import Input from '../../../components/form/input/InputField';
import Label from '../../../components/form/Label';
import Button from '../../../components/ui/button/Button';
import newsApi from '../../../api/newsApi';
import newsCategoryApi from '../../../api/newsCategoryApi';
import tagApi from '../../../api/tagApi';
import FullScreenLoader from '../../../components/ui/loading/FullScreenLoader';

const EditNews = () => {
  const { user } = useSelector((state) => ({ ...state }));
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    article_category_id: '',
    status: 'draft',
    published_at: '',
  });

  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  // Load bài viết, categories, tags
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [newsData, catsData, tagsData] = await Promise.all([
          newsApi.getNewsAdminById(id, user?.token),
          newsCategoryApi.getNewsCategories(),
          tagApi.getTags(),
        ]);

        // Load bài viết
        setFormData({
          title: newsData.title || '',
          slug: newsData.slug || '',
          excerpt: newsData.excerpt || '',
          content: newsData.content || '',
          article_category_id: newsData.article_category_id || '',
          status: newsData.status || 'draft',
          published_at: newsData.published_at
            ? new Date(newsData.published_at).toISOString().slice(0, 16)
            : '',
        });

        // Set thumbnail preview
        if (newsData.thumbnail_url) {
          setThumbnailPreview(newsData.thumbnail_url);
        }

        // Set selected tags
        if (Array.isArray(newsData.tags)) {
          setSelectedTags(newsData.tags.map((t) => t.tag_id));
        }

        setCategories(Array.isArray(catsData) ? catsData : catsData?.data || []);
        setTags(Array.isArray(tagsData) ? tagsData : tagsData?.data || []);
      } catch (error) {
        console.error('Lỗi tải dữ liệu:', error);
        Swal.fire('Lỗi', 'Không thể tải bài viết.', 'error');
        navigate('/admin/news');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, navigate]);

  // Xử lý form change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Xử lý thumbnail URL
  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setThumbnailPreview(reader.result);
        setThumbnail(reader.result); // lưu base64
      };
      reader.readAsDataURL(file);
    }
  };

  // Auto generate slug từ title
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }));
  };

  // Toggle tag
  const toggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
    );
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      return Swal.fire('Lỗi', 'Vui lòng nhập tiêu đề.', 'error');
    }
    if (!formData.slug.trim()) {
      return Swal.fire('Lỗi', 'Vui lòng nhập slug.', 'error');
    }
    if (!formData.article_category_id) {
      return Swal.fire('Lỗi', 'Vui lòng chọn danh mục.', 'error');
    }
    if (!formData.content.trim()) {
      return Swal.fire('Lỗi', 'Vui lòng nhập nội dung.', 'error');
    }

    setSubmitting(true);

    try {
      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        excerpt: formData.excerpt.trim(),
        content: formData.content.trim(),
        article_category_id: Number(formData.article_category_id),
        status: formData.status,
        tags: selectedTags,
      };

      // Gửi thumbnail_url nếu có (base64 hoặc URL)
      if (thumbnail) {
        payload.thumbnail_url = thumbnail;
      }

      // Chỉ gửi published_at nếu có giá trị
      if (formData.published_at) {
        payload.published_at = new Date(formData.published_at).toISOString();
      }

      await newsApi.updateNews(id, payload, user?.token);

      Swal.fire({
        icon: 'success',
        title: 'Thành công!',
        text: 'Bài viết đã được cập nhật.',
        confirmButtonText: 'OK',
      });

      navigate('/admin/news');
    } catch (error) {
      console.error('Lỗi cập nhật bài viết:', error);
      Swal.fire({
        icon: 'error',
        title: 'Thất bại!',
        text: error?.response?.data?.message || 'Không thể cập nhật bài viết.',
        confirmButtonText: 'Thử lại',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <FullScreenLoader />;
  }

  return (
    <div className="flex flex-col flex-1 bg-white p-4 rounded-lg shadow-md">
      {submitting && <FullScreenLoader />}

      <div className="max-w-3xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6">Chỉnh Sửa Bài Viết</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tiêu đề */}
          <div>
            <Label>
              Tiêu Đề <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              name="title"
              placeholder="Nhập tiêu đề bài viết"
              value={formData.title}
              onChange={handleTitleChange}
            />
          </div>

          {/* Slug */}
          <div>
            <Label>
              Slug <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              name="slug"
              placeholder="Slug"
              value={formData.slug}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  slug: e.target.value,
                }))
              }
            />
            <p className="text-xs text-gray-500 mt-1">VD: tieu-de-bai-viet</p>
          </div>

          {/* Danh mục */}
          <div>
            <Label>
              Danh Mục <span className="text-red-500">*</span>
            </Label>
            <select
              name="article_category_id"
              value={formData.article_category_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring"
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((cat) => (
                <option key={cat.article_category_id} value={cat.article_category_id}>
                  {cat.category_name}
                </option>
              ))}
            </select>
          </div>

          {/* Thumbnail */}
          <div>
            <Label>Ảnh Đại Diện</Label>
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
            {thumbnailPreview && (
              <div className="mt-2">
                <img
                  src={thumbnailPreview}
                  alt="Preview"
                  className="h-32 w-32 object-cover rounded"
                />
              </div>
            )}
          </div>

          {/* Excerpt */}
          <div>
            <Label>Tóm Tắt</Label>
            <textarea
              name="excerpt"
              placeholder="Tóm tắt ngắn gọn của bài viết (tùy chọn)"
              value={formData.excerpt}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring"
            />
          </div>

          {/* Content */}
          <div>
            <Label>
              Nội Dung <span className="text-red-500">*</span>
            </Label>
            <textarea
              name="content"
              placeholder="Nhập nội dung bài viết..."
              value={formData.content}
              onChange={handleInputChange}
              rows="10"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Hỗ trợ HTML: &lt;b&gt;, &lt;i&gt;, &lt;p&gt;, &lt;br&gt;, &lt;a href&gt;, v.v
            </p>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.tag_id}
                    type="button"
                    onClick={() => toggleTag(tag.tag_id)}
                    className={`px-3 py-1 rounded-full border transition ${
                      selectedTags.includes(tag.tag_id)
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <Label>Trạng Thái</Label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring"
            >
              <option value="draft">Nháp</option>
              <option value="published">Đã Xuất Bản</option>
              <option value="archived">Lưu Trữ</option>
            </select>
          </div>

          {/* Published At */}
          <div>
            <Label>Ngày Xuất Bản</Label>
            <input
              type="datetime-local"
              name="published_at"
              value={formData.published_at}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Button type="submit" className="flex-1">
              Lưu Thay Đổi
            </Button>
            <button
              type="button"
              onClick={() => navigate('/admin/news')}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditNews;
