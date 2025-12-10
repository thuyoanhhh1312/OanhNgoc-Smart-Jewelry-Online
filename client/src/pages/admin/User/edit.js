import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserById, getRoles, updateUser } from '../../../api/userApi';
import Swal from 'sweetalert2'; // import SweetAlert2

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditingSelf, setIsEditingSelf] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getUserById(id);
        setUser(userData);
        setSelectedRoleId(userData.role_id || '');

        const roleData = await getRoles();
        setRoles(roleData);

        // Kiểm tra xem có đang chỉnh sửa chính mình không
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (currentUser && currentUser.id === parseInt(id)) {
          setIsEditingSelf(true);
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: 'Lỗi khi tải dữ liệu người dùng',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSave = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;

      await updateUser(id, user.name, user.email, selectedRoleId, token);

      await Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: 'Cập nhật thành công!',
        timer: 2000,
        timerProgressBar: true,
        confirmButtonText: 'OK',
      });

      navigate('/admin/user');
    } catch (error) {
      console.error('Lỗi cập nhật user:', error);
      Swal.fire({
        icon: 'error',
        title: 'Thất bại',
        text: 'Cập nhật thất bại!',
      });
    }
  };

  if (loading) return <div>Đang tải dữ liệu...</div>;

  return (
    <div className="p-4 max-w-full mx-auto bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Chỉnh sửa Role cho {user.name}</h2>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Email</label>
        <input
          type="email"
          value={user.email}
          readOnly
          className="w-full border border-gray-300 rounded p-2 bg-gray-100 cursor-not-allowed"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Role</label>
        <select
          className="w-full border border-gray-300 rounded p-2"
          value={selectedRoleId}
          onChange={(e) => setSelectedRoleId(e.target.value)}
          disabled={isEditingSelf}
        >
          <option value="">-- Chọn role --</option>
          {roles
            .filter((role) => role.name === 'admin' || role.name === 'staff')
            .map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
        </select>
        {isEditingSelf && (
          <p className="text-red-500 text-sm mt-1">Bạn không thể thay đổi role của chính mình</p>
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={() => navigate('/admin/user')} className="px-4 py-2 bg-gray-300 rounded">
          Hủy
        </button>

        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">
          Lưu
        </button>
      </div>
    </div>
  );
};

export default EditUser;
