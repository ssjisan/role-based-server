const express = require("express");
const router = express.Router();

const {
  createOrUpdatePage,
  getAllPages,
  getSinglePage,
  deletePage,
} = require("../controller/pageController.js");

router.post("/page-settings", createOrUpdatePage);
router.get("/get-all-pages", getAllPages);
router.get("/get-page/:id", getSinglePage);
router.delete("/delete-page/:id", deletePage);

module.exports = router;
