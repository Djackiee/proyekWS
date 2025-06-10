const express = require('express')
const router = express.Router()
const Joi = require('joi').extend(require('@joi/date'))
const Manufacturer=require('../models/Manufacturer')
const jwt = require("jsonwebtoken");
const JWT_KEY = 'SOAcars'


// register
router.post("/register",async(req,res)=>{
    let inputs={...req.body};
    const schema=Joi.object({
        name:Joi.string().required(),
        country_origin:Joi.string().required(),
        region_id:Joi.string().required(),
        plant_code:Joi.string().required(),
        password:Joi.string().required().min(8),
    });
    try {
        await schema.validateAsync(req.body)
    } catch (error) {
        return res.status(400).send({"message":error.details[0].message});
    }
    let check_manufacturer=await Manufacturer.findOne({
        where:{
            name:inputs.name,
            plant_code:inputs.plant_code
        }
    })
    if (check_manufacturer) {
        return res.status(400).send({"message":"manufacturer cannot have the same plant code"});
    }
    let insert=await Manufacturer.create({
        name:inputs.name,
        country_origin:inputs.country_origin,
        region_id:inputs.region_id,
        plant_code:inputs.plant_code,
        password:inputs.password,
        authorized:0
    });
    
    let display={
        name:inputs.name,
        country_origin:inputs.country_origin,
        region_id:inputs.region_id,
        plant_code:inputs.plant_code,
        password:inputs.password,
        authorized:"not authorized"
    };
    return res.status(201).send(display)
});

router.post("/login",async(req,res)=>{
    let inputs={...req.body}
    
    const schema = Joi.object({
    name: Joi.string().required(),
    password: Joi.string().required(),
    plant_code: Joi.string().required()
    });

    const { error } = schema.validate(inputs);

    if (error) {
    return res.status(400).send({ message: error.details[0].message });
    }

    let find_manufacturer=await Manufacturer.findOne({
        where:{
            name:inputs.name,
            password:inputs.password,
            plant_code:inputs.plant_code
        }
    });

    if (!find_manufacturer) {
        return res.status(400).send({"message":"name/password/plant_code is invalid"});
    }

    let token = jwt.sign({
        idx:find_manufacturer.idx,
        name:inputs.name,
        role:3 //manufacturer role
    }, JWT_KEY, {expiresIn: '3600s'})

    let display={
        message:"Login Successful",
        token:token
    }
    return res.status(200).send(display);
});

module.exports = router