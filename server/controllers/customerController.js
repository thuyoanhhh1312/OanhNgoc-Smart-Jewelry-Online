import db from '../models/index.js';
import { Op, fn, col, literal } from 'sequelize';
// Lấy khách hàng theo ID
export const getCustomerById = async (req, res) => {
  const { id } = req.params;
  try {
    const customer = await db.Customer.findByPk(id);
    if (!customer) return res.status(404).json({ message: 'Khách hàng không tìm thấy' });
    res.status(200).json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy khách hàng', error: err.message });
  }
};

// Lấy danh sách email khách hàng (dùng cho chọn gửi email thủ công)
export const getCustomerEmails = async (req, res) => {
  try {
    const { keyword } = req.query;
    const where = {};

    if (keyword && keyword.trim() !== '') {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const customers = await db.Customer.findAll({
      attributes: ['customer_id', 'name', 'email', 'segment_type'],
      where,
      include: [
        {
          model: db.User,
          attributes: [],
          where: { role_id: 2 }, // chỉ lấy user role customer
          required: true,
        },
      ],
      order: [['name', 'ASC']],
      limit: 500,
    });

    res.status(200).json(customers);
  } catch (err) {
    res.status(500).json({
      message: 'Lỗi khi lấy danh sách email khách hàng',
      error: err.message,
    });
  }
};

// Xóa khách hàng
export const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const customer = await db.Customer.findByPk(id);
    if (!customer) return res.status(404).json({ message: 'Khách hàng không tìm thấy' });

    await customer.destroy();
    res.status(200).json({ message: 'Khách hàng đã được xóa' });
  } catch (err) {
    res.status(400).json({ message: 'Lỗi khi xóa khách hàng', error: err.message });
  }
};

// Lấy danh sách khách hàng kèm số lượng đơn hàng và tổng tiền đơn hàng
export const getAllCustomers = async (req, res) => {
  const { keyword } = req.query;

  try {
    let whereClause = {};
    if (keyword && keyword.trim() !== '') {
      whereClause = {
        [Op.or]: [
          { name: { [Op.like]: `%${keyword}%` } },
          { email: { [Op.like]: `%${keyword}%` } },
          { phone: { [Op.like]: `%${keyword}%` } },
          { gender: { [Op.like]: `%${keyword}%` } },
          { address: { [Op.like]: `%${keyword}%` } },
        ],
      };
    }

    const customers = await db.Customer.findAll({
      where: whereClause,
      attributes: {
        include: [
          // Đếm số đơn hàng
          [fn('COUNT', col('Orders.order_id')), 'orderCount'],
          // Tổng tiền đơn hàng (COALESCE xử lý null)
          [fn('COALESCE', fn('SUM', col('Orders.total')), 0), 'totalOrderAmount'],

          // Đếm đánh giá tích cực (POS)
          [
            literal(`(
              SELECT COUNT(*) FROM product_review AS pr
              WHERE pr.customer_id = Customer.customer_id AND pr.sentiment = 'POS'
            )`),
            'positiveReviewCount'
          ],
          // Đếm đánh giá tiêu cực (NEG)
          [
            literal(`(
              SELECT COUNT(*) FROM product_review AS pr
              WHERE pr.customer_id = Customer.customer_id AND pr.sentiment = 'NEG'
            )`),
            'negativeReviewCount'
          ],
          // Đếm đánh giá trung tính (NEU)
          [
            literal(`(
              SELECT COUNT(*) FROM product_review AS pr
              WHERE pr.customer_id = Customer.customer_id AND pr.sentiment = 'NEU'
            )`),
            'neutralReviewCount'
          ],
        ],
      },
      include: [
        {
          model: db.Order,
          attributes: [],
          required: false, // lấy cả khách hàng chưa có đơn hàng
        },
      ],
      group: ['Customer.customer_id'],
      order: [['customer_id', 'ASC']],
      raw: true,  // để kết quả trả về object thuần, dễ dùng frontend
    });

    return res.status(200).json(customers);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Lỗi khi lấy danh sách khách hàng',
      error: err.message,
    });
  }
};

export const updateCustomerProfile = async (req, res) => {
  // Lấy userId từ token (đã qua middleware authenticateToken)
  const userId = req.user.userId;
  const { name, phone, gender, address } = req.body;

  const t = await db.sequelize.transaction();

  try {
    // Tìm customer theo user_id
    let customer = await db.Customer.findOne({ where: { user_id: userId }, transaction: t });

    if (!customer) {
      // Nếu chưa có record customer, tạo mới
      // Lấy email từ User để tạo Customer đầy đủ
      const user = await db.User.findByPk(userId, { transaction: t });
      if (!user) {
        await t.rollback();
        return res.status(404).json({ message: "Người dùng không tồn tại" });
      }

      customer = await db.Customer.create(
        {
          user_id: userId,
          name: name || user.name,
          email: user.email,
          phone: phone || null,
          gender: gender || null,
          address: address || null,
        },
        { transaction: t }
      );
    } else {
      // Cập nhật các trường thông tin cá nhân
      if (name !== undefined) customer.name = name;
      if (phone !== undefined) customer.phone = phone;
      if (gender !== undefined) customer.gender = gender;
      if (address !== undefined) customer.address = address;

      await customer.save({ transaction: t });

      // Đồng bộ lại tên User (nếu cần)
      if (name !== undefined) {
        const user = await db.User.findByPk(userId, { transaction: t });
        if (user) {
          user.name = name;
          await user.save({ transaction: t });
        }
      }
    }

    await t.commit();

    return res.status(200).json({
      message: "Cập nhật thông tin cá nhân thành công",
      customer,
    });
  } catch (err) {
    await t.rollback();
    return res.status(400).json({
      message: "Lỗi khi cập nhật thông tin cá nhân",
      error: err.message,
    });
  }
};

export const getCustomer = async (req, res) => {
  const { userId } = req.params;

  try {
    const customer = await db.Customer.findOne({ where: { user_id: userId } });
    if (!customer) return res.status(404).json({ message: 'Khách hàng không tìm thấy' });
    res.status(200).json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy khách hàng', error: err.message });
  }
};

