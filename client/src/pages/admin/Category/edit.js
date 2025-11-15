import React, { useState, useEffect } from "react";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Button from "../../../components/ui/button/Button";
import categoryApi from "../../../api/categoryApi";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";

const EditCategory = () => {
  const { user } = useSelector((state) => ({ ...state }));
  const { id } = useParams();
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await categoryApi.updateCategory(
        id,
        categoryName,
        description,
        user?.token
      );

      await Swal.fire({
        icon: "success",
        title: "Cập nhật thành công!",
        text: "Danh mục đã được cập nhật.",
        confirmButtonText: "OK",
      });

      navigate("/admin/categories");
    } catch (err) {
      console.error(err);
      await Swal.fire({
        icon: "error",
        title: "Cập nhật thất bại!",
        text: "Có lỗi xảy ra khi cập nhật danh mục.",
        confirmButtonText: "OK",
      });
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      const data = await categoryApi.getCategoryById(id);
      setCategoryName(data.category_name);
      setDescription(data.description);
    };
    fetchCategories();
  }, [id]);

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
                  Edit Category
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditCategory;
