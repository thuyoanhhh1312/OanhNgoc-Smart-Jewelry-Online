import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import { Dropdown } from 'antd';
import promotionLogApi from '../../../api/promotionLogApi';
import promotionApi from '../../../api/promotionApi';
import campaignApi from '../../../api/campaignApi';
import Label from '../../../components/form/Label';
import Input from '../../../components/form/input/InputField';
import Button from '../../../components/ui/button/Button';
import { getCustomerEmails } from '../../../api/customerApi';

const SendPromotion = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => ({ ...state }));

  const [mode, setMode] = useState('promotion'); // 'promotion' | 'campaign'
  const [promotionId, setPromotionId] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [emailOptions, setEmailOptions] = useState([]);
  const [forceResend, setForceResend] = useState(false);
  const [promotions, setPromotions] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const dropdownRef = useRef(null);
  const [dropdownWidth, setDropdownWidth] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [promotionRes, campaignRes] = await Promise.all([
          promotionApi.getPromotions(),
          campaignApi.getAllCampaigns({}, user?.token),
        ]);
        setPromotions(promotionRes?.data || promotionRes || []);
        setCampaigns(campaignRes?.data || []);
        loadEmails('');
      } catch (error) {
        console.error('Error loading promotions/campaigns:', error);
        Swal.fire('Lỗi', 'Không tải được danh sách khuyến mãi/campaign', 'error');
      }
    };

    fetchData();
    const measureWidth = () => {
      if (dropdownRef.current) {
        setDropdownWidth(dropdownRef.current.offsetWidth);
      }
    };
    measureWidth();
    window.addEventListener('resize', measureWidth);
    return () => window.removeEventListener('resize', measureWidth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEmails = async (keyword = '') => {
    setLoadingEmails(true);
    try {
      const data = await getCustomerEmails(keyword, user?.token);
      setEmailOptions(data || []);
    } catch (error) {
      console.error('Error loading customer emails:', error);
      Swal.fire('Lỗi', 'Không tải được danh sách khách hàng', 'error');
    } finally {
      setLoadingEmails(false);
    }
  };

  const selectedCustomerIds = useMemo(() => {
    if (!selectedEmails || selectedEmails.length === 0) return [];
    const emailToId = new Map(
      emailOptions.map((c) => [c.email, c.customer_id])
    );
    return selectedEmails
      .map((email) => emailToId.get(email))
      .filter((id) => !!id);
  }, [selectedEmails, emailOptions]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'promotion' && !promotionId) {
      Swal.fire('Thiếu thông tin', 'Vui lòng chọn mã khuyến mãi', 'warning');
      return;
    }

    if (mode === 'campaign' && !campaignId) {
      Swal.fire('Thiếu thông tin', 'Vui lòng chọn campaign', 'warning');
      return;
    }

    const payload = {
      force_resend: forceResend,
    };

    if (selectedCustomerIds.length > 0) {
      payload.customer_ids = selectedCustomerIds;
    }

    if (mode === 'promotion') {
      payload.promotion_id = Number(promotionId);
    } else {
      payload.campaign_id = Number(campaignId);
    }

    setLoading(true);
    try {
      const result = await promotionLogApi.sendPromotionManually(payload, user?.token);
      await Swal.fire({
        icon: 'success',
        title: 'Đã gửi',
        html: `Gửi thủ công hoàn tất.<br/>✅ Sent: ${result.summary?.sent || 0}<br/>⏭️ Skipped: ${
          result.summary?.skipped || 0
        }<br/>❌ Failed: ${result.summary?.failed || 0}`,
      });
      navigate('/admin/promotion-logs');
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Gửi thất bại. Vui lòng thử lại.';
      Swal.fire('Lỗi', message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderPromotionSelect = () => (
    <div>
      <Label htmlFor="promotionId">
        Chọn mã khuyến mãi <span className="text-red-500">*</span>
      </Label>
      <select
        id="promotionId"
        value={promotionId}
        onChange={(e) => setPromotionId(e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2"
      >
        <option value="">-- Chọn mã khuyến mãi --</option>
        {promotions.map((p) => (
          <option key={p.promotion_id} value={p.promotion_id}>
            {p.promotion_code} {p.segment_target ? `(${p.segment_target})` : ''} - Giảm {p.discount}%
          </option>
        ))}
      </select>
    </div>
  );

  const renderCampaignSelect = () => (
    <div>
      <Label htmlFor="campaignId">
        Chọn campaign <span className="text-red-500">*</span>
      </Label>
      <select
        id="campaignId"
        value={campaignId}
        onChange={(e) => setCampaignId(e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2"
      >
        <option value="">-- Chọn campaign --</option>
        {campaigns.map((c) => (
          <option key={c.campaign_id} value={c.campaign_id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );

  const emailItems = useMemo(
    () =>
      emailOptions.map((c) => ({
        key: c.email,
        label: (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedEmails.includes(c.email)}
              onChange={() => handleEmailToggle(c.email)}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex flex-col">
              <span className="font-medium">{c.email}</span>
              <span className="text-xs text-gray-500">
                {c.name} {c.segment_type ? `(${c.segment_type})` : ''}
              </span>
            </div>
          </div>
        ),
      })),
    [emailOptions, selectedEmails]
  );

  const handleEmailToggle = (email) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Gửi Email Khuyến mãi Thủ công</h2>
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:underline text-sm"
        >
          ← Quay lại
        </button>
      </div>

      <p className="text-gray-600 mb-6">
        Chọn gửi theo mã khuyến mãi hoặc theo campaign. Nếu để trống danh sách khách hàng,
        hệ thống sẽ tự tính target theo segment của promotion/campaign. Bật "Gửi lại" nếu muốn bỏ qua kiểm tra log cũ.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="promotion"
              checked={mode === 'promotion'}
              onChange={() => setMode('promotion')}
            />
            <span>Gửi theo mã khuyến mãi</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="campaign"
              checked={mode === 'campaign'}
              onChange={() => setMode('campaign')}
            />
            <span>Gửi theo campaign</span>
          </label>
        </div>

        {mode === 'promotion' ? renderPromotionSelect() : renderCampaignSelect()}

        <div>
          <Label htmlFor="customerEmails">Chọn khách hàng theo email (tùy chọn)</Label>

          <Dropdown
            placement="bottomLeft"
            getPopupContainer={(trigger) => trigger.parentElement}
            overlayStyle={{
              width: dropdownWidth || 400,
              minWidth: dropdownWidth || 400,
            }}
            dropdownRender={(menu) => (
              <div
                className="p-2"
                style={{
                  width: dropdownWidth || 400,
                  minWidth: dropdownWidth || 400,
                }}
              >
                <div className="flex flex-col gap-2">
                  {loadingEmails && (
                    <div className="text-sm text-gray-500">Đang tải...</div>
                  )}
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>{menu}</div>
                </div>
              </div>
            )}
            menu={{
              items: emailItems,
              onClick: ({ key }) => handleEmailToggle(key),
            }}
            trigger={['click']}
          >
            <button
              type="button"
              ref={dropdownRef}
              className="border border-gray-300 rounded px-4 py-2 bg-white hover:bg-gray-50 shadow-sm w-full text-left"
            >
              Chọn email ({selectedEmails.length} đã chọn)
            </button>
          </Dropdown>

          {selectedCustomerIds.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedEmails.map((email) => (
                <span
                  key={email}
                  className="bg-blue-100 text-blue-700 text-sm px-2 py-1 rounded-full"
                >
                  {email}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            id="forceResend"
            type="checkbox"
            checked={forceResend}
            onChange={(e) => setForceResend(e.target.checked)}
          />
          <Label htmlFor="forceResend" className="!m-0">
            Gửi lại (bỏ qua kiểm tra đã gửi)
          </Label>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Đang gửi...' : 'Gửi email'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/promotion-logs')}
          >
            Hủy
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SendPromotion;
