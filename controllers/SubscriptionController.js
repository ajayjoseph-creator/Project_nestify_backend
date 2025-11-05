import User from "../models/User.js";

// 📌 Activate subscription
export const activateSubscription = async (req, res) => {
  try {
    const { userId, plan, price } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = new Date();
    const nextBillingDate = new Date(now);
    nextBillingDate.setMonth(now.getMonth() + 1);

    user.subscription = {
      active: true,
      plan: plan || "premium",
      price: price || 299,
      startDate: now,
      nextBillingDate,
    };

    await user.save();

    res.status(200).json({ message: "Subscription activated", subscription: user.subscription });
  } catch (err) {
    console.error("Activate error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 📌 Cancel subscription
export const cancelSubscription = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.subscription = {
      active: false,
      plan: null,
      price: null,
      startDate: null,
      nextBillingDate: null,
    };

    await user.save();

    res.status(200).json({ message: "Subscription cancelled" });
  } catch (err) {
    console.error("Cancel error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 📌 Check subscription (with automatic expiry)
export const checkSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Automatic expiry
    if (user.subscription?.active && new Date() > new Date(user.subscription.nextBillingDate)) {
      user.subscription.active = false;
      await user.save();
    }

    res.status(200).json({ subscription: user.subscription });
  } catch (err) {
    console.error("Check error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
