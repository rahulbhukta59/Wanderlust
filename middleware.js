const Listing = require("./models/listing");
const Review = require("./models/review.js")
const ExpressError =require("./utils/ExpressError.js");
const {listingSchema,reviewSchema}=require("./schema.js");

module.exports.isLoggedIn = (req,res,next) =>{
    if (!req.isAuthenticated || !req.isAuthenticated()) {
    if (req.xhr || req.headers.accept.includes('application/json')) {
      return res.status(401).json({ error: "Not logged in", redirect: "/login" });
    }
    req.flash("error", "You are not eligible to perform this action. Please log in first!");
    return res.redirect("/login");
  }
  next();
};

module.exports.saveRedirectUrl = (req,res,next) =>{
    if (req.session.returnTo){
        res.locals.returnTo = req.session.returnTo;
    }
    next();
};

module.exports.isOwner = async (req,res,next) =>{
    let {id} = req.params;
    let listing = await Listing.findById(id);
     if(!listing.owner.equals(res.locals.currUser._id)){
        req.flash("error","You don't have permission to do this action!");
        return res.redirect(`/listings/${id}`);
     }
     next();
};

module.exports.validateListing =(req,res,next) =>{
let {error} = listingSchema.validate(req.body);
if(error){
    let errMsg = error.details.map((el) =>el.message).join(",");
    throw new ExpressError(400,errMsg);
  }else{
      next();
}
};

module.exports.validateReview =(req,res,next) =>{
let {error} = reviewSchema.validate(req.body);
if(error){
    let errMsg = error.details.map((el) =>el.message).join(",");
    throw new ExpressError(400,errMsg);
  }else{
      next();
}
};

module.exports.isReviewAuthor = async (req,res,next) =>{
    let {id, reviewId} = req.params;
    let review = await Review.findById(reviewId);
     if(!review.author.equals(res.locals.currUser._id)){
        req.flash("error","You don't have permission to do this action!");
        return res.redirect(`/listings/${id}`);
     }
     next();
};