import UserModel from "../model/userModel.js";

export const checkPermission = (slug, action = "canView") => {
  return async (req, res, next) => {
    try {
      const userId = req.user._id;

      // 🔥 Get user with permissions
      const user = await UserModel.findById(userId).populate({
        path: "role",
        populate: {
          path: "permissions.page",
        },
      });

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const permissions = user.role?.permissions || [];

      const perm = permissions.find((p) => p.page?.slug === slug);

      if (!perm || !perm[action]) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: No permission",
        });
      }

      next();
    } catch (error) {
      console.error("Permission error:", error);
      return res.status(500).json({
        success: false,
        message: "Permission check failed",
      });
    }
  };
};
