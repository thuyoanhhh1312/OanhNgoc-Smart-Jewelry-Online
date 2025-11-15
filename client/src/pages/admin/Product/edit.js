import React, { useState, useEffect } from 'react';
import Input from '../../../components/form/input/InputField';
import Label from '../../../components/form/Label';
import Button from '../../../components/ui/button/Button';
import { useNavigate, useParams } from 'react-router-dom';
import ProductAPI from '../../../api/productApi';
import categoryApi from '../../../api/categoryApi';
import subCategoryApi from '../../../api/subCategoryApi';
import Swal from 'sweetalert2';
import ToggleSwitch from './ToggleSwitch';
import FullScreenLoader from '../../../components/ui/loading/FullScreenLoader';

const EditProduct = () => {
  const { id } = useParams();
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const [existingImages, setExistingImages] = useState([]); // Ảnh cũ
  const [imagesToRemove, setImagesToRemove] = useState([]); // ID ảnh muốn xóa
  const [newImages, setNewImages] = useState([]); // Ảnh mới upload

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [product, categoriesData, subCategoriesData] = await Promise.all([
          ProductAPI.getProductById(id),
          categoryApi.getCategories(),
          subCategoryApi.getSubCategories(),
        ]);

        setProductName(product.product_name || '');
        setDescription(product.description || '');
        setPrice(product.price || '');
        setQuantity(product.quantity || '');
        setCategoryId(product.category_id || '');
        setSubCategoryId(product.subcategory_id || '');
        setCategories(categoriesData);
        setSubCategories(subCategoriesData);
        setIsActive(product.is_active || false);

        setExistingImages(product.ProductImages || []);
      } catch (error) {
        console.error('Error loading product:', error);
      }
    };

    fetchData();
  }, [id]);

  const filteredSubCategories = subCategories.filter(
    (sub) => sub.category_id === Number(categoryId),
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('product_name', productName);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('quantity', quantity);
      formData.append('category_id', categoryId);
      formData.append('subcategory_id', subCategoryId);
      formData.append('is_active', isActive);

      // Ảnh mới upload
      newImages.forEach((file) => formData.append('images', file));

      // Ảnh cũ giữ lại (chưa xóa)
      const existingImageIdsToKeep = existingImages
        .filter((img) => !imagesToRemove.includes(img.image_id))
        .map((img) => img.image_id);
      formData.append('existingImageIds', JSON.stringify(existingImageIdsToKeep));

      await ProductAPI.updateProduct(id, formData);

      await Swal.fire({
        icon: 'success',
        title: 'Cập nhật thành công!',
        text: 'Sản phẩm đã được cập nhật.',
        confirmButtonText: 'OK',
      });

      navigate('/admin/products');
    } catch (error) {
      console.error('Error updating product:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Đã xảy ra lỗi khi cập nhật sản phẩm!',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-white p-4 rounded-lg shadow-md">
      {loading && <FullScreenLoader />}
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <form onSubmit={handleSubmit} method="POST">
          <div className="space-y-6">
            {/* Product Name */}
            <div>
              <Label>
                Product Name <span className="text-red">*</span>
              </Label>
              <Input
                type="text"
                name="product_name"
                id="product_name"
                placeholder="Product Name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            {/* Description */}
            <div>
              <Label>
                Description <span className="text-red">*</span>
              </Label>
              <Input
                type="text"
                name="description"
                id="description"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Price */}
            <div>
              <Label>
                Price <span className="text-red">*</span>
              </Label>
              <Input
                type="number"
                name="price"
                id="price"
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            {/* Quantity */}
            <div>
              <Label>
                Quantity <span className="text-red">*</span>
              </Label>
              <Input
                type="number"
                name="quantity"
                id="quantity"
                placeholder="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            {/* Category */}
            <div>
              <Label>
                Category <span className="text-red">*</span>
              </Label>
              <select
                name="category"
                id="category"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubCategoryId('');
                }}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.category_id} value={category.category_id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>

            {/* SubCategory */}
            {categoryId && (
              <div>
                <Label>
                  SubCategory <span className="text-red">*</span>
                </Label>
                <select
                  name="subcategory"
                  id="subcategory"
                  value={subCategoryId}
                  onChange={(e) => setSubCategoryId(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select SubCategory</option>
                  {filteredSubCategories.map((sub) => (
                    <option key={sub.subcategory_id} value={sub.subcategory_id}>
                      {sub.subcategory_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Upload ảnh mới */}
            <div>
              <Label>Upload Images (Thêm ảnh mới)</Label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setNewImages([...e.target.files])}
              />
              {newImages.length > 0 && (
                <div className="flex gap-2 mt-2 overflow-x-auto">
                  {newImages.map((file, idx) => (
                    <img
                      key={idx}
                      src={URL.createObjectURL(file)}
                      alt={`preview new image ${idx + 1}`}
                      className="h-20 w-20 object-cover rounded"
                      style={{
                        width: '120px', // hoặc kích thước bạn muốn
                        height: '120px',
                        objectFit: 'cover', // giữ tỉ lệ, cắt vừa khung
                        borderRadius: '8px', // bo góc nếu muốn
                        marginRight: '8px',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Hiển thị ảnh cũ có thể xóa */}
            <div>
              <Label>Existing Images (Ảnh hiện tại)</Label>
              <div className="flex gap-2 mt-2 overflow-x-auto">
                {existingImages.map((img) => (
                  <div key={img.image_id} className="relative">
                    <img
                      src={img.image_url}
                      alt={img.alt_text || 'product image'}
                      className={`h-20 w-20 object-cover rounded ${
                        imagesToRemove.includes(img.image_id) ? 'opacity-50' : ''
                      }`}
                      style={{
                        width: '120px', // hoặc kích thước bạn muốn
                        height: '120px',
                        objectFit: 'cover', // giữ tỉ lệ, cắt vừa khung
                        borderRadius: '8px', // bo góc nếu muốn
                        marginRight: '8px',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (imagesToRemove.includes(img.image_id)) {
                          setImagesToRemove(imagesToRemove.filter((id) => id !== img.image_id));
                        } else {
                          setImagesToRemove([...imagesToRemove, img.image_id]);
                        }
                      }}
                      className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      title={imagesToRemove.includes(img.image_id) ? 'Khôi phục ảnh' : 'Xóa ảnh'}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Trạng thái mở bán */}
            <div className="flex items-center gap-4">
              <Label>Trạng thái mở bán:</Label>
              <ToggleSwitch checked={isActive} onChange={(value) => setIsActive(value)} />
              <span>{isActive ? 'Đang mở bán' : 'Đang dừng bán'}</span>
            </div>

            {/* Submit */}
            <div>
              <Button type="submit" className="w-full">
                Update Product
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;
