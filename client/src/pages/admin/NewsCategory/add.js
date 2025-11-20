import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import Input from '../../../components/form/input/InputField';
import Label from '../../../components/form/Label';
import Button from '../../../components/ui/button/Button';
import newsCategoryApi from '../../../api/newsCategoryApi';

const AddNewsCategory = () => {
  const { user } = useSelector((state) => ({ ...state }));
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    category_name: '',
    slug: '',
    description: '',
  });

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

    setLoading(true);

    try {
      await newsCategoryApi.createNewsCategory(
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
        text: 'Danh mục đã được tạo.',
        confirmButtonText: 'OK',
      });

      navigate('/admin/news-categories');
    } catch (error) {
      console.error('Lỗi tạo danh mục:', error);
      Swal.fire({
        icon: 'error',
        title: 'Thất bại!',
        text: error?.response?.data?.message || 'Không thể tạo danh mục.',
        confirmButtonText: 'Thử lại',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-white p-4 rounded-lg shadow-md">
      <div className="max-w-md mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6">Thêm Danh Mục Tin Tức</h1>

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
              placeholder="Slug sẽ tự động generate"
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
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Tạo Danh Mục'}
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

export default AddNewsCategory;
