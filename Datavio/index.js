const express = require('express')
const app = express();
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');

app.use(express.json());

//Defining Schema for user

const userSchema = mongoose.Schema({
    username: String,
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
          validator: function(value) {
            // Use a regular expression for email format validation
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
          },
          message: 'Invalid email format'
        }
      },    
    password: String
    // payload: String,
    // // productUrl: [{type: mongoose.Schema.Types.ObjectId, ref:''}]
    // productUrl: {
    //     title: String,
    //     price: String,
    //     description: String,
    //     countOfReviewsAndRating: String,
    //     Rating: Number,
    //     mediaCounts: Number    
    // }
})

const itemSchema = mongoose.Schema({
    title: String,
    price: String,
    description: String,
    countOfReviewsAndRating: String,
    Rating: Number,
    mediaCounts: Number
})

const User = mongoose.model('User',userSchema);
const Items = mongoose.model('Items',itemSchema);

var secretKey = "san332$5wf";
//generating token for user
const jwtToken = (user)=>{
    var payload = user.mail;
    return jwt.sign({payload},secretKey,{expiresIn:'1h'});
}

const userAuthenticator = (req,res,next)=>{
   const userAuth = req.headers.authorization;
   if(userAuth){
    const token = userAuth.split(' ')[1];
    jwt.verify(token,secretKey,(err,user)=>{
        if(err){
            res.sendStatus(403);
        }
        else{
            req.user = user;
            next();
        }
    })
   }
}

mongoose.connect('mongodb+srv://YourUsername:Password@mydatabase.1cn6h07.mongodb.net/',{useNewUrlParser: true, useUnifiedTopology: true, dbName: "Flipkart"});

app.post("/Signup",async(req,res)=>{
    const {username,email,password} = req.body;
    var user = await User.findOne({email});
    if(user){
        res.status(403).json({message:"User already Exist, Please login"});
    }
    else{
        const newUser = new User({username,email,password});
        await newUser.save();
        var token =jwtToken(username);
        res.json({message:"User created Successfully",token});
    }
});

app.post("/SignIn",async(req,res)=>{
    const {email,password} = req.body;
    var user = await User.findOne({email, password});
    if(user){
        const token = jwtToken(email);
        res.json({message:"Logged in Successfully",token});
    }
    else{
        res.status(403).json({message:"Invalid email or password"});
    }
})


app.post("/product",userAuthenticator,(req,res)=>{
   var payload = req.headers.payload;
   const url = payload;
   const scrapeFlipkart = async(url)=>{
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    var title = $('h1 span').text();
    const price = $('._16Jk6d').text();
    const description = $('._1mXcCf.RmoJUa > p').text();
    const reviews = $('._2_R_DZ:first').text();
    const rating = $('._3LWZlK:first').text();
    const mediaCount = $('._3GnUWp').find('li').length;
    res.json({title,description,price,reviews,rating,mediaCount});
}
   scrapeFlipkart(url);
})



app.listen(3000,()=>{
     console.log("App is listening on port 3000");
})
