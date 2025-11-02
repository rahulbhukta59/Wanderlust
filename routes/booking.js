// routes/booking.js

const express = require("express");
const router = express.Router({ mergeParams: true });
const bookingController = require("../controllers/bookings.js");
const { isLoggedIn } = require("../middleware.js");
const wrapAsync = require("../utils/wrapAsync.js");


// Route to create a new booking
router.post("/", isLoggedIn, wrapAsync(bookingController.createBooking));

// Route to show user's bookings
router.get("/mybookings", isLoggedIn, wrapAsync(bookingController.showUserBookings));

// Route to cancel a booking
router.delete("/:id", isLoggedIn, wrapAsync(bookingController.cancelBooking));

module.exports = router;
