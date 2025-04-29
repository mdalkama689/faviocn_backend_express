import express, { Request, Response } from "express";
import { config } from "dotenv";
import multer, { MulterError } from "multer";
import sharp from "sharp";
import archiver from "archiver";
import path from "path";
import cors from "cors";

const app = express();
config();

const corsOption = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
};

app.use(cors(corsOption));
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;

    const exactName = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    const mimeType = fileTypes.test(file.mimetype);

    if (exactName && mimeType) {
      return cb(null, true);
    } else {
      cb(new Error("Only JPG, JPEG, and PNG files are allowed!"));
    }
  },
});

const PORT = process.env.PORT || 8000;

app.post(
  "/generate-fav-icon",
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      const uplaodFile = req.file;
      if (!uplaodFile) {
        res.status(400).json({
          success: false,
          message: "Please uplad image!",
        });
        return;
      }

      const archie = archiver("zip", {
        zlib: { level: 9 },
      });

      archie.pipe(res);

      const sizes = [16, 32, 48, 64, 96, 128, 150, 180, 192, 256, 512];

      for (let i = 0; i < sizes.length; i++) {
        const buffer = await sharp(uplaodFile.buffer)
          .resize(sizes[i], sizes[i])
          .png()
          .toBuffer();

        archie.append(buffer, { name: `favicon-${sizes[i]}x${sizes[i]}.png` });
      }

      await archie.finalize();

     
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "somehting went wrong during generate fav icons",
      });
      return;
    }
  }
);

app.listen(PORT, () => {
  console.log(`Backend is runnig at ${PORT}`);
});
