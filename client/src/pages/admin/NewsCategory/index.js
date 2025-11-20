import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import newsCategoryApi from '../../../api/newsCategoryApi';

const NewsCategory = () => {
  const { user } = useSelector((state) => ({ ...state }));
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load danh sách danh mục
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await newsCategoryApi.getNewsCategories();
      const data = Array.isArray(response) ? response : response?.data || [];
      setCategories(data);
    } catch (error) {
      console.error('Lỗi tải danh mục tin tức:', error);
      Swal.fire('Lỗi', 'Không thể tải danh mục tin tức.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Xóa danh mục
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Xóa danh mục?',
      text: 'Bạn có chắc chắn muốn xóa danh mục này không?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
    });

    if (result.isConfirmed) {
      try {
        await newsCategoryApi.deleteNewsCategory(id, user?.token);
        Swal.fire('Xóa thành công!', '', 'success');
        setCategories(categories.filter((cat) => cat.article_category_id !== id));
      } catch (error) {
        console.error('Lỗi xóa danh mục:', error);
        Swal.fire('Lỗi', 'Không thể xóa danh mục.', 'error');
      }
    }
  };

  // Template actions
  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Link to={`/admin/news-categories/edit/${rowData.article_category_id}`}>
          <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
            Sửa
          </button>
        </Link>
        <button
          onClick={() => handleDelete(rowData.article_category_id)}
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
        <h1 className="text-3xl font-bold">Quản Lý Danh Mục Tin Tức</h1>
        <Link to="/admin/news-categories/add">
          <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            + Thêm Danh Mục
          </button>
        </Link>
      </div>

      {/* DataTable */}
      <DataTable
        value={categories}
        paginator
        rows={10}
        showGridlines
        paginatorTemplate="PrevPageLink PageLinks NextPageLink"
        responsiveLayout="scroll"
      >
        <Column field="article_category_id" header="ID" width="80px" sortable />
        <Column field="category_name" header="Tên Danh Mục" sortable />
        <Column field="slug" header="Slug" sortable />
        <Column field="description" header="Mô Tả" />
        <Column header="Hành Động" body={actionBodyTemplate} width="150px" />
      </DataTable>
    </div>
  );
};

export default NewsCategory;
