import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import React, { useEffect, useState } from "react";
import CategoryAPI from "../../../api/categoryApi";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Swal from 'sweetalert2';

const Category = () => {
  const { user } = useSelector((state) => ({ ...state }));
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const data = await CategoryAPI.getCategories();
      setCategories(data);
    };
    fetchCategories();
  }, []);


  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Bạn có chắc chắn muốn xóa danh mục này không?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'OK',
      cancelButtonText: 'HỦY',
    });
    if (result.isConfirmed) {
      try {
        await CategoryAPI.deleteCategory(id, user?.token);
        Swal.fire('Xóa thành công!', '', 'success');
        // Xóa khỏi danh sách hiển thị
        setCategories(categories.filter((category) => category.category_id !== id));
      } catch (error) {
        console.error("Lỗi khi xóa danh mục:", error);
        Swal.fire('Lỗi', 'Đã xảy ra lỗi khi xóa danh mục!', 'error');
      }
    }
  };

  return (
    <div className='bg-[#FFFFFF] p-4 rounded-lg shadow-md'>
      {/* Tiêu đề */}
      <div className='flex flex-row justify-between items-center mb-4'>
        <h1 className='text-[32px] font-bold '>Category List</h1>
        <div>
          {/* Thêm nút điều hướng */}
          <Link to="/admin/categories/add">
            <button className="bg-blue-500 text-white px-4 py-2 rounded">Add New Category</button>
          </Link>
        </div>
      </div>

      <DataTable value={categories} paginator rows={10} showGridlines paginatorTemplate="PrevPageLink PageLinks NextPageLink">
        <Column field="category_id" header="ID" sortable headerClassName='bg-[#d2d4d6]'></Column>
        <Column field="category_name" header="Tên Danh Mục" sortable headerClassName='bg-[#d2d4d6]'></Column>
        <Column field="description" header="Mô Tả" sortable headerClassName='bg-[#d2d4d6]'></Column>
        <Column
          body={(rowData) => (
            <div className='flex flex-row gap-2'>
              <Link to={`/admin/categories/edit/${rowData.category_id}`}>
                <button className="bg-green-500 text-white px-4 py-2 rounded">
                  Edit
                </button>
              </Link>
              
            </div>
          )}
          header="Actions"
          headerClassName='bg-[#d2d4d6]'
        ></Column>
      </DataTable>
    </div>
  );
};

export default Category;