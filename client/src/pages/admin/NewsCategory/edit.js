import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import Input from '../../../components/form/input/InputField';
import Label from '../../../components/form/Label';
import Button from '../../../components/ui/button/Button';
import newsCategoryApi from '../../../api/newsCategoryApi';
import FullScreenLoader from '../../../components/ui/loading/FullScreenLoader';

const EditNewsCategory = () => {
  const { user } = useSelector((state) => ({ ...state }));
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    category_name: '',
    slug: '',
    description: '',
  });

  // Load danh mục
  useEffect(() => {
    const loadCategory = async () => {
      try {
        setLoading(true);
        const data = await newsCategoryApi.getNewsCategoryById(id, user?.token);
        setFormData({
          category_name: data.category_name || '',
          slug: data.slug || '',
          description: data.description || '',
        });
      } catch (error) {
        console.error('Lỗi tải danh mục:', error);
        Swal.fire('Lỗi', 'Không thể tải danh mục.', 'error');
        navigate('/admin/news-categories');
      } finally {
        setLoading(false);
      }
    };
    loadCategory();
  }, [id, navigate, user?.token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Auto generate slug
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      category_name: name,
      slug: generateSlug(name),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category_name.trim()) {
      return Swal.fire('Lỗi', 'Vui lòng nhập tên danh mục.', 'error');
    }
    if (!formData.slug.trim()) {
      return Swal.fire('Lỗi', 'Vui lòng nhập slug.', 'error');
    }

    setSubmitting(true);

    try {
      await newsCategoryApi.updateNewsCategory(
        id,
        {
          category_name: formData.category_name,
          slug: formData.slug,
          description: formData.description,
        },
        user?.token,
      );

      Swal.fire({
        icon: 'success',
        title: 'Thành công!',
        text: 'Danh mục đã được cập nhật.',
        confirmButtonText: 'OK',
      });

      navigate('/admin/news-categories');
    } catch (error) {
      console.error('Lỗi cập nhật danh mục:', error);
      Swal.fire({
        icon: 'error',
        title: 'Thất bại!',
        text: error?.response?.data?.message || 'Không thể cập nhật danh mục.',
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

      <div className="max-w-md mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6">Chỉnh Sửa Danh Mục Tin Tức</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>
              Tên Danh Mục <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              name="category_name"
              placeholder="VD: Tin tức thị trường"
              value={formData.category_name}
              onChange={handleNameChange}
            />
          </div>

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
            <p className="text-xs text-gray-500 mt-1">VD: tin-tuc-thi-truong</p>
          </div>

          <div>
            <Label>Mô Tả</Label>
            <textarea
              name="description"
              placeholder="Mô tả danh mục (tùy chọn)"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? 'Đang xử lý...' : 'Lưu Thay Đổi'}
            </Button>
            <button
              type="button"
              onClick={() => navigate('/admin/news-categories')}
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

export default EditNewsCategory;
