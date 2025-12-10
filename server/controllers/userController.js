import db from "../models/index.js";
import bcrypt from "bcryptjs"; // Để mã hóa mật khẩu
import { Op } from "sequelize";

export const getAllUsers = async (req, res) => {
  const { keyword, role_id } = req.query; // nhận thêm role_id từ query

  try {
    let whereClause = {};
    if (keyword && keyword.trim() !== "") {
      whereClause = {
        [Op.or]: [
          { name: { [Op.like]: `%${keyword}%` } },
          { email: { [Op.like]: `%${keyword}%` } },
        ],
      };
    }

    // Chuẩn bị điều kiện lọc role
    let roleWhere = {};
    if (role_id) {
      // chuyển sang số nếu cần
      const roleIdNumber = Number(role_id);
      if (!isNaN(roleIdNumber)) {
        roleWhere = { id: roleIdNumber };
      }
    } else {
      // Nếu không truyền role_id thì mặc định lấy admin + staff
      roleWhere = {
        name: {
          [Op.in]: ["admin", "staff"],
        },
      };
    }

    const users = await db.User.findAll({
      where: whereClause,
      include: [
        {
          model: db.Role,
          attributes: ["id", "name"],
          where: roleWhere,
          required: true, // bắt buộc có role thỏa điều kiện
        },
      ],
    });

    res.status(200).json(users);
  } catch (err) {
    console.error("Error in getAllUsers:", err);
    res.status(500).json({
      message: "Lỗi khi lấy danh sách người dùng",
      error: err.message,
    });
  }
};

// Lấy người dùng theo ID
export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db.User.findByPk(id, {
      include: [{ model: db.Role, attributes: ["id", "name"] }],
    });
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tìm thấy" });
    }
    res.status(200).json(user);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy người dùng", error: err.message });
  }
};

// Xóa người dùng
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db.User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tìm thấy" });
    }

    await user.destroy();
    res.status(200).json({ message: "Người dùng đã được xóa" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi khi xóa người dùng", error: err.message });
  }
};

// Thêm nhân viên mới
export const createUser = async (req, res) => {
  const { name, email, password, role_id } = req.body;

  // Kiểm tra quyền admin (nếu chưa có middleware kiểm, nên thêm)
  if (req.user.role_id !== 1) {
    return res
      .status(403)
      .json({ message: "Chỉ admin mới có quyền thêm nhân viên" });
  }

  try {
    // Kiểm tra email đã tồn tại chưa
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    // Mã hóa password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.User.create({
      name,
      email,
      password: hashedPassword,
      role_id,
    });

    res.status(201).json(newUser);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Lỗi khi tạo nhân viên", error: err.message });
  }
};

// Sửa nhân viên (cập nhật name, email, role và password nếu có)
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, role_id, password } = req.body;

  try {
    const user = await db.User.findByPk(id);
    if (!user)
      return res.status(404).json({ message: "Nhân viên không tìm thấy" });

    // Kiểm tra nếu đang cố gắng thay đổi role của chính mình
    if (role_id && req.user.id === parseInt(id)) {
      return res.status(403).json({
        message: "Bạn không thể thay đổi role của chính mình",
      });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role_id) user.role_id = role_id;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    await user.save();
    res.status(200).json(user);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Lỗi khi cập nhật nhân viên", error: err.message });
  }
};
