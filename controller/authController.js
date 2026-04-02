const jwt = require("jsonwebtoken");
const { comparePassword, hashPassword } = require("../helper/passwordHash.js");
const UserModel = require("../model/userModel.js");
const dotenv = require("dotenv");
const Roles = require("../model/roleModel.js");
dotenv.config();

// ---------------------------
// User Registration Controller
// ---------------------------

const registerUserByAdmin = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate
    const existingUser = await UserModel.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already taken",
      });
    }

    // ---------------------------
    // Validate Role exists
    // ---------------------------
    const roleExists = await Roles.findById(role);

    if (!roleExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid role selected",
      });
    }

    // Default password
    const defaultPassword = "12345678";
    const hashedPassword = await hashPassword(defaultPassword);

    const newUser = await UserModel.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: roleExists._id,
      mustChangePassword: true,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("Register Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ---------------------------
// User Login Controller
// ---------------------------

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ✅ Populate role + permissions
    const user = await UserModel.findOne({ email: normalizedEmail }).populate({
      path: "role",
      populate: {
        path: "permissions.page",
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMs = user.lockUntil - Date.now();
      const remainingSeconds = Math.ceil(remainingMs / 1000);

      return res.status(423).json({
        success: false,
        message: "Account temporarily locked",
        remainingSeconds,
      });
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      user.loginAttempts += 1;

      if (user.loginAttempts >= 3) {
        user.lockUntil = Date.now() + 5 * 60 * 1000;
        user.loginAttempts = 0;
        await user.save();

        return res.status(423).json({
          success: false,
          message: "Account temporarily locked",
          remainingSeconds: 5 * 60,
        });
      }

      await user.save();

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Reset attempts
    user.loginAttempts = 0;
    user.lockUntil = null;

    // ---------------------------
    // Token (unchanged logic)
    // ---------------------------
    const token = jwt.sign(
      {
        _id: user._id,
        role: user.role._id,
      },
      process.env.JWT_SECURE,
      {
        expiresIn: "12h",
      },
    );

    // ---------------------------
    // Force password change
    // ---------------------------
    if (user.mustChangePassword) {
      await user.save();

      return res.status(403).json({
        success: false,
        message: "Password change required",
        forcePasswordChange: true,
        token,
      });
    }

    // ---------------------------
    // Password expiry check
    // ---------------------------
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    if (Date.now() - user.passwordChangedAt.getTime() > sevenDays) {
      const token = jwt.sign(
        {
          _id: user._id,
          role: user.role._id,
          passwordExpired: true,
        },
        process.env.JWT_SECURE,
        { expiresIn: "2m" },
      );

      return res.status(403).json({
        success: false,
        message: "Password expired. Please change it.",
        forcePasswordChange: true,
        token,
      });
    }

    await user.save();

    // ✅ Set last login time
    user.lastLogin = new Date();
    await user.save();
    // ---------------------------
    // Extract permissions
    // ---------------------------
    const permissions = (user.role?.permissions || []).map((p) => ({
      page: {
        _id: p.page?._id,
        slug: p.page?.slug,
      },
      canView: p.canView,
      canCreate: p.canCreate,
      canUpdate: p.canUpdate,
      canDelete: p.canDelete,
    }));
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: {
          id: user.role._id,
          name: user.role.name,
        },
        permissions,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// ---------------------------
// Change Password Controller
// ---------------------------

const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are required",
      });
    }

    // 🔐 Password Policy Validation

    if (newPassword.length < 8 || newPassword.length > 16) {
      return res.status(400).json({
        success: false,
        message: "Password must be between 8 and 16 characters",
      });
    }

    // At least 1 uppercase, 1 number, 1 special character
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()[\]{}\-_=+|:;"'<>,./~`]).{8,16}$/;

    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 1 uppercase letter, 1 number, and 1 special character",
      });
    }

    // ❌ Block common weak passwords
    const weakPasswords = [
      "12345678",
      "123456789",
      "password",
      "password123",
      "admin123",
      "qwerty123",
    ];

    if (weakPasswords.includes(newPassword.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message:
          "This password is too common. Please choose a stronger password.",
      });
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isMatch = await comparePassword(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // ❌ New password cannot be same as current
    const sameAsCurrent = await comparePassword(newPassword, user.password);
    if (sameAsCurrent) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be same as current password",
      });
    }

    // ❌ Cannot use name or email fragments
    const lowerNewPass = newPassword.toLowerCase();

    // 1️⃣ Split name into parts
    const nameParts = user.name
      .toLowerCase()
      .split(/\s+/)
      .filter((part) => part.length >= 3); // ignore very small words

    // 2️⃣ Extract email username (before @)
    const emailUsername = user.email.toLowerCase().split("@")[0];

    // Also split email username by dots or underscores
    const emailParts = emailUsername
      .split(/[._-]/)
      .filter((part) => part.length >= 3);

    // Combine all restricted keywords
    const restrictedWords = [...nameParts, emailUsername, ...emailParts];

    // 3️⃣ Check if password contains any restricted word
    for (let word of restrictedWords) {
      if (lowerNewPass.includes(word)) {
        return res.status(400).json({
          success: false,
          message: "Password cannot contain parts of your name or email",
        });
      }
    }

    // 🔒 Prevent reuse of last 3 passwords
    for (let oldHash of user.passwordHistory) {
      const reused = await comparePassword(newPassword, oldHash);
      if (reused) {
        return res.status(400).json({
          success: false,
          message: "You cannot reuse last 3 passwords",
        });
      }
    }

    // Save current password to history
    if (user.passwordHistory.length >= 3) {
      user.passwordHistory.shift();
    }

    user.passwordHistory.push(user.password);

    // Hash new password
    const hashed = await hashPassword(newPassword);

    user.password = hashed;
    user.mustChangePassword = false;
    user.passwordChangedAt = new Date();
    user.loginAttempts = 0;
    user.lockUntil = null;

    await user.save();

    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ---------------------------
// Get All User List
// ---------------------------

const userList = async (req, res) => {
  try {
    const user = await UserModel.find().populate("role");
    res.json(user);
  } catch (err) {
    console.log(err.message);
    res.status(500).json(err.message);
  }
};

// ---------------------------
// Remove User List
// ---------------------------

const removeUser = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: "You cannot delete yourself" });
    }
    const user = await UserModel.findByIdAndDelete(req.params.id);
    res.json(user);
  } catch (err) {
    return res.status(400).json({ error: "Access Denied!" });
  }
};

// ---------------------------
// Reset Password
// ---------------------------

const resetPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const hashedPassword = await hashPassword("12345678");

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        password: hashedPassword,
        mustChangePassword: true, // 🔥 force change on next login
        passwordChangedAt: new Date(), // important for expiry logic
        loginAttempts: 0, // reset attempts
        lockUntil: null, // unlock account if locked
      },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Password has been reset to '12345678'" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

const getSingleUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await UserModel.findById(id).populate("role");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    const user = await UserModel.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Optional: prevent duplicate email
    const existingEmailUser = await UserModel.findOne({
      email,
      _id: { $ne: id },
    });

    if (existingEmailUser) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }

    user.name = name;
    user.email = email;
    user.role = role;

    await user.save();

    res.json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  registerUserByAdmin,
  loginUser,
  userList,
  removeUser,
  changePassword,
  resetPassword,
  getSingleUser,
  updateUser,
};
