import db from "../models/index.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import { convertImageTo3D } from "../services/meshyService.js";

const ProductImage = db.product_image;

export const generate3DModel = async (req, res) => {
  try {
    const { product_id } = req.params;

    // 1) Lấy ảnh chính
    const mainImage = await ProductImage.findOne({
      where: { product_id, is_main: true, file_type: "image" },
    });

    if (!mainImage) {
      return res.status(400).json({ msg: "Sản phẩm chưa có ảnh chính" });
    }

    // 2) Gửi ảnh sang Meshy AI
    const aiResult = await convertImageTo3D(mainImage.image_url);

    if (!aiResult?.result?.model_url) {
      return res.status(500).json({ msg: "AI không tạo được mô hình 3D" });
    }

    const modelUrl = aiResult.result.model_url;

    // 3) Tải file GLB về local
    const dir = "uploads/3dModels";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const savePath = path.join(dir, `${product_id}.glb`);
    const writer = fs.createWriteStream(savePath);

    const fileStream = await axios({
      url: modelUrl,
      method: "GET",
      responseType: "stream",
    });

    fileStream.data.pipe(writer);

    writer.on("finish", async () => {
      // 4) Lưu record mô hình 3D vào DB
      const new3D = await ProductImage.create({
        product_id,
        image_url: `/uploads/3dModels/${product_id}.glb`,
        alt_text: "3D Model",
        is_main: false,
        file_type: "3d",
      });

      return res.json({
        msg: "Tạo mô hình 3D thành công!",
        data: new3D,
      });
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: error.message });
  }
};
