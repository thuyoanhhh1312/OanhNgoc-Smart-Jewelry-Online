import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import React, { useEffect, useState } from "react";
import SubCategoryAPI from "../../../api/subCategoryApi";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";

const SubCategory = () => {
  const { user } = useSelector((state) => ({ ...state }));
  const [subCategories, setSubCategories] = useState([]);

  useEffect(() => {
    const fetchSubCategories = async () => {
      try {
        const data = await SubCategoryAPI.getSubCategories();
        setSubCategories(data);
      } catch (error) {
        console.error("Lỗi khi tải danh sách:", error);
        Swal.fire("Lỗi", "Không thể tải danh sách nhóm sản phẩm.", "error");
      }
    };
    fetchSubCategories();
  }, []);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Bạn chắc chắn muốn xóa?",
      text: "Thao tác này không thể hoàn tác!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'OK',
      cancelButtonText: 'HỦY',
    });

    if (result.isConfirmed) {
      try {
        await SubCategoryAPI.deleteSubCategory(id, user?.token);

        setSubCategories(subCategories.filter((sub) => sub.subcategory_id !== id));

        Swal.fire("Đã xóa!", "Danh mục đã được xóa thành công.", "success");
      } catch (error) {
        console.error("Lỗi khi xóa danh mục:", error);
        Swal.fire("Lỗi", "Đã xảy ra lỗi khi xóa danh mục!", "error");
      }
    } 
  };

  return (
    <div className="bg-[#FFFFFF] p-4 rounded-lg shadow-md">
      {/* Tiêu đề */}
      <div className="flex flex-row justify-between items-center mb-4">
        <h1 className="text-[32px] font-bold">SubCategory List</h1>
        <div>
          <Link to="/admin/subcategories/add">
            <button className="bg-blue-500 text-white px-4 py-2 rounded">Add New SubCategory</button>
          </Link>
        </div>
      </div>

      <DataTable value={subCategories} paginator rows={10} showGridlines paginatorTemplate="PrevPageLink PageLinks NextPageLink">
        <Column field="subcategory_id" header="ID" sortable headerClassName="bg-[#d2d4d6]"></Column>
        <Column field="subcategory_name" header="Tên Danh Mục Con" sortable headerClassName="bg-[#d2d4d6]"></Column>
        <Column field="description" header="Mô Tả" sortable headerClassName="bg-[#d2d4d6]"></Column>
        <Column field="Category.category_name" header="Danh Mục" sortable headerClassName="bg-[#d2d4d6]"></Column>
        <Column
          body={(rowData) => (
            <div className="flex flex-row gap-2">
              <Link to={`/admin/subcategories/edit/${rowData.subcategory_id}`}>
                <button className="bg-green-500 text-white px-4 py-2 rounded">Edit</button>
              </Link>
              {/* <button
                onClick={() => handleDelete(rowData.subcategory_id)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Delete
              </button> */}
            </div>
          )}
          header="Actions"
          headerClassName="bg-[#d2d4d6]"
        ></Column>
      </DataTable>
    </div>
  );
};

export default SubCategory;
