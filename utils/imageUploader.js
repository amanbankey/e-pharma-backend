import { v2 as cloudinary } from "cloudinary";
import convertToWebP from "./convertToWebP.js";

export const uploadImageToCloudinary = async(file, folder, height, quality) => {

    const options = {folder,
        resource_type: "auto",
    };
    if(height) {
        options.height = height;

    }if(quality){
        options.quality = quality;
    }

    // Convert jpg/jpeg/png/etc. to WebP before uploading to save Cloudinary storage
    const isConvertible = file.mimetype?.startsWith("image/") && !/gif|svg/.test(file.mimetype);
    if (!isConvertible) {
        return await cloudinary.uploader.upload(file.tempFilePath, options);
    }

    const webpBuffer = await convertToWebP(file.tempFilePath);

    return await new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream({ ...options, format: "webp" }, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            })
            .end(webpBuffer);
    });
};

export const extractPublicId = (url) => {
    if (!url || typeof url !== "string") return null;
    const match = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
    return match ? match[1] : null;
};

export const deleteImageFromCloudinary = async (publicId) => {
    try {
        return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("Cloudinary delete error:", error);
        throw error;
    }
};
