import sharp from "sharp";

const convertToWebP = async (input) => {
  try {
    const output = await sharp(input)
      .autoOrient()
      .webp({
        quality: 80
      })
      .toBuffer();

    return output;
  } catch (error) {
    throw new Error(`Image conversion failed: ${error.message}`);
  }
};

export default convertToWebP;