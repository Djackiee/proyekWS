const express = require('express')
const router = express.Router()
const Joi=require('joi').extend(require('@joi/date'))
const Car_manufacturer=require('../models/Car_manufacturer')
const Recall=require('../models/Recall')
const jwt=require('jsonwebtoken');
const User=require('../models/User');
const Subscription=require('../models/Subscription');
const JWT_KEY='SOAcars'
const { getDB } = require("../config/sequelize");
const sequelize = getDB();
const {QueryTypes} = require('sequelize');


//get all recalls
router.get("/:model?",async(req,res)=>{
    let model= req.query.model
    let token = req.header('x-auth-token')
    if(!req.header('x-auth-token')){
        return res.status(400).send('Authentication token is missing')
    }
    try{
      let check = jwt.verify(token, JWT_KEY);
      if(check.role != 1){
        if (model!=null) {
            let car_man=await Car_manufacturer.findOne({
                where:{
                    model:model
                }
            });
            if (!car_man) {
                return res.status(404).send({"message":"Car model not found"})
            }
            let get_recall=await Recall.findAll({
                where:{idx_car_manufacturer:car_man.idx}
            })
            let recalls=[]
            for (let i = 0; i < get_recall.length; i++) {
                let car={
                    causes:get_recall[i].cause
                }
                recalls.push(car);
            }
            display={
                model,
                recalls
            }
            return res.status(200).send(display);
        }else{
            let get_car_manufacturer=await Car_manufacturer.findAll()
            let data=[]
            for (let i = 0; i < get_car_manufacturer.length; i++) {
                
                let get_recall=await Recall.findAll({
                    where:{
                        idx_car_manufacturer:get_car_manufacturer[i].idx
                    }
                })
                let recalls=[]
                for (let j = 0; j < get_recall.length; j++) {
                    let car={
                        causes:get_recall[j].cause
                    }
                    recalls.push(car)
                }
                let display={
                    model:get_car_manufacturer[i].model,
                    recalls
                }
                data.push(display);
            }
            return res.status(200).send(data);    
        } 
      }
      else{
       let id = check.idx;
        let getHit = await Subscription.findOne({
          where:{
              id_user:check.idx
          }
      });
        let api_hit = getHit.content_access;
        if(api_hit==0){
          return res.status(200).send("Tidak bisa mendapatkan report karena sudah mencapai batas!");
        }
        else{
          if (model != null) {
            let car_man=await Car_manufacturer.findOne({
                where:{
                    model:model
                }
            });
            if (!car_man) {
                return res.status(404).send({"message":"Car model not found"})
            }
            let get_recall=await Recall.findAll({
                where:{idx_car_manufacturer:car_man.idx}
            })
            let recalls=[]
            for (let i = 0; i < get_recall.length; i++) {
                let car={
                    causes:get_recall[i].cause
                }
                recalls.push(car);
            }
            display={
                model,
                recalls
            }
            await Subscription.update(
                { content_access: sequelize.literal('content_access - 1') },
                { where: { id_user: id } }
            );
              return res.status(200).send(display);
          }
          else{
            console.log("masuk");
            await Subscription.update(
                { content_access: sequelize.literal('content_access - 1') },
                { where: { id_user: id } }
            );

            let get_car_manufacturer=await Car_manufacturer.findAll()
            let data=[]
            for (let i = 0; i < get_car_manufacturer.length; i++) {
                
                let get_recall=await Recall.findAll({
                    where:{
                        idx_car_manufacturer:get_car_manufacturer[i].idx
                    }
                })
                let recalls=[]
                for (let j = 0; j < get_recall.length; j++) {
                    let car={
                        causes:get_recall[j].cause
                    }
                    recalls.push(car)
                }
                let display={
                    model:get_car_manufacturer[i].model,
                    recalls
                }
                data.push(display);
            }
            return res.status(200).send(data);   
          }
        }
      }
    }catch(err){
      console.log(err);
      return res.status(400).send('Invalid JWT Key!')
    }
});


//post recall
router.post("/",async(req,res)=>{
    let inputs={...req.body};
    let id_manufacturer="";
    let token = req.header('x-auth-token')
    if(!req.header('x-auth-token')){
        return res.status(403).send({"messsage":'Authentication Required'})
    }
    try {
        let userdata = jwt.verify(token, JWT_KEY)
        if (userdata.role!=3) {
            return res.status(403).send({"messasge":"Unauthorized Access"});
        }
        id_manufacturer=userdata.idx;
    } catch (error) {
        return res.status(403).send({"message":'Invalid JWT Key'})
    }

    const schema=Joi.object({
        car_model:Joi.string().required(),
        cause:Joi.string().required(),
    });
    try {
        await schema.validateAsync(req.body)
    } catch (error) {
        return res.status(400).send(error.message);
    }
    let check_car_manufacturer=await Car_manufacturer.findOne({
        where:{
            model:inputs.car_model,
            idx_manufacturer:id_manufacturer
        }
    });
    if (!check_car_manufacturer) {
        return res.status(403).send({"message":"cannot recall car from different manufacturer"})
    }

    let check_car_model=await Car_manufacturer.findOne({where:{
        model:inputs.car_model
    }})
    if(!check_car_model){
        return res.status(404).send({"message":"Car not found"});
    }

    
    let insert=await Recall.create({
        idx_car_manufacturer:check_car_model.idx,
        cause:inputs.cause
    });

    let display={
        message:"car recall order",
        model:inputs.car_model,
        cause:inputs.cause
    }
    return res.status(201).send(display);

});
module.exports = router