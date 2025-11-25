import db from "../models/index.js";
import { Op, fn, col, literal, Sequelize } from "sequelize";
import slugify from "slugify";

export const getAllProducts = async (req, res) => {
  const { keyword } = req.query;
  try {
    let whereClause = {};
    if (keyword && keyword.trim() !== "") {
      whereClause = {
        [Op.or]: [
          { product_name: { [Op.like]: `%${keyword}%` } },
          { description: { [Op.like]: `%${keyword}%` } },
        ],
      };
    }

    const products = await db.Product.findAll({
      where: whereClause,
      include: [
        {
          model: db.Category,
          attributes: ["category_name"],
        },
        {
          model: db.SubCategory,
          attributes: ["subcategory_name"],
        },
        {
          model: db.ProductImage,
          attributes: ["image_id", "image_url", "alt_text", "is_main"],
        },
      ],
    });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách sản phẩm",
      error: error.message,
    });
  }
};

export const getAllProductsWithRatingSummary = async (req, res) => {
  const { keyword } = req.query;
  try {
    let whereClause = {};
    if (keyword && keyword.trim() !== "") {
      whereClause = {
        [Op.or]: [
          { product_name: { [Op.like]: `%${keyword}%` } },
          { description: { [Op.like]: `%${keyword}%` } },
        ],
      };
    }

    const products = await db.Product.findAll({
      where: whereClause,
      attributes: [
        "product_id",
        "product_name",
        "slug",
        "description",
        "price",
        "quantity",
        "sold_quantity",
        "created_at",
        "updated_at",
        [fn("COUNT", col("ProductReviews.review_id")), "totalReviews"],
        [fn("IFNULL", fn("AVG", col("ProductReviews.rating")), 0), "avgRating"],
        [
          fn(
            "SUM",
            literal(
              `CASE WHEN ProductReviews.sentiment = 'POS' THEN 1 ELSE 0 END`
            )
          ),
          "positiveCount",
        ],
      ],
      include: [
        {
          model: db.ProductReview,
          attributes: [],
          required: false,
          where: {
            use_for_stats: true, // Chỉ tính reviews với use_for_stats = true (loại meta-reviews)
          },
        },
        {
          model: db.Category,
          attributes: ["category_name"],
        },
        {
          model: db.SubCategory,
          attributes: ["subcategory_name"],
        },
        {
          model: db.ProductImage,
          attributes: ["image_id", "image_url", "alt_text", "is_main"],
        },
      ],
      group: [
        "Product.product_id",
        "Category.category_id",
        "SubCategory.subcategory_id",
        "ProductImages.image_id",
      ],
      order: [
        [literal("positiveCount"), "DESC"],
        ["product_name", "ASC"],
      ],
    });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách sản phẩm",
      error: error.message,
    });
  }
};

// Các hàm còn lại không đổi, ví dụ như getProductById, createProduct, updateProduct, deleteProduct...

export const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await db.Product.findByPk(id, {
      include: [
        {
          model: db.Category,
          attributes: ["category_name"],
        },
        {
          model: db.SubCategory,
          attributes: ["subcategory_name"],
        },
        {
          model: db.ProductImage,
          attributes: ["image_id", "image_url", "alt_text", "is_main"],
        },
      ],
    });

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // Tính avgRating từ reviews có use_for_stats = true
    const reviews = await db.ProductReview.findAll({
      where: { product_id: id },
      attributes: ["rating", "use_for_stats"],
    });

    const reviewsForStats = reviews.filter((r) => r.use_for_stats !== false);
    const avgRating =
      reviewsForStats.length > 0
        ? (
            reviewsForStats.reduce((sum, r) => sum + r.rating, 0) /
            reviewsForStats.length
          ).toFixed(2)
        : 0;

    const productData = product.toJSON();
    productData.avgRating = parseFloat(avgRating);
    productData.totalReviews = reviews.length;

    res.status(200).json(productData);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy sản phẩm",
      error: error.message,
    });
  }
};

