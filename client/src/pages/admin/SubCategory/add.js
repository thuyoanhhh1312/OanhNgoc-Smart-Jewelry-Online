import React, { useState, useEffect } from "react";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Button from "../../../components/ui/button/Button";
import { useNavigate } from "react-router-dom";
import subCategoryApi from "../../../api/subCategoryApi";
import categoryApi from "../../../api/categoryApi";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";

const AddSubCategory = () => {
  const { user } = useSelector((state) => ({ ...state }));
  const [subCategoryName, setSubCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryApi.getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!subCategoryName.trim())
      newErrors.subCategoryName = "Subcategory name is required.";
    if (!description.trim()) newErrors.description = "Description is required.";
    if (!categoryId) newErrors.categoryId = "Please select a category.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({}); // Clear errors

    try {
      await subCategoryApi.createSubCategory(
        subCategoryName.trim(),
        description.trim(),
        Number(categoryId),
        user?.token
      );

      setSubCategoryName("");
      setDescription("");
      setCategoryId("");
      Swal.fire({
        icon: "success",
        title: "Thành công!",
        text: "Danh mục con đã được thêm thành công.",
        confirmButtonText: "OK",
      });
      navigate("/admin/subcategories");
    } catch (error) {
      console.error("Error creating subcategory:", error);
      Swal.fire({
        icon: "error",
        title: "Thất bại!",
        text: "Có lỗi xảy ra khi thêm danh mục con.",
        confirmButtonText: "OK",
      });
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-white p-4 rounded-lg shadow-md">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <form onSubmit={handleSubmit} method="POST">
          <div className="space-y-6">
            {/* Subcategory Name */}
            <div>
              <Label>
                Subcategory Name <span className="text-red">*</span>
              </Label>
              <Input
                type="text"
                name="Tên Danh Mục Con"
                id="subcategory_name"
                placeholder="Subcategory Name"
                value={subCategoryName}
                onChange={(e) => setSubCategoryName(e.target.value)}
                className={errors.subCategoryName ? "border-red-500" : ""}
              />
              {errors.subCategoryName && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.subCategoryName}
                </p>
              )}
            </div>

            {/* Description */}
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
                onChange={(e) => setDescription(e.target.value)}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <Label>
                Category <span className="text-red">*</span>
              </Label>
              <select
                name="Tên Danh Mục"
                id="category_id"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={`w-full p-2 border rounded ${
                  errors.categoryId ? "border-red-500" : ""
                }`}
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option
                    key={category.category_id}
                    value={category.category_id}
                  >
                    {category.category_name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-sm text-red-500 mt-1">{errors.categoryId}</p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <Button type="submit" className="w-full">
                Add Subcategory
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubCategory;
