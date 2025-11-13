import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import React, { useEffect, useState } from 'react';
import promotionLogApi from '../../../api/promotionLogApi';
import campaignApi from '../../../api/campaignApi';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import { Badge } from 'primereact/badge';

const PromotionLogList = () => {
  const { user } = useSelector((state) => ({ ...state }));
  const [logs, setLogs] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [filters, setFilters] = useState({
    campaign_id: '',
    email_status: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchCampaigns();
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await campaignApi.getAllCampaigns({}, user?.token);
      setCampaigns(response.data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.campaign_id) params.campaign_id = filters.campaign_id;
      if (filters.email_status) params.email_status = filters.email_status;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await promotionLogApi.getAllPromotionLogs(params, user?.token);
      setLogs(response.data || []);
    } catch (error) {
      console.error('Error fetching promotion logs:', error);
      Swal.fire('Lỗi', 'Không thể tải danh sách log', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendManually = async () => {
    const { value: formValues } = await Swal.fire({
      title: '📧 Gửi Email Khuyến mãi Thủ công',
      html:
        '<select id="swal-campaign" class="swal2-input">' +
        '<option value="">Chọn Campaign</option>' +
        campaigns.map((c) => `<option value="${c.campaign_id}">${c.name}</option>`).join('') +
        '</select>' +
        '<label class="swal2-checkbox">' +
        '<input type="checkbox" id="swal-force" />' +
        '<span>Gửi lại cho người đã nhận</span>' +
        '</label>',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Gửi',
      cancelButtonText: 'Hủy',
      preConfirm: () => {
        return {
          campaign_id: document.getElementById('swal-campaign').value,
          force_resend: document.getElementById('swal-force').checked,
        };
      },
    });

    if (formValues && formValues.campaign_id) {
      setSendLoading(true);
      try {
        const response = await promotionLogApi.sendPromotionManually(
          {
            campaign_id: parseInt(formValues.campaign_id),
            force_resend: formValues.force_resend,
          },
          user?.token,
        );

        await Swal.fire({
          icon: 'success',
          title: 'Thành công',
          html: `
            <div class="text-left">
              <p>✅ Đã gửi: <strong>${response.summary.sent}</strong> email</p>
              <p>⏭️ Bỏ qua: <strong>${response.summary.skipped}</strong> email</p>
              <p>❌ Thất bại: <strong>${response.summary.failed}</strong> email</p>
            </div>
          `,
          confirmButtonText: 'OK',
        });

        fetchLogs();
      } catch (error) {
        Swal.fire('Lỗi', error.response?.data?.message || 'Không thể gửi email', 'error');
      } finally {
        setSendLoading(false);
      }
    }
  };

  const formatDate = (dateStr) => (dateStr ? dayjs(dateStr).format('DD/MM/YYYY HH:mm') : '');

  const statusBodyTemplate = (rowData) => {
    switch (rowData.email_status) {
      case 'sent':
        return <Badge value="Đã gửi" severity="success" />;
      case 'failed':
        return <Badge value="Thất bại" severity="danger" />;
      case 'pending':
        return <Badge value="Đang chờ" severity="warning" />;
      default:
        return <Badge value={rowData.email_status} severity="info" />;
    }
  };

  const segmentBodyTemplate = (rowData) => {
    const segment = rowData.Customer?.segment_type || '';
    const colors = {
      vip: 'text-purple-700 font-bold',
      gold: 'text-yellow-600 font-bold',
      silver: 'text-gray-600 font-bold',
      bronze: 'text-orange-700 font-bold',
    };
    return <span className={colors[segment] || ''}>{segment.toUpperCase()}</span>;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">📊 Lịch sử Gửi Email Khuyến mãi</h1>
        <button
          onClick={handleSendManually}
          disabled={sendLoading}
          className="bg-green-600 hover:bg-green-700 transition text-white px-5 py-2 rounded-lg shadow disabled:opacity-50"
        >
          {sendLoading ? 'Đang gửi...' : '📧 Gửi Email Thủ công'}
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-4 gap-3">
        <select
          className="border border-gray-300 rounded px-4 py-2"
          value={filters.campaign_id}
          onChange={(e) => setFilters({ ...filters, campaign_id: e.target.value })}
        >
          <option value="">Tất cả Campaign</option>
          {campaigns.map((c) => (
            <option key={c.campaign_id} value={c.campaign_id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className="border border-gray-300 rounded px-4 py-2"
          value={filters.email_status}
          onChange={(e) => setFilters({ ...filters, email_status: e.target.value })}
        >
          <option value="">Tất cả Trạng thái</option>
          <option value="sent">Đã gửi</option>
          <option value="failed">Thất bại</option>
          <option value="pending">Đang chờ</option>
        </select>

        <input
          type="date"
          className="border border-gray-300 rounded px-4 py-2"
          value={filters.start_date}
          onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
          placeholder="Từ ngày"
        />

        <input
          type="date"
          className="border border-gray-300 rounded px-4 py-2"
          value={filters.end_date}
          onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
          placeholder="Đến ngày"
        />
      </div>

      <button
        onClick={fetchLogs}
        className="mb-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
      >
        🔍 Áp dụng Bộ lọc
      </button>

      <DataTable
        value={logs}
        paginator
        rows={20}
        loading={loading}
        stripedRows
        responsiveLayout="scroll"
        emptyMessage="Không có log nào"
      >
        <Column
          field="Customer.name"
          header="Khách hàng"
          sortable
          headerClassName="bg-gray-200"
          style={{ minWidth: '150px' }}
        />
        <Column
          field="Customer.email"
          header="Email"
          sortable
          headerClassName="bg-gray-200"
          style={{ minWidth: '200px' }}
        />
        <Column
          header="Hạng"
          body={segmentBodyTemplate}
          sortable
          style={{ width: '100px' }}
          headerClassName="bg-gray-200"
        />
        <Column
          field="Promotion.promotion_code"
          header="Mã KM"
          sortable
          headerClassName="bg-gray-200"
          style={{ width: '150px' }}
        />
        <Column
          field="Promotion.discount"
          header="Giảm (%)"
          sortable
          style={{ width: '100px' }}
          body={(row) => `${row.Promotion?.discount}%`}
          headerClassName="bg-gray-200"
        />
        <Column
          field="email_status"
          header="Trạng thái"
          body={statusBodyTemplate}
          sortable
          style={{ width: '130px' }}
          headerClassName="bg-gray-200"
        />
        <Column
          field="sent_at"
          header="Thời gian gửi"
          sortable
          style={{ width: '160px' }}
          body={(row) => formatDate(row.sent_at)}
          headerClassName="bg-gray-200"
        />
        <Column
          field="error_message"
          header="Lỗi"
          bodyStyle={{
            maxWidth: '200px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          headerClassName="bg-gray-200"
          body={(row) => row.error_message || '-'}
        />
      </DataTable>

      <div className="mt-4 text-gray-600">
        <p>
          📊 Tổng số log: <strong>{logs.length}</strong>
        </p>
      </div>
    </div>
  );
};

export default PromotionLogList;