export const getProductBySlug = async (req, res, next) => {
  const { slug } = req.params;

  try {
    const product = await db.Product.findOne({
      where: { slug },
      include: [
        {
          model: db.Category,
          attributes: ["category_name"],
        },
        {
          model: db.SubCategory,
          attributes: ["subcategory_name"],
        },
        {
          model: db.ProductImage,
          attributes: ["image_id", "image_url", "alt_text", "is_main"],
        },
      ],
    });

    if (!product) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy sản phẩm với slug này" });
    }

    const reviews = await db.ProductReview.findAll({
      where: { product_id: product.product_id },
      include: [
        {
          model: db.Customer,
          attributes: ["name", "email", "phone"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Tính avgRating chỉ từ reviews có use_for_stats = true
    const reviewsForStats = reviews.filter((r) => r.use_for_stats !== false);
    const avgRating =
      reviewsForStats.length > 0
        ? (
            reviewsForStats.reduce((sum, r) => sum + r.rating, 0) /
            reviewsForStats.length
          ).toFixed(2)
        : 0;

    return res.status(200).json({
      message: "Lấy sản phẩm thành công",
      product: { ...product.toJSON(), avgRating: parseFloat(avgRating) },
      reviews,
    });
  } catch (err) {
    return next({
      statusCode: 500,
      message: "Lỗi khi lấy sản phẩm theo slug",
      error: err.message,
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const {
      product_name,
      description,
      price,
      quantity,
      category_id,
      subcategory_id,
    } = req.body;
    const imageFiles = req.files;

    const slug = slugify(product_name, {
      lower: true,
      locale: "vi",
      strict: true,
    });

    const newProduct = await db.Product.create({
      product_name,
      slug,
      description,
      price,
      quantity,
      category_id,
      subcategory_id,
    });

    if (imageFiles && imageFiles.length > 0) {
      const imagesToCreate = imageFiles.map((file, index) => ({
        product_id: newProduct.product_id,
        image_url: file.path,
        alt_text: product_name,
        is_main: index === 0,
      }));
      await db.ProductImage.bulkCreate(imagesToCreate);
    }

    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi tạo sản phẩm",
      error: error.message,
    });
  }
};

// export const updateProduct = async (req, res) => {
//   const { id } = req.params;
//   const {
//     product_name,
//     description,
//     price,
//     quantity,
//     category_id,
//     subcategory_id,
//     is_active,
//   } = req.body;

//   try {
//     const product = await db.Product.findByPk(id);
//     if (!product) {
//       return res.status(404).json({ message: "Sản phẩm không tìm thấy" });
//     }

//     if (product_name) {
//       product.product_name = product_name;
//       product.slug = slugify(product_name, { lower: true, locale: 'vi', strict: true });
//     }
//     product.description = description || product.description;
//     product.price = price || product.price;
//     product.quantity = quantity || product.quantity;
//     product.category_id = category_id || product.category_id;
//     product.subcategory_id = subcategory_id || product.subcategory_id;

//     // Cập nhật trường is_active nếu có trong body
//     if (typeof is_active !== 'undefined') {
//       product.is_active = is_active;
//     }

//     await product.save();
//     res.status(200).json(product);
//   } catch (error) {
//     res.status(500).json({ message: "Lỗi khi cập nhật sản phẩm", error: error.message });
//   }
// };

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const {
    product_name,
    description,
    price,
    quantity,
    category_id,
    subcategory_id,
    is_active,
    existingImageIds, // JSON string danh sách ảnh giữ lại
  } = req.body;

  let existingImageIdsParsed = [];
  if (existingImageIds) {
    try {
      existingImageIdsParsed = JSON.parse(existingImageIds);
    } catch (e) {
      return res
        .status(400)
        .json({ message: "existingImageIds không đúng định dạng JSON" });
    }
  }

  try {
    const product = await db.Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tìm thấy" });
    }

    // Cập nhật thông tin sản phẩm
    if (product_name) {
      product.product_name = product_name;
      product.slug = slugify(product_name, {
        lower: true,
        locale: "vi",
        strict: true,
      });
    }
    product.description = description || product.description;
    product.price = price || product.price;
    product.quantity = quantity || product.quantity;
    product.category_id = category_id || product.category_id;
    product.subcategory_id = subcategory_id || product.subcategory_id;

    if (typeof is_active !== "undefined") {
      product.is_active = is_active;
    }

    // Lấy danh sách ảnh hiện có
    const currentImages = await db.ProductImage.findAll({
      where: { product_id: id },
    });

    // Xác định ảnh cần xóa (không có trong danh sách giữ lại)
    const imagesToDelete = currentImages.filter(
      (img) => !existingImageIdsParsed.includes(img.image_id)
    );

    // Xóa ảnh không giữ lại
    await Promise.all(imagesToDelete.map((img) => img.destroy()));

    // Thêm ảnh mới nếu có
    const imageFiles = req.files;
    if (imageFiles && imageFiles.length > 0) {
      // Xem có ảnh chính chưa, nếu không có thì ảnh đầu tiên mới upload sẽ là ảnh chính
      const hasMainImage = await db.ProductImage.findOne({
        where: { product_id: id, is_main: true },
      });
      const imagesToCreate = imageFiles.map((file, index) => ({
        product_id: id,
        image_url: file.path,
        alt_text: product_name,
        is_main: hasMainImage ? false : index === 0,
      }));
      await db.ProductImage.bulkCreate(imagesToCreate);
    }

    await product.save();
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi cập nhật sản phẩm",
      error: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await db.Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tìm thấy" });
    }
    await product.destroy();
    res.status(200).json({ message: "Sản phẩm đã được xóa" });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi xóa sản phẩm",
      error: error.message,
    });
  }
};

