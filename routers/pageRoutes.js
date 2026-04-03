const express = require("express");
const router = express.Router();

const {
  createOrUpdatePage,
  getAllPages,
  getSinglePage,
  deletePage,
} = require("../controller/pageController.js");
const { requiredSignIn } = require("../middlewares/authMiddleware.js");
const { checkPermission } = require("../middlewares/checkPermission.js");

router.post(
  "/page-settings",
  requiredSignIn,
  checkPermission("users", "canCreate"),
  createOrUpdatePage,
);
router.get(
  "/get-all-pages",
  requiredSignIn,
  checkPermission("users", "canView"),
  getAllPages,
);
router.get(
  "/get-page/:id",
  requiredSignIn,
  checkPermission("users", "canView"),
  getSinglePage,
);
router.delete(
  "/delete-page/:id",
  requiredSignIn,
  checkPermission("users", "canDelete"),
  deletePage,
);

module.exports = router;
