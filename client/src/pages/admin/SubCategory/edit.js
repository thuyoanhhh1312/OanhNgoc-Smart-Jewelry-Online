import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SubCategoryAPI from "../../../api/subCategoryApi";
import categoryApi from "../../../api/categoryApi";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Button from "../../../components/ui/button/Button";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";

const EditSubCategory = () => {
  const { user } = useSelector((state) => ({ ...state }));
  const { id } = useParams();
  const navigate = useNavigate();

  const [subcategoryName, setSubcategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subCategoryData, categoriesData] = await Promise.all([
          SubCategoryAPI.getSubCategoryById(id),
          categoryApi.getCategories(),
        ]);

        setSubcategoryName(subCategoryData.subcategory_name || '');
        setDescription(subCategoryData.description || '');
        setCategoryId(subCategoryData.category_id || '');
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error loading subcategory:", error);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!subcategoryName.trim()) newErrors.subcategoryName = "Subcategory name is required.";
    if (!categoryId) newErrors.categoryId = "Please select a category.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({}); // Clear errors

    try {
      await SubCategoryAPI.updateSubCategory(id, {
        subcategory_name: subcategoryName.trim(),
        description: description.trim(),
        category_id: Number(categoryId),
      }, user?.token);

      await Swal.fire({
        icon: 'success',
        title: 'Cập nhật thành công!',
        text: 'Danh mục con đã được cập nhật.',
        confirmButtonText: 'OK'
      });

      navigate('/admin/subcategories');
    } catch (error) {
      console.error('Error updating subcategory:', error.response?.data || error.message);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Đã xảy ra lỗi khi cập nhật danh mục con!',
      });
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-white p-4 rounded-lg shadow-md">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <form onSubmit={handleSubmit} method="POST">
          <div className="space-y-6">
            {/* SubCategory Name */}
            <div>
              <Label>SubCategory Name <span className="text-red">*</span></Label>
              <Input
                type="text"
                name="Tên Danh Mục Con"
                id="subcategory_name"
                placeholder="SubCategory Name"
                value={subcategoryName}
                onChange={(e) => setSubcategoryName(e.target.value)}
                className={errors.subcategoryName ? "border-red-500" : ""}
              />
              {errors.subcategoryName && (
                <p className="text-sm text-red-500 mt-1">{errors.subcategoryName}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label>Description</Label>
              <Input
                type="text"
                name="Mô Tả"
                id="description"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Category */}
            <div>
              <Label>Category <span className="text-red">*</span></Label>
              <select
                name="Tên Danh Mục"
                id="category_id"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={`w-full p-2 border rounded ${errors.categoryId ? "border-red-500" : ""}`}
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.category_id} value={category.category_id}>
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
              <Button type="submit" className="w-full">Update SubCategory</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSubCategory;
