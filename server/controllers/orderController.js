import db from "../models/index.js";
import { Sequelize, Op } from "sequelize"; // Sequelize và Op được sử dụng để tương tác với cơ sở dữ liệu.
// Op: là một đối tượng chứa các toán tử so sánh được sử dụng trong các truy vấn Sequelize.
// sequelize là một ORM (Object-Relational Mapping) cho Node.js, giúp tương tác với cơ sở dữ liệu một cách dễ dàng hơn.(MySQL)

export const getAllOrders = async (req, res) => {
  // req: đối tượng request của Express (chứa thông tin yêu cầu từ client).
  // res: đối tượng response của Express (dùng để gửi phản hồi về client).
  // Hàm này sẽ lấy tất cả đơn hàng từ cơ sở dữ liệu và trả về dưới dạng JSON.
  try {
    const orders = await db.Order.findAll({
      include: [
        {
          model: db.Customer,
          attributes: ["name", "email", "phone"],
        },
        {
          model: db.User,
          attributes: ["name"],
        },
        {
          model: db.Promotion,
          attributes: ["promotion_code"],
        },
        {
          model: db.OrderStatus,
          attributes: ["status_name", "color_code"],
        },
        {
          model: db.OrderItem,
          attributes: ["quantity", "price"],
          include: [
            {
              model: db.Product,
              attributes: ["product_name"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    res.status(200).json(orders); // Trả về danh sách đơn hàng dưới dạng JSON với mã trạng thái 200 (OK).
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn hàng:", error);
    res.status(500).json({
      message: "Lỗi khi lấy danh sách đơn hàng",
      error: error.message,
    });
  }
};

export const getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await db.Order.findByPk(id, {
      include: [
        {
          model: db.Customer,
          attributes: ["name", "email", "phone"],
        },
        {
          model: db.OrderStatus,
          attributes: ["status_name", "color_code"],
        },
        {
          model: db.OrderItem,
          attributes: ["quantity", "price"],
          include: [
            {
              model: db.Product,
              attributes: ["product_name"],
            },
          ],
        },
        {
          model: db.Promotion,
          attributes: ["promotion_code"],
        },
      ],
    });
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    res.status(200).json(order);
  } catch (error) {
    console.error("Lỗi khi lấy đơn hàng:", error);
    res.status(500).json({
      message: "Lỗi khi lấy đơn hàng",
      error: error.message,
    });
  }
};

export const updatedOrder = async (req, res) => {
  const { id } = req.params;
  const { status_id } = req.body;
  try {
    const order = await db.Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    if (status_id === 4 || status_id === 5) {
      return res.status(404).json({
        message: "Không được phép chỉnh sửa đơn hàng đã giao hoặc đã hủy",
      });
    }
    order.status_id = status_id;
    await order.save();
    res.status(200).json({ message: "Cập nhật đơn hàng thành công" });
  } catch (error) {
    console.error("Lỗi khi cập nhật đơn hàng:", error);
    res.status(500).json({
      message: "Lỗi khi cập nhật đơn hàng",
      error: error.message,
    });
  }
};

export const updatedStaff = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;
  try {
    const order = await db.Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    order.user_id = user_id;
    await order.save();
    res.status(200).json({ message: "Cập nhật đơn hàng thành công" });
  } catch (error) {
    console.error("Lỗi khi cập nhật đơn hàng:", error);
    res.status(500).json({
      message: "Lỗi khi cập nhật đơn hàng",
      error: error.message,
    });
  }
};

export const getOrderByCustomer = async (req, res) => {
  const { user_id } = req.params;
  const customer = await db.Customer.findOne({
    where: { user_id },
  });

  const customer_id = customer?.customer_id;
  try {
    const orders = await db.Order.findAll({
      where: { customer_id: customer_id },
      include: [
        {
          model: db.Customer,
          attributes: ["name", "email", "phone"],
        },
        {
          model: db.Promotion,
          attributes: ["promotion_code"],
        },
        {
          model: db.OrderStatus,
          attributes: ["status_name", "color_code"],
        },
        {
          model: db.OrderItem,
          attributes: ["quantity", "price"],
          include: [
            {
              model: db.Product,
              attributes: ["product_name"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    if (!orders) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    res.status(200).json(orders);
  } catch (error) {
    console.error("Lỗi khi lấy đơn hàng:", error);
    res.status(500).json({
      message: "Lỗi khi lấy đơn hàng",
      error: error.message,
    });
  }
};

export const createOrder = async (req, res) => {
  const {
    customer_id,
    user_id,
    promotion_id,
    sub_total,
    discount,
    total,
    shipping_address,
    payment_method,
  } = req.body;

  try {
    const deposit = (total * 0.1).toFixed(2); // 10% đặt cọc giữ 2 số thập phân
    const order = await db.Order.create({
      customer_id,
      user_id,
      promotion_id,
      sub_total,
      discount,
      total,
      deposit,
      deposit_status: "pending", // Trạng thái đặt cọc ban đầu là đang chờ
      shipping_address,
      payment_method,
      status_id: 1, // trạng thái mới tạo
    });
    // trả về client thông tin đơn hàng vừa tạo
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: "Lỗi tạo đơn hàng", error: err.message });
  }
};

export const updateIsDeposit = async (req, res) => {
  const { id } = req.params;
  const { is_deposit } = req.body;
  try {
    const order = await db.Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    order.is_deposit = is_deposit;
    await order.save();
    res.status(200).json({ message: "Cập nhật trạng thái đặt cọc thành công" });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái đặt cọc:", error);
    res.status(500).json({
      message: "Lỗi khi cập nhật trạng thái đặt cọc",
      error: error.message,
    });
  }
};

export const calculatePrice = async (req, res) => {
  try {
    console.log("[calculatePrice] payload:", JSON.stringify(req.body));
    const { items, promotion_code, user_id } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "Danh sách sản phẩm không được để trống." });
    }
    if (!user_id) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp mã người dùng." });
    }

    // Lấy customer_id từ user_id
    const customer = await db.Customer.findOne({
      where: { user_id },
    });

    if (!customer) {
      return res
        .status(400)
        .json({ message: "Không tìm thấy khách hàng với user_id đã cho." });
    }

    const customer_id = customer.customer_id;

    const productIds = items.map((i) => i.product_id);
    const products = await db.Product.findAll({
      where: { product_id: productIds },
    });

    if (products.length !== productIds.length) {
      return res
        .status(400)
        .json({ message: "Một số sản phẩm không tồn tại trong hệ thống." });
    }

    let sub_total = 0;
    for (const item of items) {
      const product = products.find((p) => p.product_id === item.product_id);
      if (!product) {
        return res.status(400).json({
          message: `Sản phẩm có ID ${item.product_id} không tồn tại.`,
        });
      }
      if (product.quantity < item.quantity) {
        return res.status(400).json({
          message: `Sản phẩm "${product.product_name}" không đủ số lượng trong kho (còn ${product.quantity}).`,
        });
      }
      sub_total += Number(product.price) * item.quantity;
    }

    let discount = 0;
    let valid = false;
    let message = "Không có mã khuyến mãi áp dụng.";
    let promoInfo = null;

    if (promotion_code) {
      // Kiểm tra mã khuyến mãi, ngày bắt đầu/kết thúc từ campaign, usage_limit
      const promo = await db.Promotion.findOne({
        where: {
          promotion_code,
        },
        include: [
          {
            model: db.PromotionCampaign,
            as: "campaign",
            attributes: ["start_date", "end_date", "is_active"],
            required: false,
          },
        ],
      });

      const now = new Date();
      const inCampaignWindow = promo?.campaign
        ? promo.campaign.is_active !== false &&
          promo.campaign.start_date <= now &&
          promo.campaign.end_date >= now
        : true;

      if (!promo || !inCampaignWindow) {
        message = "Mã khuyến mãi không hợp lệ hoặc đã hết hạn.";
      } else if (
        promo.usage_limit !== null &&
        promo.usage_count >= promo.usage_limit
      ) {
        message = "Mã khuyến mãi đã hết lượt sử dụng.";
      } else {
        // Kiểm tra khách hàng đã dùng mã này chưa
        const used = await db.PromotionUsage.findOne({
          where: {
            customer_id,
            promotion_id: promo.promotion_id,
          },
        });
        if (used) {
          message = "Bạn đã sử dụng mã này rồi.";
        } else {
          discount = sub_total * (Number(promo.discount) / 100);
          valid = true;
          message = `Mã khuyến mãi hợp lệ, giảm ${
            promo.discount
          }% (${discount.toLocaleString("vi-VN")} đ).`;
          promoInfo = {
            promotion_code: promo.promotion_code,
            description: promo.description,
            discount_percent: promo.discount,
          };
        }
      }
    }

    let total = sub_total - discount;
    if (total < 0) total = 0;

    return res.json({
      sub_total,
      discount,
      total,
      valid,
      message,
      promotion: promoInfo,
    });
  } catch (error) {
    console.error("calculatePrice error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi tính toán giá." });
  }
};

export const checkout = async (req, res) => {
  const t = await db.sequelize.transaction();
  let finished = false;

  try {
    const {
      user_id = null,
      promotion_code = null,
      payment_method = null,
      shipping_address = null,
      is_deposit = false,
      items = [],
    } = req.body;
    console.log("[checkout] payload:", JSON.stringify(req.body));

    // Tìm customer_id từ user_id
    let customer = await db.Customer.findOne({
      where: { user_id },
      transaction: t,
    });

    let customer_id;

    if (!customer) {
      // Nếu không có Customer, tìm User và tạo Customer mới
      const user = await db.User.findOne({
        where: { id: user_id },
        transaction: t,
      });

      if (!user) {
        await t.rollback();
        return res
          .status(400)
          .json({ message: "Không tìm thấy người dùng với user_id đã cho." });
      }

      // Tạo số điện thoại ngẫu nhiên
      const generateRandomPhone = () => {
        let phone = "0";
        for (let i = 0; i < 9; i++) {
          phone += Math.floor(Math.random() * 10);
        }
        return phone;
      };

      // Tạo Customer mới từ User data
      customer = await db.Customer.create(
        {
          user_id,
          name: user.name,
          email: user.email,
          phone: generateRandomPhone(),
          gender: null,
          address: null,
        },
        { transaction: t }
      );
    }

    customer_id = customer.customer_id;

    let deposit_status = req.body.deposit_status ?? "none";

    // Kiểm tra các điều kiện
    if (!customer_id) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp mã khách hàng." });
    }
    if (!Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "Danh sách sản phẩm không được để trống." });
    }

    // Kiểm tra các sản phẩm
    const productIds = items.map((i) => i.product_id);
    const products = await db.Product.findAll({
      where: { product_id: productIds },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (products.length !== productIds.length) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "Một số sản phẩm không tồn tại trong hệ thống." });
    }

    let sub_total = 0;
    for (const item of items) {
      const product = products.find((p) => p.product_id === item.product_id);
      if (!product) {
        await t.rollback();
        return res.status(400).json({
          message: `Sản phẩm có ID ${item.product_id} không tồn tại.`,
        });
      }
      if (product.quantity < item.quantity) {
        await t.rollback();
        return res.status(400).json({
          message: `Sản phẩm "${product.product_name}" không đủ số lượng trong kho (còn ${product.quantity}).`,
        });
      }
      // Luôn dùng giá hiện tại từ DB để tránh lệch giá
      sub_total += Number(product.price) * item.quantity;
    }

    let discount = 0;
    let promotion_id = null;

    if (promotion_code) {
      const promo = await db.Promotion.findOne({
        where: {
          promotion_code,
        },
        include: [
          {
            model: db.PromotionCampaign,
            as: "campaign",
            attributes: ["start_date", "end_date", "is_active"],
            required: false,
          },
        ],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      const now = new Date();
      const inCampaignWindow = promo?.campaign
        ? promo.campaign.is_active !== false &&
          promo.campaign.start_date <= now &&
          promo.campaign.end_date >= now
        : true;

      if (!promo || !inCampaignWindow) {
        await t.rollback();
        return res
          .status(400)
          .json({ message: "Mã khuyến mãi không hợp lệ hoặc đã hết hạn." });
      }

      // Kiểm tra lượt dùng
      if (
        promo.usage_limit !== null &&
        promo.usage_count >= promo.usage_limit
      ) {
        await t.rollback();
        return res
          .status(400)
          .json({ message: "Mã khuyến mãi đã hết lượt sử dụng." });
      }

      // Kiểm tra khách đã dùng chưa
      const used = await db.PromotionUsage.findOne({
        where: {
          customer_id,
          promotion_id: promo.promotion_id,
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (used) {
        await t.rollback();
        return res.status(400).json({ message: "Bạn đã sử dụng mã này rồi." });
      }

      discount = +(sub_total * (Number(promo.discount) / 100)).toFixed(2);
      promotion_id = promo.promotion_id;
    }

    let total = sub_total - discount;
    if (total < 0) total = 0;

    let deposit = 0;
    if (is_deposit) {
      deposit = Number((total * 0.1).toFixed(2));
      if (!["pending", "paid", "none"].includes(deposit_status)) {
        await t.rollback();
        return res
          .status(400)
          .json({ message: "Trạng thái đặt cọc không hợp lệ." });
      }
    } else {
      deposit_status = "none";
    }

    // Tạo đơn hàng
    const order = await db.Order.create(
      {
        customer_id,
        user_id,
        promotion_id,
        status_id: 1,
        sub_total,
        discount,
        total,
        deposit,
        is_deposit,
        deposit_status,
        shipping_address,
        payment_method,
        transaction_id: null, // Sẽ được update khi thanh toán (VNPay/MoMo)
        payment_details: null, // Sẽ được update khi thanh toán (VNPay/MoMo)
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction: t }
    );

    // Tạo chi tiết đơn hàng
    const orderItemsData = items.map((item) => ({
      order_id: order.order_id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      total_price: item.quantity * item.price,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    await db.OrderItem.bulkCreate(orderItemsData, { transaction: t });

    // Cập nhật tồn kho và số lượng bán
    for (const item of items) {
      await db.Product.update(
        {
          quantity: db.Sequelize.literal(`quantity - ${item.quantity}`),
          sold_quantity: db.Sequelize.literal(
            `sold_quantity + ${item.quantity}`
          ),
        },
        {
          where: { product_id: item.product_id },
          transaction: t,
        }
      );
    }

    // Tăng usage_count + lưu lịch sử dùng mã khuyến mãi
    if (promotion_id) {
      await db.Promotion.update(
        {
          usage_count: db.Sequelize.literal("usage_count + 1"),
        },
        {
          where: { promotion_id },
          transaction: t,
        }
      );

      await db.PromotionUsage.create(
        {
          customer_id,
          promotion_id,
          order_id: order.order_id,
          used_at: new Date(),
        },
        { transaction: t }
      );
    }

    await t.commit();
    finished = true;

    const createdOrder = await db.Order.findOne({
      where: { order_id: order.order_id },
      include: [
        { model: db.OrderItem },
        { model: db.Customer, attributes: ["name", "email", "phone"] },
        { model: db.User, attributes: ["name"] },
        { model: db.Promotion },
        { model: db.OrderStatus },
      ],
    });

    return res
      .status(201)
      .json({ message: "Tạo đơn hàng thành công.", order: createdOrder });
  } catch (error) {
    if (!finished) await t.rollback();
    console.error("checkout error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi tạo đơn hàng." });
  }
};

export const getOrderByUserId = async (req, res) => {
  const { user_id } = req.params;

  try {
    if (!user_id) {
      return res.status(400).json({ message: "Thiếu tham số user_id." });
    }

    const orders = await db.Order.findAll({
      where: { user_id: user_id },
      include: [
        {
          model: db.Customer,
          attributes: ["name", "email", "phone"],
        },
        {
          model: db.Promotion,
          attributes: ["promotion_code"],
        },
        {
          model: db.OrderStatus,
          attributes: ["status_name", "color_code"],
        },
        {
          model: db.OrderItem,
          attributes: ["quantity", "price", "total_price"],
          include: [
            {
              model: db.Product,
              attributes: ["product_name"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy đơn hàng của user này." });
    }

    return res.status(200).json(orders);
  } catch (error) {
    console.error("Lỗi khi lấy đơn hàng theo user_id:", error);
    return res.status(500).json({
      message: "Lỗi khi lấy đơn hàng theo user_id.",
      error: error.message,
    });
  }
};
