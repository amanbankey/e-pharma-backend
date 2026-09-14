import { v2 as cloudinary } from "cloudinary";

export const uploadImageToCloudinary = async(file, folder, height, quality) => {

    const options = {folder,
        resource_type: "auto",
    };
    if(height) {
        options.height = height;

    }if(quality){
        options.quality = quality;
    }

    return await cloudinary.uploader.upload(file.tempFilePath, options);
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
