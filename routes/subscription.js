import express from "express";
import { activateSubscription, cancelSubscription, checkSubscription } from "../controllers/SubscriptionController.js";

const router = express.Router();

router.post('/subscription_Active',activateSubscription)
router.post("/subscription_Cancel", cancelSubscription);
router.get("/subscription_Check/:userId", checkSubscription);

export default router;



