import Razorpay from "razorpay";
import crypto from "crypto";
import User from "../models/User.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// 🧾 Create order
// 🧾 Create Razorpay Order
export const createOrder = async (req, res) => {
  const { plan } = req.body;
  const priceMap = {
    monthly: 299,
    fiveMonths: 999,
    yearly: 2000,
  };
  const amount = priceMap[plan] * 100;

  try {
    const options = {
      amount,
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);

    // ✅ Include keyId in response
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // 👈 THIS is needed in frontend
    });
  } catch (err) {
    console.error("Order create error:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
};


// ✅ Verify payment & activate subscription
// export const verifyPayment = async (req, res) => {
//   const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;
// console.log("🔍 Razorpay verify data:", {
//   orderId: razorpay_order_id,
//   paymentId: razorpay_payment_id,
//   signature: razorpay_signature,
//   plan,
//   user: req.user,
// });


//   const expectedSignature = crypto
//     .createHmac("sha256", process.env.RAZORPAY_SECRET)
//     .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//     .digest("hex");

//   if (expectedSignature !== razorpay_signature) {
//     return res.status(400).json({ error: "Invalid signature" });
//   }

//   const user = await User.findById(req.user._id);
//   if (!user) return res.status(404).json({ error: "User not found" });

//   const now = new Date();
//   const nextBillingDate = new Date(now);

//   if (plan === "monthly") nextBillingDate.setMonth(now.getMonth() + 1);
//   if (plan === "fiveMonths") nextBillingDate.setMonth(now.getMonth() + 5);
//   if (plan === "yearly") nextBillingDate.setFullYear(now.getFullYear() + 1);

//   user.subscription = {
//     active: true,
//     plan,
//     price: {
//       monthly: 299,
//       fiveMonths: 999,
//       yearly: 2000,
//     }[plan],
//     paymentId: razorpay_payment_id,
//     orderId: razorpay_order_id,
//     signature: razorpay_signature,
//     startDate: now,
//     nextBillingDate,
//   };

//   await user.save();
//   res.json({ success: true, message: "Subscription activated" });
// };



export const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

  console.log("🔍 Razorpay verify data:", {
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
    plan,
    user: req.user,
  });

  // Step 1: Verify Razorpay signature
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: "Invalid signature" });
  }

  // Step 2: Find the user
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: "User not found" });

  // Step 3: Calculate billing dates
  const now = new Date();
  const nextBillingDate = new Date(now);

  if (plan === "monthly") nextBillingDate.setMonth(now.getMonth() + 1);
  if (plan === "fiveMonths") nextBillingDate.setMonth(now.getMonth() + 5);
  if (plan === "yearly") nextBillingDate.setFullYear(now.getFullYear() + 1);

  // Step 4: Update subscription info (individually)
  user.subscription.active = true;
  user.subscription.plan = plan;
  user.subscription.price = {
    monthly: 299,
    fiveMonths: 999,
    yearly: 2000,
  }[plan];
  user.subscription.paymentId = razorpay_payment_id;
  user.subscription.orderId = razorpay_order_id;
  user.subscription.signature = razorpay_signature;
  user.subscription.startDate = now;
  user.subscription.nextBillingDate = nextBillingDate;

  // Step 5: Let Mongoose know we updated a nested field
  user.markModified("subscription");

  await user.save();

  // Step 6: Respond success
  res.json({ success: true, message: "Subscription activated" });
};
