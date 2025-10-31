const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { isLoggedIn } = require("../middleware");
const Booking = require("../models/booking");

const router = express.Router();
const paymentController = require("../controllers/payments");

// ✅ Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,       // Make sure this is in your .env file
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Route to create an order
router.post("/create-order",isLoggedIn,paymentController.createOrder, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: "Invalid amount provided" });
    }

    const options = {
      amount: amount * 100, // amount in paise (₹1 = 100 paise)
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
});


// ✅ Route to verify payment signature
router.post("/verify-payment",isLoggedIn,paymentController.verifyPayment, (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.log("Missing payment details");
      return res.status(400).json({ success: false, message: "Missing payment details" });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    // console.log("🔑 Expected Signature:", expectedSign);
    // console.log("🆚 Received Signature:", razorpay_signature);

    if (expectedSign === razorpay_signature) {
       console.log("✅ Payment Verified Successfully!");
      return res.status(200).json({ success: true, message: "Payment verified successfully",redirectUrl: `/booking/confirmed?order_id=${razorpay_order_id}`});
    } else {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    console.error("Razorpay verification error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
});

// Show booking confirmation page
router.get("/booking/confirmed",isLoggedIn, (req, res) => {
  res.render("bookingConfirmed.ejs");
});



module.exports = router;
