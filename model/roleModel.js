const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    permissions: [
      {
        page: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Page",
          required: true,
        },

        canView: { type: Boolean, default: false },
        canCreate: { type: Boolean, default: false },
        canUpdate: { type: Boolean, default: false },
        canDelete: { type: Boolean, default: false },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      name: String,
      email: String,
    },
    updatedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      name: String,
      email: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Role", roleSchema);
