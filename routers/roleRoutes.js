const express = require("express");
const router = express.Router();

const {
  createOrUpdateRole,
  getRoles,
  getRole,
  deleteRole,
} = require("../controller/roleController.js");
const { requiredSignIn } = require("../middlewares/authMiddleware.js");
const { checkPermission } = require("../middlewares/checkPermission.js");

router.post(
  "/role-settings",
  requiredSignIn,
  checkPermission("roles", "canCreate"),
  createOrUpdateRole,
);
router.get(
  "/roles",
  requiredSignIn,
  checkPermission("roles", "canView"),
  getRoles,
);
router.get(
  "/role/:id",
  requiredSignIn,
  checkPermission("roles", "canView"),
  getRole,
);
router.delete(
  "/role/:id",
  requiredSignIn,
  checkPermission("roles", "canDelete"),
  deleteRole,
);

module.exports = router;
