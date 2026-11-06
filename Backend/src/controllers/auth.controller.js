const userModel = require ("../models/user.model");
const bcrypt = require ("bcryptjs");
const jwt = require ("jsonwebtoken");
const tokenblacklistModel = require("../models/blacklist.model");

/**
 * @name registerUserController
 * @description register a user , expects username,email and password in the request body
 * @access Public
 */

async function registerUserController(req,res){
    const { username,email,password } = req.body;

    if(!username || !email || !password ){
        return res.status(400).json({
            message: "Please provide username, email and password"
        });
    }

    const isUserAlreadyExits = await userModel.findOne({
        $or: [
            { username },
            { email }
        ]
    });

    if(isUserAlreadyExits){
        return res.status(400).json({
            message: "Account already exist with this Username or Email"
        });
    }

    const hash = await bcrypt.hash(password,10);

    const user = await userModel.create({
        username,
        email,
        password : hash
    })

    const token = jwt.sign({
        id : user._id,
        username : user.username
    },process.env.JWT_SECRET,
    {
        expiresIn : "1d"
    })

    res.cookie("token", token);

    res.status(201).json({
        message : "User Registered Successfully",
        user : {
            id : user._id,
            username : user.username,
            email : user.email
        }
    })
};

/**
 * @name loginUserController
 * @description login a user, expects user username,email and password
 * @access Public
 */
async function loginUserController(req,res){
    const { email,password } = req.body;

    const user = await userModel.findOne({ email });

    if(!user){
        return res.status(400).json({
            message : "Invalid email or password"
        })
    }

    const isPasswordValid = await bcrypt.compare(password , user.password);

    if(!isPasswordValid){
        return res.status(400).json({
            message : "Invalid password"
        });
    }

    const token =jwt.sign ({
        id : user._id,
        username : user.username
    }, 
    process.env.JWT_SECRET,
    {
        expiresIn : "1d"
    })

    res.cookie("token", token);

    return res.status(200).json({
        message : "User Logged in Successfully",
        user : {
            id : user._id,
            username : user.username,
            email : user.email
        }
    });
}


/**
 * @name logoutUserController
 * @description clear a token from user cookie and add it in the blacklist
 * @access Public
 */

async function logoutUserController(req,res){
    const token = req.cookies.token;

    if(token){
        await tokenblacklistModel.create({ token });
    }
    
    res.clearCookie("token");

    res.status(200).json({
        message : "User logged out successfully"
    });
}


/**
 * @name getmeController
 * @description get the current logged in user details
 * @access Public 
 */

async function getmeController(req,res){
    const user = await userModel.findById(req.user.id);

    res.status(200).json({
        message : "User details fetched successfully",
        user : {
            id : user._id,
            username : user.username,
            email : user.email
        }
    })
}


module.exports = { registerUserController, loginUserController, logoutUserController, getmeController };
