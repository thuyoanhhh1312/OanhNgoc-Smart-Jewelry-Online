import React, { useEffect, useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import ProductAPI from '../../../api/productApi';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
import { Image } from 'primereact/image';
import ToggleSwitch from './ToggleSwitch';
import FilterModal from '../../../components/FilterModal';

const Product = () => {
  const [products, setProducts] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loadingStatus, setLoadingStatus] = useState(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  console.log('categories', categories);

  const debounceTimeout = useRef(null);

  // Load danh mục khi component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await ProductAPI.getCategoriesWithSubCategories();
        setCategories(data);
      } catch (error) {
        console.error('Lỗi lấy danh mục:', error);
      }
    };
    fetchCategories();
  }, []);

  // Hàm gọi API lấy sản phẩm, hỗ trợ params lọc
  const fetchProducts = async (params = {}) => {
    try {
      if (Object.keys(params).length === 0 && keyword.trim()) {
        const data = await ProductAPI.getProducts(keyword.trim());
        setProducts(data);
        return;
      }
      const data = await ProductAPI.filterProducts(params);
      setProducts(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách:', error);
      Swal.fire('Lỗi', 'Không thể tải danh sách sản phẩm.', 'error');
    }
  };

  // Load sản phẩm lúc đầu
  useEffect(() => {
    fetchProducts();
  }, []);

  // Debounce input tìm kiếm
  const handleKeywordChange = (e) => {
    const value = e.target.value;
    setKeyword(value);

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(() => {
      fetchProducts({ keyword: value.trim() });
    }, 300);
  };

  // Xử lý nhận bộ lọc từ FilterModal
  const handleApplyFilter = (filters) => {
    const params = { ...filters };

    // Kết hợp với từ khóa tìm kiếm nếu có
    if (keyword.trim() !== '') {
      params.keyword = keyword.trim();
    }

    // Chuyển mảng id thành chuỗi query string (API nhận dạng này)
    if (params.categoryIds) params.category_id = params.categoryIds.join(',');
    delete params.categoryIds;

    if (params.subcategoryIds) params.subcategory_id = params.subcategoryIds.join(',');
    delete params.subcategoryIds;

    fetchProducts(params);
  };

  // Hiển thị mô tả an toàn (sanitize)
  const descriptionBodyTemplate = (rowData) => {
    const description = rowData?.description;
    return description ? (
      <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }} />
    ) : (
      <p></p>
    );
  };

  // Hiển thị hình ảnh
  const imageBodyTemplate = (rowData) => {
    const images = rowData?.ProductImages || [];
    return (
      <div className="flex flex-wrap gap-2">
        {images.length > 0 ? (
          images.map((image, index) => (
            <Image
              key={index}
              src={image.image_url}
              alt={image.alt_text || `Image ${index + 1}`}
              width="80"
              height="60"
              preview
            />
          ))
        ) : (
          <span>Empty Image</span>
        )}
      </div>
    );
  };

  // Chuyển trạng thái bán (toggle)

  const toggleStatus = async (product) => {
    setLoadingStatus(product.product_id);
    try {
      const formData = new FormData();
      formData.append('product_name', product.product_name);
      formData.append('description', product.description || '');
      formData.append('price', product.price);
      formData.append('quantity', product.quantity);
      formData.append('category_id', product.category_id);
      formData.append('subcategory_id', product.subcategory_id);
      formData.append('is_active', !product.is_active); // cập nhật trạng thái mới

      // Lấy token từ store hoặc localStorage (ví dụ)
      const accessToken = localStorage.getItem('accessToken') || '';

      await ProductAPI.updateProduct(product.product_id, formData, accessToken);

      setProducts((prev) =>
        prev.map((p) =>
          p.product_id === product.product_id ? { ...p, is_active: !p.is_active } : p,
        ),
      );

      Swal.fire('Thành công', 'Cập nhật trạng thái thành công', 'success');
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error);
      Swal.fire('Lỗi', 'Không thể cập nhật trạng thái', 'error');
    } finally {
      setLoadingStatus(null);
    }
  };

  // Template hiển thị cột trạng thái bán
  const statusBodyTemplate = (rowData) => {
    return (
      <div className="flex items-center gap-2 justify-center">
        <ToggleSwitch
          checked={rowData.is_active}
          disabled={loadingStatus === rowData.product_id}
          onChange={() => toggleStatus(rowData)}
        />
        <span>{rowData.is_active ? 'Đang mở bán' : 'Đang dừng bán'}</span>
      </div>
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Product List</h1>

        <div className="flex gap-2 flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên sản phẩm"
            className="border border-gray-300 rounded p-2 flex-grow"
            value={keyword}
            onChange={handleKeywordChange}
          />
          <button className="p-button p-button-secondary" onClick={() => setFilterVisible(true)}>
            Bộ lọc nâng cao
          </button>
        </div>

        <Link to="/admin/products/add">
          <button className="bg-blue-500 text-white px-4 py-2 rounded">Add New Product</button>
        </Link>
      </div>

      <DataTable
        value={products}
        paginator
        rows={10}
        showGridlines
        paginatorTemplate="PrevPageLink PageLinks NextPageLink"
      >
        <Column field="product_name" header="Tên sản phẩm" sortable headerClassName="bg-gray-200" />
        <Column
          field="ProductImages"
          header="Hình ảnh"
          body={imageBodyTemplate}
          sortable
          headerClassName="bg-gray-200"
        />
        <Column
          field="description"
          header="Mô tả"
          body={descriptionBodyTemplate}
          sortable
          headerClassName="bg-gray-200"
        />
        <Column field="price" header="Giá" sortable headerClassName="bg-gray-200" />
        <Column field="quantity" header="Số lượng" sortable headerClassName="bg-gray-200" />
        <Column
          field="Category.category_name"
          header="Danh mục"
          sortable
          headerClassName="bg-gray-200"
        />
        <Column
          field="SubCategory.subcategory_name"
          header="Danh mục con"
          sortable
          headerClassName="bg-gray-200"
        />
        <Column
          header="Trạng thái bán"
          body={statusBodyTemplate}
          headerClassName="bg-gray-200"
          style={{ width: '150px', textAlign: 'center' }}
        />
        <Column
          body={(rowData) => (
            <Link to={`/admin/products/edit/${rowData.product_id}`}>
              <button className="bg-green-500 text-white px-4 py-2 rounded">Edit</button>
            </Link>
          )}
          header="Actions"
          headerClassName="bg-gray-200"
        />
      </DataTable>

      <FilterModal
        visible={filterVisible}
        onHide={() => setFilterVisible(false)}
        onApply={handleApplyFilter}
        categories={categories}
      />
    </div>
  );
};

export default Product;
