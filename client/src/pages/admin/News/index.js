import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';
import newsApi from '../../../api/newsApi';
import newsCategoryApi from '../../../api/newsCategoryApi';
import DOMPurify from 'dompurify';

const News = () => {
  const user = useSelector((state) => state?.user);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);

  // Load danh sách bài viết
  const fetchNews = async (status = '', categoryId = '') => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 100,
      };
      // Gửi status - nếu status là empty string, send "all" để backend biết lấy tất cả
      if (status) {
        params.status = status;
      } else {
        params.status = 'all'; // Signal backend để lấy tất cả
      }
      if (categoryId) {
        params.article_category_id = categoryId;
      }
      const response = await newsApi.getAdminNews(params, user?.token);
      const data = Array.isArray(response?.data) ? response.data : [];
      setNews(data);
    } catch (error) {
      console.error('Lỗi lấy danh sách bài viết:', error);
      Swal.fire('Lỗi', 'Không thể tải danh sách bài viết.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      const data = await newsCategoryApi.getNewsCategories();
      setCategories(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error('Lỗi lấy danh mục:', error);
    }
  };

  useEffect(() => {
    loadCategories();
    fetchNews();
  }, []);

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    const status = e.target.value;
    setStatusFilter(status);
    fetchNews(status, categoryFilter);
  };

  // Handle category filter change
  const handleCategoryFilterChange = (e) => {
    const categoryId = e.target.value;
    setCategoryFilter(categoryId);
    fetchNews(statusFilter, categoryId);
  };

  // Xóa bài viết
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Xóa bài viết?',
      text: 'Bạn có chắc chắn muốn xóa bài viết này không?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
    });

    if (result.isConfirmed) {
      try {
        await newsApi.deleteNews(id, user?.token);
        Swal.fire('Xóa thành công!', '', 'success');
        setNews(news.filter((item) => item.article_id !== id));
      } catch (error) {
        console.error('Lỗi xóa bài viết:', error);
        Swal.fire('Lỗi', 'Không thể xóa bài viết.', 'error');
      }
    }
  };

  // Template hiển thị ngày
  const dateBodyTemplate = (rowData) => {
    return rowData.published_at ? dayjs(rowData.published_at).format('DD/MM/YYYY HH:mm') : '—';
  };

  // Template hiển thị status
  const statusBodyTemplate = (rowData) => {
    const statusColors = {
      draft: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800',
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[rowData.status] || ''}`}
      >
        {rowData.status === 'draft' && 'Nháp'}
        {rowData.status === 'published' && 'Đã xuất bản'}
        {rowData.status === 'archived' && 'Lưu trữ'}
      </span>
    );
  };

  // Template hiển thị nội dung preview
  const contentBodyTemplate = (rowData) => {
    const excerpt = rowData.excerpt || rowData.content || '';
    let text = (excerpt || '').replace(/<[^>]*>/g, '').substring(0, 100);
    return <span>{text}...</span>;
  };

  // Template actions
  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Link to={`/admin/news/edit/${rowData.article_id}`}>
          <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
            Sửa
          </button>
        </Link>
        <button
          onClick={() => handleDelete(rowData.article_id)}
          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
        >
          Xóa
        </button>
      </div>
    );
  };

  if (loading) {
    return <div className="p-4">Đang tải...</div>;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Quản Lý Tin Tức</h1>
        <div className="flex gap-2">
          <Link to="/admin/news/add">
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              + Thêm Bài Viết
            </button>
          </Link>
          <Link to="/admin/news-categories">
            <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              Danh Mục
            </button>
          </Link>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 flex gap-4 items-center flex-wrap">
        <div className="flex gap-2 items-center">
          <label className="font-medium">Trạng thái:</label>
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring"
          >
            <option value="">Tất cả</option>
            <option value="draft">Nháp</option>
            <option value="published">Đã xuất bản</option>
            <option value="archived">Lưu trữ</option>
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <label className="font-medium">Danh mục:</label>
          <select
            value={categoryFilter}
            onChange={handleCategoryFilterChange}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring"
          >
            <option value="">Tất cả</option>
            {categories.map((cat) => (
              <option key={cat.article_category_id} value={cat.article_category_id}>
                {cat.category_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        value={news}
        paginator
        rows={10}
        showGridlines
        paginatorTemplate="PrevPageLink PageLinks NextPageLink"
        responsiveLayout="scroll"
      >
        <Column field="article_id" header="ID" width="80px" sortable />
        <Column field="title" header="Tiêu Đề" sortable />
        <Column field="category.category_name" header="Danh Mục" width="150px" />
        <Column header="Nội Dung" body={contentBodyTemplate} width="200px" />
        <Column header="Trạng Thái" body={statusBodyTemplate} width="120px" />
        <Column header="Xuất Bản" body={dateBodyTemplate} width="160px" sortable />
        <Column header="Hành Động" body={actionBodyTemplate} width="150px" />
      </DataTable>
    </div>
  );
};

export default News;
