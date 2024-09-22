// models/BlogModel.js
const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    detail: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    isActive: { type: Boolean, default: true },
    authorName: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    likeCount: { type: Number, default: 0 }, // New field for like count
    viewCount: { type: Number, default: 0 }, // New field for view count
  },
  { timestamps: true }
);

// Method to increment viewCount
BlogSchema.methods.incrementViewCount = async function() {
  this.viewCount += 1;
  await this.save();
};

// Method to increment likeCount
BlogSchema.methods.incrementLikeCount = async function() {
  this.likeCount += 1;
  await this.save();
};

BlogSchema.methods.decrementLikeCount = async function() {
  this.likeCount = this.likeCount - 1;
  await this.save();
};
module.exports = mongoose.model("Blog", BlogSchema);