const mongoose = require ("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [true,"username already exits"],
        required: true
    },

    email : {
        type : String,
        uninque : [true , "Email already registered"],
        require : true
    },

    password : {
        type : String,
        required : true
    }
});

const userModel = mongoose.model("user",userSchema);

module.exports = userModel;