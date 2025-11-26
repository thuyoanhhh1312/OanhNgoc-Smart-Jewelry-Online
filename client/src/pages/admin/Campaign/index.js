import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import React, { useEffect, useState } from 'react';
import campaignApi from '../../../api/campaignApi';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import { Badge } from 'primereact/badge';

const CampaignList = () => {
  const { user } = useSelector((state) => ({ ...state }));
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    is_active: '',
  });

  useEffect(() => {
    fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.is_active !== '') params.is_active = filters.is_active;

      const response = await campaignApi.getAllCampaigns(params, user?.token);
      setCampaigns(response.data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      Swal.fire('Lỗi', 'Không thể tải danh sách chương trình', 'error');
    } finally {
      setLoading(false);
    }
  };

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
        await campaignApi.deleteCampaign(id, user?.token);
        setCampaigns(campaigns.filter((campaign) => campaign.campaign_id !== id));
        Swal.fire('Đã xóa!', 'Chương trình đã được xóa thành công.', 'success');
      } catch (error) {
        Swal.fire('Lỗi', 'Không thể xóa chương trình', 'error');
      }
    }
  };

  const formatDate = (dateStr) => (dateStr ? dayjs(dateStr).format('DD/MM/YYYY') : '');

  const statusBodyTemplate = (rowData) => {
    return rowData.is_active ? (
      <Badge value="Đang hoạt động" severity="success"></Badge>
    ) : (
      <Badge value="Tạm dừng" severity="warning"></Badge>
    );
  };

  const promotionCountBodyTemplate = (rowData) => {
    const count = rowData.promotions?.length || 0;
    return <span className="font-semibold">{count} khuyến mãi</span>;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Quản lý Chương Trình Khuyến mãi</h1>
        <Link to="/admin/campaigns/add">
          <button className="bg-blue-600 hover:bg-blue-700 transition text-white px-5 py-2 rounded-lg shadow">
            Thêm Chương Trình
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-3">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên..."
          className="border border-gray-300 rounded px-4 py-2 w-64"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          className="border border-gray-300 rounded px-4 py-2"
          value={filters.is_active}
          onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">Đang hoạt động</option>
          <option value="false">Tạm dừng</option>
        </select>
        <button
          onClick={fetchCampaigns}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Áp dụng
        </button>
      </div>

      <DataTable
        value={campaigns}
        paginator
        rows={10}
        loading={loading}
        stripedRows
        responsiveLayout="scroll"
        emptyMessage="Không có chương trình nào"
      >
        <Column
          field="name"
          header="Tên Chương trình"
          sortable
          headerClassName="bg-gray-200"
          style={{ minWidth: '200px' }}
        />
        <Column
          field="description"
          header="Mô tả"
          bodyStyle={{
            maxWidth: '250px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          headerClassName="bg-gray-200"
        />
        <Column
          field="start_date"
          header="Bắt đầu"
          sortable
          style={{ width: '130px' }}
          body={(row) => formatDate(row.start_date)}
          headerClassName="bg-gray-200"
        />
        <Column
          field="end_date"
          header="Kết thúc"
          sortable
          style={{ width: '130px' }}
          body={(row) => formatDate(row.end_date)}
          headerClassName="bg-gray-200"
        />
        <Column
          field="is_active"
          header="Trạng thái"
          body={statusBodyTemplate}
          sortable
          style={{ width: '150px' }}
          headerClassName="bg-gray-200"
        />
        <Column
          header="Số Lượng Khuyến mãi"
          body={promotionCountBodyTemplate}
          style={{ width: '140px', textAlign: 'center' }}
          headerClassName="bg-gray-200"
        />
        <Column
          headerClassName="bg-gray-200"
          header="Hành động"
          body={(rowData) => (
            <div className="flex gap-2 justify-center">
              <Link to={`/admin/campaigns/edit/${rowData.campaign_id}`}>
                <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded">
                  Sửa
                </button>
              </Link>
              <button
                onClick={() => handleDelete(rowData.campaign_id)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
              >
                Xóa
              </button>
            </div>
          )}
          style={{ width: '220px', textAlign: 'center' }}
        />
      </DataTable>
    </div>
  );
};

export default CampaignList;
