
import Property from "../models/Property.js";
import User from "../models/User.js";

export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProperties = await Property.countDocuments();

    const revenueAgg = await User.aggregate([
      { $match: { "subscription.active": true } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$subscription.price" },
        },
      },
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    res.status(200).json({
      totalUsers,
      totalProperties,
      totalRevenue,
    });
  } catch (error) {
    console.error("🔴 Admin Stats Error:", error);
    res.status(500).json({ message: "Failed to fetch admin stats" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // exclude password
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};


export const toggleBlockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { isBlocked } = req.body; // true or false

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.isBlocked = isBlocked;
    await user.save();

    res.status(200).json({
      message: `User has been ${isBlocked ? "blocked" : "unblocked"} successfully.`,
    });
  } catch (error) {
    console.error("Toggle block error:", error);
    res.status(500).json({ message: "Something went wrong.", error });
  }
};

export const getAllProperties = async (req, res) => {
  try {
    const property = await Property.find();
    res.status(200).json(property);
  } catch (err) {
    console.error("❌ Error fetching products", err);
    res.status(500).json({ message: "Server error" });
  }
};
