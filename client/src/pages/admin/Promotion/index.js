import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import React, { useEffect, useState } from 'react';
import PromotionAPI from '../../../api/promotionApi';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';

const Promotion = () => {
  const { user } = useSelector((state) => ({ ...state }));
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPromotions = async () => {
      setLoading(true);
      try {
        const data = await PromotionAPI.getPromotions();
        setPromotions(data);
      } catch (error) {
        Swal.fire('Lỗi', 'Không thể tải danh sách khuyến mãi', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Bạn chắc chắn muốn xóa?',
      text: 'Thao tác này không thể hoàn tác!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
    });

    if (result.isConfirmed) {
      try {
        await PromotionAPI.deletePromotion(id, user?.token);
        setPromotions(promotions.filter((pro) => pro.promotion_id !== id));
        Swal.fire('Đã xóa!', 'Khuyến mãi đã được xóa thành công.', 'success');
      } catch (error) {
        Swal.fire('Lỗi', 'Không thể xóa khuyến mãi', 'error');
      }
    }
  };

  const formatDate = (dateStr) => (dateStr ? dayjs(dateStr).format('DD/MM/YYYY') : '');

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Danh sách Khuyến mãi</h1>
        {user?.role_id === 1 && (
          <Link to="/admin/promotions/add">
            <button className="bg-blue-600 hover:bg-blue-700 transition text-white px-5 py-2 rounded">
              Thêm Khuyến mãi
            </button>
          </Link>
        )}
      </div>

      <DataTable
        value={promotions}
        paginator
        rows={10}
        loading={loading}
        stripedRows
        responsiveLayout="scroll"
      >
        <Column
          field="promotion_code"
          header="Mã Khuyến mãi"
          sortable
          headerClassName="bg-gray-200"
        ></Column>
        <Column
          field="description"
          header="Mô tả"
          bodyStyle={{
            maxWidth: '300px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          headerClassName="bg-gray-200"
        ></Column>
        <Column
          field="discount"
          header="Giảm (%)"
          sortable
          style={{ width: '110px' }}
          body={(row) => <span>{row.discount}%</span>}
          headerClassName="bg-gray-200"
        />
        <Column
          field="campaign.name"
          header="Chương trình"
          sortable
          style={{ width: '110px' }}
          body={(row) => row.campaign?.name || 'Không có'}
          headerClassName="bg-gray-200"
        />
        <Column
          field="segment_target"
          header="Tệp khách hàng"
          sortable
          style={{ width: '110px' }}
          body={(row) => row.segment_target || 'Tất cả'}
          headerClassName="bg-gray-200"
        />

        <Column
          field="usage_count"
          header="Đã dùng"
          sortable
          style={{ width: '100px' }}
          headerClassName="bg-gray-200"
        />
        <Column
          field="usage_limit"
          header="Giới hạn"
          sortable
          style={{ width: '100px' }}
          body={(row) => (row.usage_limit === null ? 'Không giới hạn' : row.usage_limit)}
          headerClassName="bg-gray-200"
        />
        {user?.role_id === 1 && (
          <Column
            headerClassName="bg-gray-200"
            header="Hành động"
            body={(rowData) => (
              <div className="flex gap-2 justify-center">
                <Link to={`/admin/promotions/edit/${rowData.promotion_id}`}>
                  <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded">
                    Sửa
                  </button>
                </Link>
                <button
                  onClick={() => handleDelete(rowData.promotion_id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                >
                  Xóa
                </button>
              </div>
            )}
            style={{ width: '150px', textAlign: 'center' }}
          />
        )}
      </DataTable>
    </div>
  );
};

export default Promotion;
