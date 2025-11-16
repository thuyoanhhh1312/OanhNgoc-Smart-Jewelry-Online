import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import promotionApi from '../../../api/promotionApi';
import campaignApi from '../../../api/campaignApi';
import Swal from 'sweetalert2';
import Label from '../../../components/form/Label';
import Input from '../../../components/form/input/InputField';
import Button from '../../../components/ui/button/Button';

const EditPromotion = () => {
  const { user } = useSelector((state) => ({ ...state }));
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    promotion_code: '',
    campaign_id: '',
    segment_target: '',
    discount: '',
    usage_limit: '',
    description: '',
  });
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPromotion = async () => {
      try {
        const data = await promotionApi.getPromotionById(id);
        setFormData({
          promotion_code: data.promotion_code,
          campaign_id: data.campaign_id ?? '',
          segment_target: data.segment_target ?? '',
          discount: data.discount,
          usage_limit: data.usage_limit ?? '',
          description: data.description ?? '',
        });
      } catch (error) {
        Swal.fire('Lỗi', 'Không thể tải dữ liệu khuyến mãi', 'error');
      }
    };
    const fetchCampaigns = async () => {
      try {
        const response = await campaignApi.getAllCampaigns({ is_active: true }, user?.token);
        setCampaigns(response.data || []);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      }
    };
    fetchPromotion();
    fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.promotion_code || !formData.discount) {
      Swal.fire('Thông báo', 'Vui lòng nhập đầy đủ các trường bắt buộc', 'warning');
      return;
    }

    setLoading(true);
    try {
      await promotionApi.updatePromotion(
        id,
        {
          promotion_code: formData.promotion_code,
          campaign_id: formData.campaign_id ? Number(formData.campaign_id) : null,
          segment_target: formData.segment_target || null,
          discount: Number(formData.discount),
          usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
          description: formData.description,
        },
        user.token,
      );

      await Swal.fire({
        icon: 'success',
        title: 'Cập nhật thành công!',
        text: 'Cập nhật khuyến mãi thành công!',
        confirmButtonText: 'OK',
      });
      navigate('/admin/promotions');
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể cập nhật khuyến mãi. Vui lòng thử lại!',
        confirmButtonText: 'OK',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Chỉnh sửa Khuyến mãi</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="promotion_code">
            Mã Khuyến mãi <span className="text-red-600">*</span>
          </Label>
          <Input
            id="promotion_code"
            name="promotion_code"
            type="text"
            value={formData.promotion_code}
            onChange={handleChange}
            placeholder="Nhập mã khuyến mãi"
            required
          />
        </div>

        <div>
          <Label htmlFor="campaign_id">Chiến dịch (tuỳ chọn)</Label>
          <select
            id="campaign_id"
            name="campaign_id"
            value={formData.campaign_id}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="">-- Không thuộc chiến dịch nào --</option>
            {campaigns.map((c) => (
              <option key={c.campaign_id} value={c.campaign_id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="segment_target">Đối tượng Khách hàng (tuỳ chọn)</Label>
          <select
            id="segment_target"
            name="segment_target"
            value={formData.segment_target}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="">-- Tất cả khách hàng --</option>
            <option value="birthday">Sinh nhật</option>
            <option value="vip"> VIP</option>
            <option value="gold"> Vàng</option>
            <option value="silver">Bạc</option>
            <option value="bronze">Đồng</option>
          </select>
        </div>

        <div>
          <Label htmlFor="discount">
            Phần trăm Giảm giá <span className="text-red-600">*</span>
          </Label>
          <Input
            id="discount"
            name="discount"
            type="number"
            min="0"
            max="100"
            value={formData.discount}
            onChange={handleChange}
            placeholder="Nhập phần trăm giảm giá"
            required
          />
        </div>
        <div>
          <Label htmlFor="usage_limit">Giới hạn Số lượt dùng</Label>
          <Input
            id="usage_limit"
            name="usage_limit"
            type="number"
            min="1"
            value={formData.usage_limit}
            onChange={handleChange}
            placeholder="Để trống nếu không giới hạn"
          />
        </div>

        <div>
          <Label htmlFor="description">Mô tả</Label>
          <Input
            id="description"
            name="description"
            type="text"
            value={formData.description}
            onChange={handleChange}
            placeholder="Mô tả thêm về khuyến mãi"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
        >
          {loading ? 'Đang xử lý...' : 'Cập nhật Khuyến mãi'}
        </Button>
      </form>
    </div>
  );
};

export default EditPromotion;
