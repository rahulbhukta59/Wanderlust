//controllers/booking.js

const Listing = require("../models/listing");
const Booking = require("../models/booking");
const User = require("../models/user");

module.exports.createBooking = async (req, res) => {
  try {
    const { id } = req.params; // listing id
    const { checkIn, checkOut } = req.body;

    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    if (
      !checkIn ||
      !checkOut ||
      isNaN(new Date(checkIn)) ||
      isNaN(new Date(checkOut))
    ) {
      req.flash("error", "Invalid date format!");
      return res.redirect(`/listings/${id}`);
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const timeDiff = (checkOutDate - checkInDate);
    const numberOfDays =Math.round((timeDiff) / (1000 * 60 * 60 * 24));

    if (numberOfDays <= 0) {
      req.flash("error", "Invalid date selection!");
      return res.redirect(`/listings/${id}`);
    }

    const totalPrice = Math.round(listing.price*1.18 * numberOfDays);

    const booking = new Booking({
      user: req.user._id,
      listing: id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      numberOfDays,
      totalPrice,
      paymentId: "TEMP-" + Date.now(),
    });

    await booking.save();

  await User.findByIdAndUpdate(req.user._id, { $push: { bookings: booking._id } });

    // Link the booking to the listing
    await Listing.findByIdAndUpdate(id, { $push: { bookings: booking._id } });
 console.log("✅ Booking created and linked to user:", booking._id);

    req.flash("success", "Booking confirmed successfully!");
    res.redirect("/bookings/mybookings");
  } catch (err) {
    console.error("Booking creation error:", err);
    req.flash("error", "Something went wrong while booking!");
    res.redirect("/listings");
  }
};


// Show all bookings of logged-in user
module.exports.showUserBookings = async (req, res) => {
 try{
  const bookings = await Booking.find({ user: req.user._id }).populate("listing");
  console.log("📘 User bookings found:", bookings.length);
   res.render("bookings/mybookings.ejs", { bookings });
} catch(err){
   console.error("❌ Error loading user bookings:", err);
    req.flash("error", "Unable to load your bookings!");
    res.redirect("/listings");
}
};

// controllers/user.js or controllers/bookings.js
module.exports.dashboard = async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id }).populate("listing");
  res.render("users/dashboard.ejs", { bookings });
};

module.exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    await Booking.findByIdAndDelete(id);
    req.flash("success", "Booking canceled successfully!");
    res.redirect("/dashboard");
  } catch (err) {
    console.error("❌ Error canceling booking:", err);
    req.flash("error", "Failed to cancel booking.");
    res.redirect("/bookings/mybookings");
  }
};
