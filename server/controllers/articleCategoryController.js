import db from "../models/index.js";
const { ArticleCategory } = db;

export const getAll = async (req, res, next) => {
  try {
    const rows = await ArticleCategory.findAll({
      order: [["category_name", "ASC"]],
      attributes: [
        "article_category_id",
        "category_name",
        "slug",
        "description",
      ],
    });
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const row = await ArticleCategory.findByPk(id);
    if (!row)
      return res.status(404).json({ message: "Danh mục không tìm thấy" });
    res.json(row);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { category_name, slug, description } = req.body;

    if (!category_name || !slug) {
      return res.status(400).json({ message: "Thiếu tên danh mục hoặc slug" });
    }

    const row = await ArticleCategory.create({
      category_name,
      slug,
      description: description || "",
    });
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category_name, slug, description } = req.body;

    const row = await ArticleCategory.findByPk(id);
    if (!row)
      return res.status(404).json({ message: "Danh mục không tìm thấy" });

    await row.update({
      category_name: category_name || row.category_name,
      slug: slug || row.slug,
      description: description !== undefined ? description : row.description,
    });

    res.json(row);
  } catch (err) {
    next(err);
  }
};

export const destroy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const n = await ArticleCategory.destroy({
      where: { article_category_id: id },
    });
    if (!n) return res.status(404).json({ message: "Danh mục không tìm thấy" });
    res.json({ message: "Đã xóa" });
  } catch (err) {
    next(err);
  }
};
