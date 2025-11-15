import React, { useState } from "react";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import categoryApi from "../../../api/categoryApi";
import Button from "../../../components/ui/button/Button";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
const AddCategory = () => {
  const { user } = useSelector((state) => ({ ...state }));
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await categoryApi.createCategory(categoryName, description, user.token);
      setCategoryName("");
      setDescription("");
      Swal.fire({
        icon: "success",
        title: "Thành công!",
        text: "Danh mục đã được thêm thành công.",
        confirmButtonText: "OK",
      });
      navigate("/admin/categories");
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Thất bại!",
        text: "Có lỗi xảy ra khi thêm danh mục.",
        confirmButtonText: "OK",
      });
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-white p-4 rounded-lg shadow-md">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <form onSubmit={handleSubmit} method="POST">
            <div className="space-y-6">
              <div>
                <Label>
                  Category Name <span className="text-red">*</span>
                </Label>
                <Input
                  type="text"
                  name="Tên Danh Mục"
                  id="category_name"
                  placeholder="Category Name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e?.target?.value)}
                />
              </div>
              <div>
                <Label>
                  Description <span className="text-red">*</span>
                </Label>
                <Input
                  type="text"
                  name="Mô Tả"
                  id="description"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e?.target?.value)}
                />
              </div>
              <div>
                <Button type="submit" onClick={handleSubmit} className="w-full">
                  Add Category
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCategory;