export const getSimilarProducts = async (req, res) => {
  const { category_id, subcategory_id } = req.query; // Nhận category_id và subcategory_id từ query params

  try {
    const products = await db.Product.findAll({
      where: {
        category_id, // Lọc theo category_id
        subcategory_id, // Lọc theo subcategory_id
      },
      include: [
        {
          model: db.Category,
          attributes: ["category_name"],
        },
        {
          model: db.SubCategory,
          attributes: ["subcategory_name"],
        },
        {
          model: db.ProductImage,
          attributes: ["image_id", "image_url", "alt_text", "is_main"],
        },
      ],
    });

    if (products.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy sản phẩm tương tự" });
    }

    res.status(200).json(products);
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm tương tự:", error);
    res.status(500).json({
      message: "Lỗi khi lấy sản phẩm tương tự",
      error: error.message,
    });
  }
};

export const getProductsByCategoryWithRatingSummary = async (req, res) => {
  try {
    const { category_name } = req.query;

    if (!category_name) {
      return res.status(400).json({ message: "Thiếu tham số category_name" });
    }

    const products = await db.Product.findAll({
      attributes: [
        "product_id",
        "product_name",
        "description",
        "price",
        "quantity",
        "sold_quantity",
        "created_at",
        "updated_at",
        "slug",
        [
          Sequelize.fn("COUNT", Sequelize.col("ProductReviews.review_id")),
          "totalReviews",
        ],
        [
          Sequelize.fn(
            "IFNULL",
            Sequelize.fn("AVG", Sequelize.col("ProductReviews.rating")),
            0
          ),
          "avgRating",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              `CASE WHEN ProductReviews.sentiment = 'POS' THEN 1 ELSE 0 END`
            )
          ),
          "positiveCount",
        ],
      ],
      include: [
        {
          model: db.ProductReview,
          attributes: [],
          required: false,
          where: {
            use_for_stats: true, // Chỉ tính reviews với use_for_stats = true (loại meta-reviews)
          },
        },
        {
          model: db.Category,
          attributes: ["category_name"],
          where: { category_name }, // Lọc theo category_name ở đây
        },
        {
          model: db.SubCategory,
          attributes: ["subcategory_name"],
        },
        {
          model: db.ProductImage,
          attributes: ["image_id", "image_url", "alt_text", "is_main"],
        },
      ],
      group: [
        "Product.product_id",
        "Category.category_id",
        "SubCategory.subcategory_id",
        "ProductImages.image_id",
      ],
      order: [
        [Sequelize.literal("positiveCount"), "DESC"],
        ["product_name", "ASC"],
      ],
    });

    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Lỗi khi lấy danh sách sản phẩm theo category",
      error: error.message,
    });
  }
};

