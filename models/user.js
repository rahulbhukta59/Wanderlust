const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email : {
        type : String,
        required : true
    },
    bookings: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
  }
],

});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);