import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import React, { useEffect, useState, useRef } from "react";
import { getUsers, getRoles } from "../../../api/userApi";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const User = () => {
  const { user } = useSelector((state) => ({ ...state }));
  const [users, setUser] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [roles, setRoles] = useState([]);
  const [roleFilter, setRoleFilter] = useState("");

  const navigate = useNavigate();
  const debounceTimeout = useRef(null);

  const roleBodyTemplate = (rowData) => {
    const role = rowData?.Role ? rowData?.Role : null;
    return <>{role ? <div>{role?.name}</div> : <p></p>}</>;
  };

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const roleData = await getRoles();
        setRoles(roleData);
      } catch {
        toast.error("Lấy danh sách role lỗi");
      }
    };

    const fetchUsersInit = async () => {
      try {
        const data = await getUsers();
        setUser(data);
      } catch {
        toast.error("Lấy danh sách người dùng lỗi");
      }
    };

    fetchRoles();
    fetchUsersInit();
  }, []);

  // Gọi API lấy user theo keyword và roleFilter (role_id)
  const fetchUsers = async (searchKeyword = "", roleId = "") => {
    try {
      const data = await getUsers(searchKeyword, roleId);
      setUser(data);
    } catch {
      toast.error("Lấy danh sách người dùng lỗi");
    }
  };

  // Xử lý debounce tìm kiếm
  const handleKeywordChange = (e) => {
    const value = e.target.value;
    setKeyword(value);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchUsers(value, roleFilter);
    }, 500);
  };

  // Xử lý chọn lọc Role
  const handleRoleFilterChange = (e) => {
    const value = e.target.value;
    setRoleFilter(value);
    fetchUsers(keyword, value);
  };

  // Xử lý nút thêm user, chỉ admin mới được
  const handleAddUserClick = () => {
    if (user?.role_id !== 1) {
      toast.error("Bạn không có quyền truy cập chức năng của admin");
      return;
    }
    navigate("/admin/user/add");
  };

  return (
    <div className="bg-[#FFFFFF] p-4 rounded-lg shadow-md">
      <ToastContainer />
      {/* Tiêu đề */}
      <div className="flex flex-row justify-between items-center mb-4">
        <h1 className="text-[32px] font-bold ">User List</h1>
        <div>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={handleAddUserClick}
          >
            Add New User
          </button>
        </div>
      </div>

      {/* Thanh tìm kiếm và lọc Role */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, email, số điện thoại..."
          className="border border-gray-300 rounded p-2 flex-1"
          value={keyword}
          onChange={handleKeywordChange}
        />
        <select
          className="border border-gray-300 rounded p-2"
          value={roleFilter}
          onChange={handleRoleFilterChange}
        >
          <option value="">-- Lọc theo Role --</option>
          {roles
            .filter((role) => role.name === "admin" || role.name === "staff")
            .map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
        </select>
      </div>

      {/* Bảng danh sách user */}
      <DataTable
        value={users}
        paginator
        rows={10}
        showGridlines
        paginatorTemplate="PrevPageLink PageLinks NextPageLink"
      >
        <Column
          field="name"
          header="Tên"
          sortable
          headerClassName="bg-[#d2d4d6]"
        />
        <Column
          field="email"
          header="Email"
          sortable
          headerClassName="bg-[#d2d4d6]"
        />
        <Column
          field="Role"
          header="Role"
          sortable
          headerClassName="bg-[#d2d4d6]"
          body={roleBodyTemplate}
        />
        <Column
          body={(rowData) => {
            const handleEditClick = () => {
              if (user?.role_id !== 1) {
                toast.error("Bạn không có quyền truy cập chức năng của admin");
                return;
              }
              navigate(`/admin/user/edit/${rowData.id}`);
            };

            return (
              <div className="flex flex-row gap-2">
                <button
                  onClick={handleEditClick}
                  className="bg-green-500 text-white px-4 py-2 rounded"
                >
                  Edit
                </button>
              </div>
            );
          }}
          header="Actions"
          headerClassName="bg-[#d2d4d6]"
        />
      </DataTable>
    </div>
  );
};

export default User;
