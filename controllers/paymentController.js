import Razorpay from "razorpay";
import crypto from "crypto";
import User from "../models/User.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Create Order
export const createOrder = async (req, res) => {
  const { plan } = req.body;
  const priceMap = {
    monthly: 299,
    fiveMonths: 999,
    yearly: 2000,
  };
  const amount = priceMap[plan] * 100; // Razorpay expects paisa

  try {
    const options = {
      amount,
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // frontend-il vendi
    });
  } catch (err) {
    console.error("Order create error:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
};

// Verify Payment & Activate Subscription
export const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

  // 1️⃣ Verify signature
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: "Invalid signature" });
  }

  // 2️⃣ Find user
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: "User not found" });

  // 3️⃣ Calculate subscription dates
  const now = new Date();
  const nextBillingDate = new Date(now);

  if (plan === "monthly") nextBillingDate.setMonth(now.getMonth() + 1);
  if (plan === "fiveMonths") nextBillingDate.setMonth(now.getMonth() + 5);
  if (plan === "yearly") nextBillingDate.setFullYear(now.getFullYear() + 1);

  // 4️⃣ Update subscription info
  user.subscription = {
    active: true,
    plan,
    price: { monthly: 299, fiveMonths: 999, yearly: 2000 }[plan],
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    signature: razorpay_signature,
    startDate: now,
    nextBillingDate,
  };

  await user.save();

  res.json({
    success: true,
    message: "Subscription activated",
    subscription: user.subscription,
  });
};