export const getCategoryesWithSubCategory = async (req, res) => {
  try {
    const categories = await db.Category.findAll({
      include: [
        {
          model: db.SubCategory,
          attributes: ["subcategory_id", "subcategory_name"],
        },
      ],
    });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh mục", error: error.message });
  }
};
export const filterProducts = async (req, res) => {
  try {
    const {
      keyword,
      category_id, // có thể chuỗi "1,2,3"
      subcategory_id, // có thể chuỗi "11,22"
      is_active, // true/false/null
      dateType, // created_at hoặc updated_at
      startDate, // ISO string
      endDate, // ISO string
    } = req.query;

    const whereClause = {};

    if (keyword && keyword.trim() !== "") {
      whereClause[Op.or] = [
        { product_name: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } },
      ];
    }

    if (category_id) {
      // Nếu nhiều id truyền dạng chuỗi '1,2,3' thì convert thành array
      const catIds = category_id.split(",").map((id) => Number(id.trim()));
      whereClause.category_id = { [Op.in]: catIds };
    }

    if (subcategory_id) {
      const subIds = subcategory_id.split(",").map((id) => Number(id.trim()));
      whereClause.subcategory_id = { [Op.in]: subIds };
    }

    if (
      typeof is_active !== "undefined" &&
      is_active !== null &&
      is_active !== ""
    ) {
      // is_active truyền string "true" hoặc "false"
      whereClause.is_active = is_active === "true";
    }

    if (dateType && (dateType === "created_at" || dateType === "updated_at")) {
      if (startDate && endDate) {
        whereClause[dateType] = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      } else if (startDate) {
        whereClause[dateType] = {
          [Op.gte]: new Date(startDate),
        };
      } else if (endDate) {
        whereClause[dateType] = {
          [Op.lte]: new Date(endDate),
        };
      }
    }

    const products = await db.Product.findAll({
      where: whereClause,
      include: [
        {
          model: db.Category,
          attributes: ["category_name"],
        },
        {
          model: db.SubCategory,
          attributes: ["subcategory_name"],
        },
        {
          model: db.ProductImage,
          attributes: ["image_id", "image_url", "alt_text", "is_main"],
        },
      ],
    });

    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Lỗi khi lọc sản phẩm",
      error: error.message,
    });
  }
};

export const getTopRatedProductsBySentiment = async (req, res, next) => {
  try {
    // 1. Lấy danh sách product_id, avg_rating, pos_review_count theo sentiment POS, limit 5
    const topReviews = await db.ProductReview.findAll({
      attributes: [
        "product_id",
        [Sequelize.fn("AVG", Sequelize.col("rating")), "avg_rating"],
        [Sequelize.fn("COUNT", Sequelize.col("review_id")), "pos_review_count"],
      ],
      where: { sentiment: "POS" },
      group: ["product_id"],
      order: [
        [Sequelize.literal("pos_review_count"), "DESC"],
        [Sequelize.literal("avg_rating"), "DESC"],
      ],
      limit: 5,
      raw: true,
    });

    const productIds = topReviews.map((r) => r.product_id);
    if (productIds.length === 0) {
      return res.status(200).json({
        message: "Không có sản phẩm được đánh giá tích cực",
        products: [],
      });
    }

    // 2. Lấy chi tiết sản phẩm với product_id trên, kèm ảnh chính
    const products = await db.Product.findAll({
      where: {
        product_id: { [Sequelize.Op.in]: productIds },
        is_active: true,
      },
      include: [
        {
          model: db.ProductImage,
          as: "ProductImages",
          attributes: ["image_id", "image_url", "alt_text"],
          where: { is_main: true },
          required: false,
        },
      ],
    });

    // 3. Map avg_rating và pos_review_count vào từng product
    const productsWithStats = products.map((product) => {
      const stats = topReviews.find((r) => r.product_id === product.product_id);
      return {
        ...product.toJSON(),
        avg_rating: stats ? parseFloat(stats.avg_rating).toFixed(2) : null,
        pos_review_count: stats ? stats.pos_review_count : 0,
      };
    });

    return res.status(200).json({
      message:
        "Lấy danh sách 5 sản phẩm được đánh giá tích cực nhiều nhất thành công",
      products: productsWithStats,
    });
  } catch (error) {
    return next({
      statusCode: 500,
      message: "Lỗi khi lấy sản phẩm đánh giá tốt theo sentiment",
      error: error.message,
    });
  }
};
