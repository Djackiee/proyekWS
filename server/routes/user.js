const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Subsrciption = require('../models/Subscription')
const Joi = require('joi').extend(require('@joi/date'));
const jwt = require("jsonwebtoken");
const Tier = require('../models/Tier');
const Subscription = require('../models/Subscription');
const JWT_KEY = 'SOAcars';
const bcrypt = require("bcrypt");
const { logger } = require('sequelize/lib/utils/logger');


const checkUniqueEmail = async (email) => { 
    let user = await User.findOne({
        where:{
            email:email
        }
    });

    if(user){
        throw new Error("Email Already Registered");
    }
};

router.post("/register",async(req,res)=>{
    let {email,username,password,name} = req.body;
    const schema = Joi.object({
        email: Joi.string().email().external(checkUniqueEmail).required(),
        username: Joi.string().required(),
        password:Joi.string().required(),
        name:Joi.string().required()
    });

    try {
        await schema.validateAsync(req.body)
    } catch (error) {
        return res.status(403).send(error.toString())
    }

    let newUser = await User.create({
        email:email,
        username:username,
        password:password,
        name:name,
        account_type:"-",
        API_KEY:"",
    });

    let body = {
        message:"User Registered Successfully",
        email:email,
        username:username,
        name:name,
    }

    return res.status(201).send({
        body
    });

});


router.post("/login",async(req,res)=>{
    let {email,password} = req.body;

    const schema = Joi.object({
        email:Joi.string().email().required(),
        password:Joi.string().required(),
    });

    try {
        await schema.validateAsync(req.body);
    } catch (error) {
        return res.status(403).send(error.toString())
    }

    
    let loginUser= await User.findOne({
        where:{
            email:email,
        }
    });

    if(loginUser){
        if(loginUser.password==password){
            let token = jwt.sign({
                idx:loginUser.idx,
                name: loginUser.name,
                username:loginUser.username,
                role:1 //user role
            }, JWT_KEY, {expiresIn: '3600s'})
        
            let updateUser = await User.update({
                API_KEY:token
            },{
                where:{
                    email:email
                }
            });
        
            return res.status(200).send({
                message:`Welcome ${loginUser.name}`,
                API_KEY:token
            });
        }
        return res.status(400).send({
            message:`Wrong Password`,
        }); 
    }
    return res.status(404).send({
        message:`Not Found`,
    }); 
    

});


router.get("/tiers/:id",async(req,res)=>{
    const {id} = req.params;
    let tiers = await Tier.findOne({
        where:{
            idx:id
        }
    });

    if(tiers){
        return res.status(200).send({
            tiers
        });
    }
    else{
        return res.status(404).send({
            message:"No tier found"
        });
    }
    
});

router.get("/tiers/",async(req,res)=>{
    let tiers = await Tier.findAll();

    if(tiers.length>0){
        return res.status(200).send({
            tiers
        });
    }
    else{
        return res.status(404).send({
            message:"No tier found"
        });
    }
    
});



router.post("/subscription",async(req,res)=>{
    let token = req.header('x-auth-token');

    if(!req.header('x-auth-token')){
        return res.status(400).send('Authentication token is missing');
    }
    try {
        let userdata = jwt.verify(token, JWT_KEY);
        if(userdata.role == 1){
            let {tier} = req.body;
    
            const schema = Joi.object({
                tier:Joi.string().required(),
            });
    
            try {
                await schema.validateAsync(req.body);
            } catch (error) {
                return res.status(403).send(error.toString())
            }
    
            let getTier = await Tier.findOne({
                where:{
                    idx:tier
                }
            });

            if(!getTier){
                return res.status(404).send('Tier not found')
            }
    
            let subscription = await Subsrciption.findOne({
                where:{
                    id_user:userdata.idx
                }
            });
    
            let amount;
    
            if(subscription){
                amount = subscription.content_access + getTier.content_access;
    
                let updateSubscribe = await Subscription.update({
                    content_access: amount
                },{
                    where:{
                        id_user:userdata.idx
                    }
                });
                
            }
            else{
                amount =  getTier.content_access;
    
                let insertSubscribe = await Subscription.create({
                    id_user:userdata.idx,
                    tier:getTier.idx,
                    content_access: amount
                });
            }
            return res.status(200).send({
                message:"Subscribe",
                tier:getTier.tier_name,
                price:getTier.price,
                left_access:`${amount} `
            });
        }
        else{
            return res.status(403).send({
                message:"Unauthorized"
            });
        }
    } catch (error) {
        return res.status(400).send({message:"Token Expired"});
    }
    
});


router.get("/profile", async(req,res)=>{
    let token = req.header('x-auth-token');

    if(!req.header('x-auth-token')){
        return res.status(400).send('Authentication token is missing');
    }
    try {
        let userdata = jwt.verify(token, JWT_KEY);
    
        if(userdata.role == 1){
          
            
            let user = await User.findOne({
                where:{
                    idx:userdata.idx
                }
            });
    

            let subsrciption = await Subsrciption.findOne({
                attributes:['tier','content_access']
            },{
                where:{
                    id_user:userdata.idx
                }
            });

            if(!subsrciption){
                subsrciption = {
                    tier:'',
                    content_access:0
                }
            }

            let user_data = {
                email:user.email,
                username:user.username,
                name:user.name,
                tier:subsrciption.tier,
                content_access:subsrciption.content_access
            }
            return res.status(200).send({
                message:"Profile",
                user_data
            });
        }
        else{
            return res.status(403).send({
                message:"Unauthorized"
            });
        }
    } catch (error) {
        return res.status(400).send({message:"Token Expired"});
    }
    
});

module.exports = router;