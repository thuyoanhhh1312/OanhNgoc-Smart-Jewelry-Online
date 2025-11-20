import db from "../models/index.js";

const { ArticleCategory } = db;

const seedNewCategory = async () => {
  try {
    // Check if "New" category already exists
    const existing = await ArticleCategory.findOne({
      where: { slug: "new" },
    });

    if (existing) {
      console.log('✅ "New" category already exists');
      return;
    }

    // Create "New" category
    await ArticleCategory.create({
      category_name: "New",
      slug: "new",
      description: "Tin mới, tin nóng",
    });

    console.log('✅ "New" category created successfully');
  } catch (error) {
    console.error("❌ Error seeding category:", error.message);
  }
};

seedNewCategory();
