import React, { useEffect, useState, useRef } from 'react';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { getCustomers } from '../../../api/customerApi';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const CustomerList = () => {
  const { user } = useSelector((state) => ({ ...state }));
  const [customers, setCustomers] = useState([]);
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();
  // Ref để giữ timeout debounce
  const debounceTimeout = useRef(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (searchKeyword = '') => {
    try {
      const data = await getCustomers(searchKeyword);
      setCustomers(data);
    } catch (error) {
      alert('Lấy danh sách khách hàng lỗi');
    }
  };

  // Hàm gọi khi input thay đổi
  const handleKeywordChange = (e) => {
    const value = e.target.value;
    setKeyword(value);

    // Clear timeout nếu người dùng gõ tiếp
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Đặt timeout gọi API sau 500ms kể từ lần gõ cuối
    debounceTimeout.current = setTimeout(() => {
      fetchCustomers(value);
    }, 500);
  };

  // Template cho cột tên khách hàng với giới hạn chiều rộng
  const nameBodyTemplate = (rowData) => (
    <div
      title={rowData.name}
      className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]"
    >
      {rowData.name}
    </div>
  );

  const totalOrderAmountBodyTemplate = (rowData) => {
    const totalAmount = rowData.totalOrderAmount;
    return (
      <p className="text-gray-700">
        {totalAmount
          ? new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(totalAmount)
          : ''}
      </p>
    );
  };

  const formatDate = (dateStr) => (dateStr ? dayjs(dateStr).format('DD/MM/YYYY') : '');

  const segmentBodyTemplate = (rowData) => {
    const map = {
      vip: 'VIP',
      gold: 'Vàng',
      silver: 'Bạc',
      bronze: 'Đồng',
    };
    return map[rowData.segment_type] || '';
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex flex-row justify-between items-center mb-4">
        <h1 className="text-[32px] font-bold">Customer List</h1>
      </div>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, email, số điện thoại..."
          className="border border-gray-300 rounded p-2 flex-1"
          value={keyword}
          onChange={handleKeywordChange}
        />
      </div>

      <DataTable
        value={customers}
        paginator
        rows={10}
        showGridlines
        paginatorTemplate="PrevPageLink PageLinks NextPageLink"
        emptyMessage="Không có dữ liệu khách hàng"
        responsiveLayout="scroll"
      >
        <Column
          field="name"
          header="Họ tên"
          sortable
          headerClassName="bg-gray-200"
          body={nameBodyTemplate}
        />
        <Column field="email" header="Email" sortable headerClassName="bg-gray-200" />
        <Column field="phone" header="Điện thoại" sortable headerClassName="bg-gray-200" />
        <Column field="gender" header="Giới tính" sortable headerClassName="bg-gray-200" />
        <Column
          field="birthday"
          header="Ngày sinh"
          sortable
          headerClassName="bg-gray-200"
          body={(row) => formatDate(row.birthday)}
        />
        <Column
          field="segment_type"
          header="Xếp hạng"
          sortable
          headerClassName="bg-gray-200"
          body={segmentBodyTemplate}
        />
        <Column field="address" header="Địa chỉ" sortable headerClassName="bg-gray-200" />
        <Column
          field="orderCount"
          header="Số lượng đơn hàng"
          sortable
          headerClassName="bg-gray-200"
        />
        <Column
          field="totalOrderAmount"
          header="Tổng tiền đơn hàng"
          sortable
          headerClassName="bg-gray-200"
          body={totalOrderAmountBodyTemplate}
        />
        <Column
          field="positiveReviewCount"
          header="Đánh giá tích cực"
          sortable
          headerClassName="bg-gray-200"
        />
        <Column
          field="negativeReviewCount"
          header="Đánh giá tiêu cực"
          sortable
          headerClassName="bg-gray-200"
        />
        <Column
          field="neutralReviewCount"
          header="Đánh giá trung tính"
          sortable
          headerClassName="bg-gray-200"
        />
      </DataTable>
    </div>
  );
};

export default CustomerList;
