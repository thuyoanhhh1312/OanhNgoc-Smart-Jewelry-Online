import db from "../models/index.js";
const { Article, ArticleCategory, Tag } = db;
// GET /news?page=&limit=&q=&category_id=&status=

// server/controllers/articleController.js (trích phần getNews)
export const getNews = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      q = "",
      category_id,
      article_category_id,
      status,
      tags, // <= "ai,blockchain" HOẶC "1,2"
    } = req.query;

    const where = {};
    // Logic filter status:
    // 1. Nếu status = "all" → lấy tất cả (không filter)
    // 2. Nếu status là một giá trị hợp lệ (draft, published, archived) → filter theo nó
    // 3. Nếu status undefined/empty (public API không pass) → mặc định published

    if (status === "all" || status === "null" || status === null) {
      // Lấy tất cả status - không thêm điều kiện status vào where
    } else if (
      status &&
      (status === "draft" || status === "published" || status === "archived")
    ) {
      // Filter theo status cụ thể
      where.status = status;
    } else {
      // Default: published (cho public API)
      where.status = "published";
    }

    if (q) {
      const searchQuery = String(q).toLowerCase();
      where.title = db.Sequelize.where(
        db.Sequelize.fn("LOWER", db.Sequelize.col("title")),
        "LIKE",
        `%${searchQuery}%`
      );
    }

    const catId = article_category_id || category_id;
    if (catId) where.article_category_id = catId;

    // ----- NEW: lọc theo tags (slug hoặc id) -----
    let include = [
      {
        model: db.ArticleCategory,
        as: "category",
        attributes: ["article_category_id", "category_name", "slug"],
      },
      {
        association: "tags",
        attributes: ["tag_id", "name", "slug"],
        through: { attributes: [] },
      },
    ];

    if (tags) {
      const list = String(tags)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      // Nếu toàn số -> coi là tag_id; ngược lại dùng slug
      const isAllNumber = list.every((v) => /^\d+$/.test(v));
      const tagWhere = isAllNumber
        ? { tag_id: list.map(Number) }
        : { slug: list };

      include = [
        {
          model: db.ArticleCategory,
          as: "category",
          attributes: ["article_category_id", "category_name", "slug"],
        },
        {
          association: "tags",
          attributes: ["tag_id", "name", "slug"],
          through: { attributes: [] },
          where: tagWhere,
          required: true, // bắt buộc match tag
        },
      ];
    }

    const { rows, count } = await db.Article.findAndCountAll({
      where,
      include,
      order: [
        ["published_at", "DESC"],
        ["created_at", "DESC"],
      ],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      distinct: true, // count đúng khi join N-N
    });

    res.json({
      data: rows,
      meta: { page: Number(page), limit: Number(limit), total: count },
    });
  } catch (err) {
    next(err);
  }
};

// GET /news/:slug
export const getNewsBySlug = async (req, res, next) => {
  try {
    const row = await Article.findOne({
      where: { slug: req.params.slug },
      include: [
        {
          model: ArticleCategory,
          as: "category",
          attributes: ["article_category_id", "category_name", "slug"],
        },
        {
          association: "tags",
          attributes: ["tag_id", "name", "slug"],
          through: { attributes: [] },
        },
      ],
    });
    if (!row)
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    res.json(row);
  } catch (err) {
    next(err);
  }
};

// GET /admin/news/:id (for edit page, fetch by ID)
export const getNewsById = async (req, res, next) => {
  try {
    const row = await Article.findByPk(req.params.id, {
      include: [
        {
          model: ArticleCategory,
          as: "category",
          attributes: ["article_category_id", "category_name", "slug"],
        },
        {
          association: "tags",
          attributes: ["tag_id", "name", "slug"],
          through: { attributes: [] },
        },
      ],
    });
    if (!row)
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    res.json(row);
  } catch (err) {
    next(err);
  }
};

// POST /admin/news
export const createNews = async (req, res, next) => {
  const t = await db.sequelize.transaction();
  try {
    let { tags, ...data } = req.body || {};

    // parse tags nếu gửi form-data
    if (typeof tags === "string") {
      try {
        tags = JSON.parse(tags);
      } catch {
        tags = [tags];
      }
    }
    if (!Array.isArray(tags)) tags = [];

    // file upload -> thumbnail_url
    if (req.file?.path && !data.thumbnail_url)
      data.thumbnail_url = req.file.path;

    // validate article_category_id
    const cat = await ArticleCategory.findByPk(data.article_category_id, {
      transaction: t,
    });
    if (!cat) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "article_category_id không hợp lệ" });
    }

    // nếu FE không gửi slug, bạn có thể tự tạo (tuỳ chọn)
    if (!data.slug && data.title) {
      data.slug = data.title.toLowerCase().trim().replace(/\s+/g, "-");
    }

    const article = await Article.create(data, { transaction: t });

    if (tags.length) {
      const tagRows = [];
      for (const name of tags) {
        const slug = name.toLowerCase().trim().replace(/\s+/g, "-");
        const [tag] = await Tag.findOrCreate({
          where: { slug },
          defaults: { name, slug },
          transaction: t,
        });
        tagRows.push(tag);
      }
      await article.setTags(tagRows, { transaction: t });
    }

    await t.commit();
    res.status(201).json({
      message: "Tạo bài viết thành công",
      article_id: article.article_id,
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

// PUT /admin/news/:id
export const updateNews = async (req, res, next) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    let { tags, ...data } = req.body || {};

    if (typeof tags === "string") {
      try {
        tags = JSON.parse(tags);
      } catch {
        tags = [tags];
      }
    }
    if (!Array.isArray(tags)) tags = [];

    if (req.file?.path && !data.thumbnail_url)
      data.thumbnail_url = req.file.path;

    const article = await Article.findByPk(id, { transaction: t });
    if (!article) {
      await t.rollback();
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    if (data.article_category_id) {
      const cat = await ArticleCategory.findByPk(data.article_category_id, {
        transaction: t,
      });
      if (!cat) {
        await t.rollback();
        return res
          .status(400)
          .json({ message: "article_category_id không hợp lệ" });
      }
    }

    // tự tạo slug nếu cần (tuỳ chọn)
    if (!data.slug && data.title) {
      data.slug = data.title.toLowerCase().trim().replace(/\s+/g, "-");
    }

    await article.update(data, { transaction: t });

    if (Array.isArray(tags) && tags.length > 0) {
      const tagRows = [];
      for (const tagId of tags) {
        // Nếu gửi tag_id (numeric), tìm tag đó
        if (!isNaN(tagId)) {
          const tag = await Tag.findByPk(tagId, { transaction: t });
          if (tag) tagRows.push(tag);
        } else {
          // Nếu gửi name (string), tạo hoặc tìm
          const slug = String(tagId).toLowerCase().trim().replace(/\s+/g, "-");
          const [tag] = await Tag.findOrCreate({
            where: { slug },
            defaults: { name: tagId, slug },
            transaction: t,
          });
          tagRows.push(tag);
        }
      }
      await article.setTags(tagRows, { transaction: t });
    }

    await t.commit();
    res.json({ message: "Cập nhật thành công" });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

// DELETE /admin/news/:id
export const deleteNews = async (req, res, next) => {
  try {
    const n = await Article.destroy({ where: { article_id: req.params.id } });
    if (!n) return res.status(404).json({ message: "Không tìm thấy bài viết" });
    res.json({ message: "Đã xoá" });
  } catch (err) {
    next(err);
  }
};
