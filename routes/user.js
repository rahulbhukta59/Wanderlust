const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const userController = require("../controllers/users.js");
const { saveRedirectUrl, isLoggedIn } = require("../middleware.js"); // ✅ Make sure isLoggedIn is imported
const Booking = require("../models/booking.js"); // ✅ Import Booking model

router.route("/signup")
  .get(userController.renderSignupForm)
  .post(wrapAsync(userController.signup));

router.route("/login")
  .get(userController.renderLoginForm)
  .post(
    saveRedirectUrl,
    passport.authenticate("local", {
      failureFlash: true,
      failureRedirect: "/login",
    }),
    userController.login
  );

router.get("/logout", userController.logout);

router.get("/dashboard", async (req, res) => {
  if (!req.user) return res.redirect("/login");

  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("listing")
      .sort({ checkIn: 1 });

    const today = new Date();

    // ✅ Categorize bookings based on date
    const current = bookings.filter(
      (b) =>
        new Date(b.checkIn) <= today && new Date(b.checkOut) >= today
    );

    const upcoming = bookings.filter((b) => new Date(b.checkIn) > today);
    const past = bookings.filter((b) => new Date(b.checkOut) < today);

    // ✅ Pass all to EJS
    res.render("users/dashboard", {
      user: req.user,
      current,
      upcoming,
      past,
    });
  } catch (err) {
    console.error("🔥 INTERNAL SERVER ERROR:", err);
    res.status(500).render("error", { message: "Failed to load dashboard." });
  }
});



module.exports = router;
