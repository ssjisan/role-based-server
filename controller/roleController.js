const Role = require("../model/roleModel.js");
const UserModel = require("../model/userModel.js");
// Create or Update Role
exports.createOrUpdateRole = async (req, res) => {
  try {
    const { id, name, description, permissions } = req.body;
    const authUser = req.user;

    if (!name) {
      return res.status(400).json({ message: "Role name is required" });
    }
    const author = await UserModel.findById(authUser._id).select(
      "name email _id",
    );

    if (!author) {
      return res.status(401).json({ message: "User not found" });
    }
    // CREATE
    if (!id) {
      const role = new Role({
        name,
        description,
        permissions,
        createdBy: {
          userId: author._id?.toString(), // 👈 force value
          name: author.name,
          email: author.email,
        },
      });

      await role.save();

      return res.status(201).json({
        message: "Role created successfully",
        data: role,
      });
    }

    // UPDATE
    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    role.name = name;
    role.description = description;
    role.permissions = permissions;
    role.updatedBy = {
      userId: author._id?.toString(), // 👈 force value
      name: author.name,
      email: author.email,
    };
    await role.save();

    return res.json({
      message: "Role updated successfully",
      data: role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find().populate("permissions.page", "name path");

    res.json(roles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).populate(
      "permissions.page",
      "name path",
    );

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.json(role);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const roleId = req.params.id;

    // 🔍 Check if role is assigned to any user FIRST
    const userWithRole = await UserModel.findOne({ role: roleId });

    if (userWithRole) {
      return res.status(400).json({
        message: "Cannot delete role. It is assigned to one or more users.",
      });
    }

    // 🔍 Now check if role exists
    const role = await Role.findById(roleId);

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    if (role.isRoot) {
      return res.status(403).json({
        message: "Root role cannot be deleted",
      });
    }

    // 🗑️ Delete only after validation
    await Role.findByIdAndDelete(roleId);

    res.json({ message: "Role deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
