const User = require("../models/user");
const Booking = require("../models/booking");
const Listing = require("../models/listing");

module.exports.renderSignupForm = (req,res) =>{
    res.render("users/signup.ejs");
};

module.exports.signup = async(req,res) =>{
    try{
    let {username, email, password} =req.body;
    const newUser = new User({email,username});
    const registeredUser = await User.register(newUser,password);
    console.log(registeredUser);
    req.login(registeredUser,(err) =>{
        if(err) {
            return next(err);
        }
    req.flash("success","Welcome to Wanderlust!");
    res.redirect("/listings");
    });
   } catch(e){
        req.flash("error",e.message);
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm =(req,res) =>{
    res.render("users/login.ejs");
};

module.exports.login = async(req,res) =>{
   let redirectUrl =req.session.returnTo || "/listings";
   delete req.session.returnTo; 
   req.flash("success","Welcome back to Wanderlust!");
   res.redirect(redirectUrl);
};

module.exports.logout =(req,res,next) =>{
    req.logout((err) =>{
        if(err){
          return next(err);
        }
        req.flash("success","You are logged out!");
        res.redirect("/listings");
    });
};

module.exports.dashboard = async (req, res) => {
  try {
     const user = req.user;
    const bookings = await Booking.find({ user: user._id }).populate("listing");

    const today = new Date();

    // Divide bookings
    const current = bookings.filter(
      b => new Date(b.checkIn) <= today && new Date(b.checkOut) >= today
    );
    const upcoming = bookings.filter(b => new Date(b.checkIn) > today);
    const past = bookings.filter(b => new Date(b.checkOut) < today);

    res.render("users/dashboard.ejs", { user: req.user, bookings });
  } catch (err) {
    console.error(err);
    req.flash("error", "Unable to load your dashboard!");
    res.redirect("/listings");
  }
};