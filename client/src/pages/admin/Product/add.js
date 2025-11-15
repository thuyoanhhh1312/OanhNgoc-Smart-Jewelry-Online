import React, { useState, useEffect } from 'react';
import Input from '../../../components/form/input/InputField';
import Label from '../../../components/form/Label';
import Button from '../../../components/ui/button/Button';
import { useNavigate } from 'react-router-dom';
import categoryApi from '../../../api/categoryApi';
import subCategoryApi from '../../../api/subCategoryApi';
import Swal from 'sweetalert2';
import { useSelector } from 'react-redux';
import ProductAPI from '../../../api/productApi';
import FullScreenLoader from '../../../components/ui/loading/FullScreenLoader';

const AddProduct = () => {
  const { user } = useSelector((state) => ({ ...state }));
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategory_id, setSubCategoryId] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(false); // Mặc định là DỪNG BÁN

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, subCategoriesData] = await Promise.all([
          categoryApi.getCategories(),
          subCategoryApi.getSubCategories(),
        ]);
        setCategories(categoriesData);
        setSubCategories(subCategoriesData);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách danh mục:', error);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !productName ||
      !description ||
      !price ||
      !quantity ||
      !categoryId ||
      !subCategory_id ||
      images.length === 0
    ) {
      return Swal.fire({
        icon: 'warning',
        title: 'Thiếu thông tin',
        text: 'Vui lòng điền đầy đủ các trường và chọn ít nhất 1 ảnh.',
        confirmButtonText: 'OK',
      });
    }

    setLoading(true);

    try {
      await ProductAPI.createProduct(
        productName,
        description,
        price,
        quantity,
        categoryId,
        subCategory_id,
        images,
        user?.token,
        isActive,
      );

      Swal.fire({
        icon: 'success',
        title: 'Thành công!',
        text: 'Sản phẩm đã được thêm thành công.',
        confirmButtonText: 'OK',
      });

      navigate('/admin/products');
    } catch (error) {
      console.error('Lỗi khi tạo sản phẩm:', error);
      Swal.fire({
        icon: 'error',
        title: 'Thất bại!',
        text: error?.response?.data?.message || 'Không thể thêm sản phẩm.',
        confirmButtonText: 'Thử lại',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const filteredSubCategories = subCategories.filter(
    (sub) => sub.category_id === Number(categoryId),
  );

  return (
    <div className="flex flex-col flex-1 bg-white p-4 rounded-lg shadow-md">
      {loading && <FullScreenLoader />}
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <form onSubmit={handleSubmit} method="POST" encType="multipart/form-data">
          <div className="space-y-6">
            <div>
              <Label>
                Tên sản phẩm <span className="text-red">*</span>
              </Label>
              <Input
                type="text"
                placeholder="Tên sản phẩm"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            <div>
              <Label>
                Mô tả <span className="text-red">*</span>
              </Label>
              <Input
                type="text"
                placeholder="Mô tả"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <Label>
                Giá <span className="text-red">*</span>
              </Label>
              <Input
                type="number"
                placeholder="Giá"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div>
              <Label>
                Số lượng <span className="text-red">*</span>
              </Label>
              <Input
                type="number"
                placeholder="Số lượng"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div>
              <Label>
                Danh mục <span className="text-red">*</span>
              </Label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubCategoryId('');
                }}
                className="w-full p-2 border rounded"
              >
                <option value="">Chọn danh mục</option>
                {categories.map((category) => (
                  <option key={category.category_id} value={category.category_id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>

            {filteredSubCategories.length > 0 && (
              <div>
                <Label>
                  Danh mục con <span className="text-red">*</span>
                </Label>
                <select
                  value={subCategory_id}
                  onChange={(e) => setSubCategoryId(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Chọn danh mục con</option>
                  {filteredSubCategories.map((sub) => (
                    <option key={sub.subcategory_id} value={sub.subcategory_id}>
                      {sub.subcategory_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label>
                Hình ảnh sản phẩm <span className="text-red">*</span>
              </Label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="w-full p-2 border rounded"
              />
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {imagePreviews.map((url, index) => (
                    <div key={index} className="border rounded overflow-hidden">
                      <img
                        src={url}
                        alt={`Ảnh ${index + 1}`}
                        className="w-full h-24 object-cover"
                        style={{
                          width: '120px', // hoặc kích thước bạn muốn
                          height: '120px',
                          objectFit: 'cover', // giữ tỉ lệ, cắt vừa khung
                          borderRadius: '8px', // bo góc nếu muốn
                          marginRight: '8px',
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Button type="submit" onClick={handleSubmit} className="w-full">
                Thêm sản phẩm
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
