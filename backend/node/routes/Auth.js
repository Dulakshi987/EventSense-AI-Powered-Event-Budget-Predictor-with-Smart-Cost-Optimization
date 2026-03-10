const router = require("express").Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.post("/register", async (req,res)=>{
 try{
   const {name,email,password} = req.body;

   const user = await User.findOne({email});
   if(user){
     return res.status(400).json("User already exists")
   }

   const hashedPassword = await bcrypt.hash(password,10);

   const newUser = new User({name,email,password:hashedPassword});
   await newUser.save();

   res.json("User Registered Successfully");
 }catch(err){
   res.status(500).json(err);
 }
});

router.post("/login", async (req,res)=>{
  try{
    const {email,password} = req.body;
    const user = await User.findOne({email});
    if(!user) return res.status(400).json("User not found");

    const match = await bcrypt.compare(password,user.password);
    if(!match) return res.status(400).json("Wrong password");

    const token = jwt.sign({id:user._id},process.env.JWT_SECRET);
    res.json({message:"Login Success", token, user});

  }catch(err){
    res.status(500).json(err.message);
  }
});

module.exports = router;