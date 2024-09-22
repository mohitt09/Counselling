// routes/blogRoutes.js
const express = require("express");
const router = express.Router();
const Blog = require("../models/BlogModel");
const multer = require("multer");
const handleUpload = require("../utils/multerConfig");
const { body, validationResult } = require("express-validator");

// Add this route to your blogRoutes.js
router.get("/filter", async (req, res) => {
  try {
    // Check if the isActive query parameter is provided and convert it to a boolean
    const isActive = req.query.isActive === "true";

    // Find blogs where isActive matches the query parameter
    const blogs = await Blog.find({ isActive: isActive });

    // If no blogs are found and isActive is true, return a message indicating no active blogs
    if (blogs.length === 0 && isActive) {
      return res.status(404).json({ message: "No active blogs found" });
    }

    // Return the filtered blogs
    res.json(blogs);
  } catch (err) {
    console.error("Error fetching filtered blogs:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

const validateImage = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ errors: [{ msg: "Image is required" }] });
  }
  // Add more validation checks here, e.g., file type, size
  // Example: Check if the file is an image
  if (!req.file.mimetype.startsWith("image/")) {
    return res.status(400).json({ errors: [{ msg: "File is not an image" }] });
  }
  // Example: Check if the file size is within a limit (e.g., 2MB)
  const maxSize = 10 * 1024 * 1024; // 2MB
  if (req.file.size > maxSize) {
    return res
      .status(400)
      .json({ errors: [{ msg: "Image file is too large" }] });
  }
  next();
};

const titleExists = async (title) => {
  const blog = await Blog.findOne({ title: title });
  if (blog) {
    throw new Error("Title must be unique");
  }
  // If the title does not exist, the validation passes
};

const validateBlog = [
  body("title").notEmpty().withMessage("Title is required").custom(titleExists),
  body("detail").notEmpty().withMessage("Detail is required"),
  body("authorName").notEmpty().withMessage("Author Name is required"),
];

router.post(
  "/",
  handleUpload,
  validateBlog,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const newBlog = new Blog({
        title: req.body.title,
        detail: req.body.detail,
        image: req.file.path,
        date: Date.now(),
        authorName: req.body.authorName,
        time: new Date().toISOString(),
      });

      const savedBlog = await newBlog.save();
      console.log(savedBlog);
      res.status(201).json(savedBlog);
    } catch (err) {
      console.error("Error adding blog:", err);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

const validateEditBlog = [
  body("title").notEmpty().withMessage("Title is required"),
  body("detail").notEmpty().withMessage("Detail is required"),
  body("authorName").notEmpty().withMessage("Author Name is required"),
];

router.put(
  "/:id",
  handleUpload,
  validateEditBlog,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const blog = await Blog.findById(req.params.id);
      if (!blog) {
        return res.status(404).json({ message: "Blog not found" });
      }

      blog.title = req.body.title;
      blog.detail = req.body.detail;
      blog.authorName = req.body.authorName;

      if (req.file) {
        blog.image = req.file.path; // Update the image if a new one is uploaded
      }

      const updatedBlog = await blog.save();
      res.json(updatedBlog);
    } catch (err) {
      console.error("Error updating blog:", err);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find();
    res.json(blogs);
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.json(blog);
  } catch (err) {
    console.error("Error fetching blog:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.patch("/:id/toggle-active", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    blog.isActive = !blog.isActive; // Toggle the isActive status
    await blog.save();

    res.json({ message: "Blog's active status toggled successfully", blog });
  } catch (err) {
    console.error("Error toggling blog's active status:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/:id/like", async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) {
    return res.status(404).json({ message: "Blog not found" }); 
  }

  await blog.incrementLikeCount();
  res.json({ message: "Like count incremented successfully", blog });
});

router.post("/:id/view", async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  await blog.incrementViewCount();
  res.json({ message: "View count incremented successfully", blog });
});

router.post("/:id/unlike", async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  await blog.decrementLikeCount();
  res.json({ message: "Like count decremented successfully", blog });
});

// Add more routes for updating and deleting blogs as needed

module.exports = router;
