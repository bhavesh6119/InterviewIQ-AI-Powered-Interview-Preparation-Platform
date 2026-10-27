const mongoose = require ("mongoose");

const blacklistTokenSchema = new mongoose.Schema({
    token : {
        type : String,
        required : [true,"token is required to be added to the Blacklist"]
    }
},{
    timestamps : true
})

const tokenblacklistModel = mongoose.model("blacklistTokens",blacklistTokenSchema);

module.exports = {tokenblacklistModel};