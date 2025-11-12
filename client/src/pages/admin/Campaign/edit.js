import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import campaignApi from '../../../api/campaignApi';
import Swal from 'sweetalert2';
import Label from '../../../components/form/Label';
import Input from '../../../components/form/input/InputField';
import Button from '../../../components/ui/button/Button';

const EditCampaign = () => {
  const { user } = useSelector((state) => ({ ...state }));
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const response = await campaignApi.getCampaignById(id, user?.token);
        const campaign = response.data;

        // Format dates for datetime-local input
        const formatDateForInput = (dateStr) => {
          const date = new Date(dateStr);
          return date.toISOString().slice(0, 16);
        };

        setFormData({
          name: campaign.name || '',
          description: campaign.description || '',
          start_date: formatDateForInput(campaign.start_date),
          end_date: formatDateForInput(campaign.end_date),
          is_active: campaign.is_active,
        });
      } catch (error) {
        Swal.fire('Lỗi', 'Không thể tải thông tin chiến dịch', 'error');
        navigate('/admin/campaigns');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchCampaign();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.start_date || !formData.end_date) {
      Swal.fire('Thông báo', 'Vui lòng nhập đầy đủ các trường bắt buộc', 'warning');
      return;
    }

    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      Swal.fire('Thông báo', 'Ngày kết thúc phải sau ngày bắt đầu', 'warning');
      return;
    }

    setLoading(true);
    try {
      await campaignApi.updateCampaign(
        id,
        {
          name: formData.name,
          description: formData.description,
          start_date: new Date(formData.start_date).toISOString(),
          end_date: new Date(formData.end_date).toISOString(),
          is_active: formData.is_active,
        },
        user.token,
      );
      await Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: 'Cập nhật chiến dịch thành công!',
        confirmButtonText: 'OK',
      });
      navigate('/admin/campaigns');
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error.response?.data?.message || 'Không thể cập nhật chiến dịch. Vui lòng thử lại!',
        confirmButtonText: 'OK',
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">✏️ Chỉnh sửa Chiến dịch Khuyến mãi</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="name">
            Tên Chiến dịch <span className="text-red-600">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ví dụ: Khuyến mãi sinh nhật 2024"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Mô tả</Label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Mô tả chi tiết về chiến dịch..."
            className="w-full border border-gray-300 rounded px-3 py-2 min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date">
              Ngày bắt đầu <span className="text-red-600">*</span>
            </Label>
            <Input
              id="start_date"
              name="start_date"
              type="datetime-local"
              value={formData.start_date}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="end_date">
              Ngày kết thúc <span className="text-red-600">*</span>
            </Label>
            <Input
              id="end_date"
              name="end_date"
              type="datetime-local"
              value={formData.end_date}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            checked={formData.is_active}
            onChange={handleChange}
            className="w-4 h-4"
          />
          <Label htmlFor="is_active" className="mb-0">
            Kích hoạt
          </Label>
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded"
          >
            {loading ? 'Đang xử lý...' : '💾 Lưu thay đổi'}
          </Button>
          <Button
            type="button"
            onClick={() => navigate('/admin/campaigns')}
            className="px-6 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded"
          >
            Hủy
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditCampaign;
