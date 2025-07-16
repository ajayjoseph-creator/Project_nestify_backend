// middleware/checkSubscription.js

export const checkSubscription = (req, res, next) => {
  const user = req.user; // user already set by auth middleware

  // ⚠️ If user not found (just in case)
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  const isActive =
    user.subscription?.active &&
    (!user.subscription?.nextBillingDate || new Date() < new Date(user.subscription.nextBillingDate));
 console.log("➡️ Is Active Subscription:", isActive);
console.log("📅 Today:", new Date(), "🧾 Next Billing:", user.subscription?.nextBillingDate);


  if (!isActive) {
    return res.status(403).json({
      message: "Subscription required to access this resource",
    });
  }

  next(); // ✅ Subscription is active, proceed
};
