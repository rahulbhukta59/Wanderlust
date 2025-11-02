if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride =require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError =require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRoutes = require("./routes/user.js");
const { connect } = require('http2');
const paymentRoutes = require("./routes/payment.js"); 
const bookingRoutes = require("./routes/booking");

// const MONGO_URL="mongodb://127.0.0.1:27017/wanderlust";
const dbUrl =process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

async function main(){
    try{
   await mongoose.connect(dbUrl,{
    ssl: dbUrl.includes("mongodb+srv"),
    tlsAllowInvalidCertificates: true,
    });
    console.log( `✅ Connected to MongoDB: ${dbUrl.includes("mongodb+srv") ? "Atlas" : "Local Wanderlust"}`);
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}
 main();

app.engine("ejs",ejsMate);
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname,"/public")));
app.use(express.json());

const store =MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret:process.env.SECRET,
    },
    touchAfter: 24*3600,
});

store.on("error",(err) =>{
    console.log("ERROR in MONGO SESSION STORE",err);
});

const sessionOptions ={
    store,
    secret :process.env.SECRET,
    resave : false,
    saveUninitialized : true,
    cookie :{
        expires : Date.now() + 7*24*60*60*1000,
        maxAge : 7*24*60*60*1000,
        httpOnly : true,
    },
};

// app.get("/",(req,res) =>{
//     res.send("Hi,it is root");
// });

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// app.use((req, res, next) => {
//   res.locals.currUser = req.user;
//   next();
// });

app.use((req,res,next) =>{
    res.locals.currUser = req.user || null;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});


app.use("/listings",listingsRouter);
app.use("/listings/:id/reviews",reviewsRouter);
app.use("/listings/:id/bookings", bookingRoutes); 
app.use("/bookings", bookingRoutes);
app.use("/payment", paymentRoutes); 
app.use("/",userRoutes);

app.get("/booking/confirmed", (req, res) => {
  res.render("bookingConfirmed",{ query: req.query }); // this will render bookingConfirmed.ejs
});

app.get("/", (req, res) => {
    res.redirect("/listings");
});

app.use((req, res) => {
  res.status(404).render("error.ejs", { message: "Page Not Found!" });
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (statusCode === 404) {
    console.warn("⚠️ 404 - Page Not Found:", req.originalUrl);
  } else {
    console.error("🔥 INTERNAL SERVER ERROR:", err);
  }

  if (!err.message) err.message = "Something went wrong!";
  res.status(statusCode).render("error.ejs", { message: err.message });
});


app.listen(8080,() =>{
    console.log("server is listening to port 8080");
});