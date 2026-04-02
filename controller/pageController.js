const Page = require("../model/pageModel.js");

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
};

// CREATE OR UPDATE
exports.createOrUpdatePage = async (req, res) => {
  try {
    const {
      id,
      name,
      path,
      icon,
      order,
      parent,
      isMenu,
      isActive,
      description,
    } = req.body;

    if (!name || !path) {
      return res.status(400).json({ message: "Name and path are required" });
    }

    let slug = generateSlug(name);

    // 🔥 Check duplicate slug
    const existing = await Page.findOne({ slug });

    if (existing && (!id || existing._id.toString() !== id)) {
      return res.status(400).json({
        message: "Slug already exists. Try a different name.",
      });
    }

    // =========================
    // CREATE
    // =========================
    if (!id) {
      const page = new Page({
        name,
        slug,
        path,
        icon,
        order,
        parent: parent || null,
        isMenu,
        isActive,
        description,
      });

      await page.save();

      return res.status(200).json({
        message: "Page created successfully",
        data: page,
      });
    }

    // =========================
    // UPDATE
    // =========================
    const page = await Page.findById(id);

    if (!page) {
      return res.status(404).json({ message: "Page not found" });
    }

    page.name = name;
    page.slug = slug;
    page.path = path;
    page.icon = icon;
    page.order = order;
    page.parent = parent || null;
    page.isMenu = isMenu;
    page.isActive = isActive;
    page.description = description;

    await page.save();

    return res.json({
      message: "Page updated successfully",
      data: page,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deletePage = async (req, res) => {
  try {
    const { id } = req.params;

    const page = await Page.findById(id);

    if (!page) {
      return res.status(404).json({ message: "Page not found" });
    }

    // 🔥 Check if it has children
    const hasChildren = await Page.findOne({ parent: id });

    if (hasChildren) {
      return res.status(400).json({
        message: "Cannot delete page with child pages",
      });
    }

    await Page.findByIdAndDelete(id);

    return res.json({
      message: "Page deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllPages = async (req, res) => {
  try {
    const pages = await Page.find({ isActive: true }).sort({ order: 1 });

    const map = {};
    const roots = [];

    // Create map
    pages.forEach((page) => {
      map[page._id] = {
        ...page.toObject(),
        children: [],
      };
    });

    // Build tree
    pages.forEach((page) => {
      if (page.parent) {
        map[page.parent]?.children.push(map[page._id]);
      } else {
        roots.push(map[page._id]);
      }
    });

    return res.json(roots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getSinglePage = async (req, res) => {
  try {
    const { id } = req.params;

    const page = await Page.findById(id);

    if (!page) {
      return res.status(404).json({ message: "Page not found" });
    }

    return res.json(page);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
