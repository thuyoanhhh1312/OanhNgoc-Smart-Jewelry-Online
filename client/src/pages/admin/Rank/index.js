import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import React, { useEffect, useState } from 'react';
import rankApi from '../../../api/rankApi';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import { Badge } from 'primereact/badge';
import { Chart } from 'primereact/chart';

const RankManagement = () => {
  const { user } = useSelector((state) => ({ ...state }));
  const [preview, setPreview] = useState([]);
  const [history, setHistory] = useState([]);
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('preview'); // preview, history, distribution

  useEffect(() => {
    fetchDistribution();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const response = await rankApi.previewRank(user?.token);
      setPreview(response.data || []);
    } catch (error) {
      console.error('Error fetching rank preview:', error);
      Swal.fire('Lỗi', 'Không thể tải preview xếp hạng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await rankApi.getRankHistory({}, user?.token);
      setHistory(response.data || []);
    } catch (error) {
      console.error('Error fetching rank history:', error);
      Swal.fire('Lỗi', 'Không thể tải lịch sử xếp hạng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDistribution = async () => {
    try {
      const response = await rankApi.getRankDistribution(user?.token);
      setDistribution(response.data);
    } catch (error) {
      console.error('Error fetching rank distribution:', error);
    }
  };

  const handleRecalculate = async () => {
    const result = await Swal.fire({
      title: 'Xác nhận cập nhật xếp hạng?',
      text: 'Thao tác này sẽ cập nhật xếp hạng cho tất cả khách hàng dựa trên chi tiêu tháng hiện tại.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Cập nhật',
      cancelButtonText: 'Hủy',
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const response = await rankApi.recalculateRank(user?.token);

        await Swal.fire({
          icon: 'success',
          title: 'Thành công',
          html: `
            <div class="text-left">
              <p>✅ Đã cập nhật xếp hạng cho <strong>${response.updated_count}</strong> khách hàng</p>
            </div>
          `,
          confirmButtonText: 'OK',
        });

        fetchDistribution();
        if (activeTab === 'history') fetchHistory();
      } catch (error) {
        Swal.fire('Lỗi', error.response?.data?.message || 'Không thể cập nhật xếp hạng', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'preview') fetchPreview();
    else if (tab === 'history') fetchHistory();
  };

  const getRankBadge = (rank) => {
    const colors = {
      vip: 'purple',
      gold: 'warning',
      silver: 'secondary',
      bronze: 'info',
    };
    return <Badge value={rank.toUpperCase()} severity={colors[rank] || 'info'} />;
  };

  const changeBodyTemplate = (rowData) => {
    if (!rowData.will_change) return '-';
    return (
      <span className="font-semibold text-green-600">
        {rowData.current_rank.toUpperCase()} → {rowData.new_rank.toUpperCase()}
      </span>
    );
  };

  const chartData = distribution
    ? {
        labels: ['Bronze', 'Silver', 'Gold', 'VIP'],
        datasets: [
          {
            data: [
              distribution.distribution.bronze,
              distribution.distribution.silver,
              distribution.distribution.gold,
              distribution.distribution.vip,
            ],
            backgroundColor: ['#CD7F32', '#C0C0C0', '#FFD700', '#9333EA'],
            hoverBackgroundColor: ['#B8722D', '#A8A8A8', '#FFE44D', '#A855F7'],
          },
        ],
      }
    : null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">💎 Quản lý Xếp hạng Khách hàng</h1>
        <button
          onClick={handleRecalculate}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 transition text-white px-5 py-2 rounded-lg shadow disabled:opacity-50"
        >
          {loading ? 'Đang xử lý...' : '🔄 Cập nhật Xếp hạng'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => handleTabChange('preview')}
          className={`px-4 py-2 font-semibold ${activeTab === 'preview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          👁️ Preview
        </button>
        <button
          onClick={() => handleTabChange('history')}
          className={`px-4 py-2 font-semibold ${activeTab === 'history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          📜 Lịch sử
        </button>
        <button
          onClick={() => handleTabChange('distribution')}
          className={`px-4 py-2 font-semibold ${activeTab === 'distribution' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          📊 Phân bố
        </button>
      </div>

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div>
          <p className="mb-4 text-gray-600">
            Preview xếp hạng dựa trên chi tiêu tháng hiện tại (chưa commit vào database)
          </p>
          <DataTable
            value={preview}
            paginator
            rows={20}
            loading={loading}
            stripedRows
            responsiveLayout="scroll"
            emptyMessage="Chưa có dữ liệu preview"
          >
            <Column field="name" header="Khách hàng" sortable headerClassName="bg-gray-200" />
            <Column field="email" header="Email" sortable headerClassName="bg-gray-200" />
            <Column
              field="current_rank"
              header="Hạng hiện tại"
              sortable
              body={(row) => getRankBadge(row.current_rank)}
              headerClassName="bg-gray-200"
              style={{ width: '150px' }}
            />
            <Column
              field="new_rank"
              header="Hạng mới"
              sortable
              body={(row) => getRankBadge(row.new_rank)}
              headerClassName="bg-gray-200"
              style={{ width: '150px' }}
            />
            <Column
              field="total_spent_formatted"
              header="Tổng chi tiêu"
              sortable
              headerClassName="bg-gray-200"
              style={{ width: '180px' }}
            />
            <Column
              header="Thay đổi"
              body={changeBodyTemplate}
              headerClassName="bg-gray-200"
              style={{ width: '200px' }}
            />
          </DataTable>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          <p className="mb-4 text-gray-600">Lịch sử thay đổi xếp hạng của khách hàng</p>
          <DataTable
            value={history}
            paginator
            rows={20}
            loading={loading}
            stripedRows
            responsiveLayout="scroll"
            emptyMessage="Chưa có lịch sử thay đổi"
          >
            <Column
              field="Customer.name"
              header="Khách hàng"
              sortable
              headerClassName="bg-gray-200"
            />
            <Column field="Customer.email" header="Email" sortable headerClassName="bg-gray-200" />
            <Column
              field="old_rank"
              header="Hạng cũ"
              sortable
              body={(row) => (row.old_rank ? getRankBadge(row.old_rank) : '-')}
              headerClassName="bg-gray-200"
              style={{ width: '130px' }}
            />
            <Column
              field="new_rank"
              header="Hạng mới"
              sortable
              body={(row) => getRankBadge(row.new_rank)}
              headerClassName="bg-gray-200"
              style={{ width: '130px' }}
            />
            <Column
              field="total_spent_formatted"
              header="Tổng chi tiêu"
              sortable
              headerClassName="bg-gray-200"
              style={{ width: '180px' }}
            />
            <Column
              field="period_month"
              header="Tháng"
              sortable
              body={(row) => `${row.period_month}/${row.period_year}`}
              headerClassName="bg-gray-200"
              style={{ width: '120px' }}
            />
          </DataTable>
        </div>
      )}

      {/* Distribution Tab */}
      {activeTab === 'distribution' && distribution && (
        <div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">📊 Biểu đồ Phân bố</h3>
              <Chart type="pie" data={chartData} />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">📈 Thống kê Chi tiết</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-purple-100 rounded">
                  <span className="font-semibold">💎 VIP</span>
                  <span className="text-2xl font-bold">{distribution.distribution.vip}</span>
                  <span className="text-sm text-gray-600">{distribution.percentages.vip}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-yellow-100 rounded">
                  <span className="font-semibold">🥇 Gold</span>
                  <span className="text-2xl font-bold">{distribution.distribution.gold}</span>
                  <span className="text-sm text-gray-600">{distribution.percentages.gold}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-100 rounded">
                  <span className="font-semibold">🥈 Silver</span>
                  <span className="text-2xl font-bold">{distribution.distribution.silver}</span>
                  <span className="text-sm text-gray-600">{distribution.percentages.silver}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-orange-100 rounded">
                  <span className="font-semibold">🥉 Bronze</span>
                  <span className="text-2xl font-bold">{distribution.distribution.bronze}</span>
                  <span className="text-sm text-gray-600">{distribution.percentages.bronze}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-100 rounded font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-2xl">{distribution.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RankManagement;
