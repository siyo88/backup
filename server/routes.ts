import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { insertCommentSchema } from "@shared/schema";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await storage.initializeDefaultMembers();

  app.use("/uploads", (req, res, next) => {
    res.setHeader("Cache-Control", "public, max-age=31536000");
    next();
  });
  app.use("/uploads", express.static(uploadDir));

  app.get("/api/members", async (req, res) => {
    try {
      const members = await storage.getMembers();
      res.json(members);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ error: "Failed to fetch members" });
    }
  });

  app.get("/api/members/:slug", async (req, res) => {
    try {
      const member = await storage.getMemberBySlug(req.params.slug);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }
      res.json(member);
    } catch (error) {
      console.error("Error fetching member:", error);
      res.status(500).json({ error: "Failed to fetch member" });
    }
  });

  app.patch("/api/members/:id", async (req, res) => {
    try {
      const { memo } = req.body;
      const updated = await storage.updateMember(req.params.id, { memo });
      if (!updated) {
        return res.status(404).json({ error: "Member not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating member:", error);
      res.status(500).json({ error: "Failed to update member" });
    }
  });

  app.post("/api/members/:id/profile", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image provided" });
      }

      const profileFilename = `profile-${req.params.id}-${Date.now()}.jpg`;
      const profilePath = path.join(uploadDir, profileFilename);

      await sharp(req.file.path)
        .resize(300, 300, { fit: "cover" })
        .jpeg({ quality: 85 })
        .toFile(profilePath);

      fs.unlinkSync(req.file.path);

      const profileImage = `/uploads/${profileFilename}`;
      const updated = await storage.updateMember(req.params.id, { profileImage });

      if (!updated) {
        return res.status(404).json({ error: "Member not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error uploading profile:", error);
      res.status(500).json({ error: "Failed to upload profile image" });
    }
  });

  app.get("/api/images/:slug", async (req, res) => {
    try {
      const images = await storage.getImagesByMemberSlug(req.params.slug);
      res.json(images);
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  app.post("/api/images/upload", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image provided" });
      }

      const memberId = req.body.memberId;
      if (!memberId) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "Member ID is required" });
      }

      const metadata = await sharp(req.file.path).metadata();
      const width = metadata.width || 500;
      const height = metadata.height || 500;

      const processedFilename = `art-${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;
      const processedPath = path.join(uploadDir, processedFilename);

      await sharp(req.file.path)
        .resize(Math.min(width, 2000), Math.min(height, 2000), { 
          fit: "inside",
          withoutEnlargement: true 
        })
        .png({ quality: 90 })
        .toFile(processedPath);

      if (req.file.path !== processedPath) {
        fs.unlinkSync(req.file.path);
      }

      const image = await storage.createImage({
        memberId,
        filename: processedFilename,
        originalFilename: req.file.originalname,
        width,
        height,
      });

      res.json(image);
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  app.post("/api/comments", async (req, res) => {
    try {
      const result = insertCommentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid comment data" });
      }

      const comment = await storage.createComment(result.data);
      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  return httpServer;
}
