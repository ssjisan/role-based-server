const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");

// Route Imports
const webMessage = require("./helper/webMessage.js");
const authRoutes = require("./routers/authRoutes.js");
const pageRoutes = require("./routers/pageRoutes.js");
const roleRoutes = require("./routers/roleRoutes.js");
dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// 📦 Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// 🔧 Middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// 🛣️ Routers
app.use(authRoutes);
app.use(pageRoutes);
app.use(roleRoutes);

// Basic Route
app.get("/", (req, res) => {
  res.send(webMessage);
});

// 🚀 Start server
app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
