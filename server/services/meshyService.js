import axios from "axios";
import FormData from "form-data";
import fs from "fs";

export const convertImageTo3D = async (imageUrl) => {
  const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
  const tempPath = "uploads/temp_input.jpg";
  fs.writeFileSync(tempPath, imageResponse.data);

  const form = new FormData();
  form.append("image", fs.createReadStream(tempPath));
  form.append("taskMode", "image-to-3d");

  const res = await axios.post(
    "https://api.meshy.ai/openapi/v2/image-to-3d",
    form,
    {
      headers: { 
        Authorization: `Bearer ${process.env.MESHY_API_KEY}`,
        ...form.getHeaders()
      },
    }
  );

  return res.data;
};
