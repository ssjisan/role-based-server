const express = require("express");
const router = express.Router();

// import controller
const {
  registerUserByAdmin,
  loginUser,
  removeUser,
  userList,
  changePassword,
  resetPassword,
  getSingleUser,
  updateUser,
} = require("../controller/authController.js");

// import middleware
const { requiredSignIn } = require("../middlewares/authMiddleware.js");
const { checkPermission } = require("../middlewares/checkPermission.js");
router.post("/register", registerUserByAdmin);
router.post("/login", loginUser);
router.get("/users", userList);
router.get("/user/:id", getSingleUser);
router.delete(
  "/user/:id",
  requiredSignIn,
  checkPermission("users", "canDelete"),
  removeUser,
);
router.post("/change-password", requiredSignIn, changePassword);
router.post("/reset-password/:id", requiredSignIn, resetPassword);
router.put("/user/:id", updateUser);

router.get("/auth-check", requiredSignIn, (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
