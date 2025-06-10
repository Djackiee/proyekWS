const express = require('express')
const router = express.Router()

const Car=require('../models/Car');
const Manufacturer=require('../models/Manufacturer');
const Car_manufacturer=require('../models/Car_manufacturer');
const Report=require('../models/Report');
const axios=require('axios');
const jwt=require('jsonwebtoken');
const Joi = require('joi').extend(require('@joi/date'))
const User=require('../models/User');
const Subscription=require('../models/Subscription');
const JWT_KEY = 'SOAcars'
const { getDB } = require("../config/sequelize");
const sequelize = getDB();
const {QueryTypes} = require('sequelize');

//get car details
router.get("/:vin?",async(req,res)=>{
    let vin= req.query.vin
    let token = req.header('x-auth-token')
    if(!req.header('x-auth-token')){
        return res.status(400).send('Authentication token is missing')
    }
    try{
      let check = jwt.verify(token, JWT_KEY);
      if(check.role != 1){
        if (vin!=null) {
            let car_vin=await Car.findOne({
                where:{
                    vin:vin
                }
            });
            if (!car_vin) {
                return res.status(404).send({"message":"Car vin not found"})
            }
            let car_model=await Car_manufacturer.findOne({
                where:{
                    idx:car_vin.idx_car_manufacturer,
                },attributes:['model','year','drive','fuel_type','transmission','cylinders']
            })
            let car_model2=await Car_manufacturer.findOne({where:{idx:car_vin.idx_car_manufacturer}});
            let manufacturer=await Manufacturer.findOne({
                where:{idx:car_model2.idx_manufacturer},
                attributes:['name']
            })
            
            display={
                vin,
                car_model,
                manufacturer
            }
            return res.status(200).send(display);
        }else{
            return res.status(400).send({"message":"must provide vin number"})
        } 
      }
      //user hit
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
          if (vin != null) {
            let car_vin=await Car.findOne({
                where:{
                    vin:vin
                }
            });
            if (!car_vin) {
                return res.status(404).send({"message":"Car vin not found"})
            }
            let car_model=await Car_manufacturer.findOne({
                where:{
                    idx:car_vin.idx_car_manufacturer,
                },attributes:['model','year','drive','fuel_type','transmission','cylinders']
            })
            let car_model2=await Car_manufacturer.findOne({where:{idx:car_vin.idx_car_manufacturer}});
            let manufacturer=await Manufacturer.findOne({
                where:{idx:car_model2.idx_manufacturer},
                attributes:['name']
            })
            
            display={
                vin,
                car_model,
                manufacturer
            }
            let updateHit = await Subscription.decrement(
                { content_access: 1 },
                { where: { id_user: id } }
            );
              return res.status(200).send(display);
          }
          else{
            console.log("masuk");
             return res.status(400).send({"message":"must provide vin number"});
          }
        }
      }
    }catch(err){
      console.log(err);
      return res.status(400).send('Invalid JWT Key!')
    }    
})

// add models
router.post("/manufacturer/new",async(req,res)=>{
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

    let manufacturer_data=await Manufacturer.findByPk(id_manufacturer);
    if (manufacturer_data.authorized==0) {
        return res.status(403).send("Cannot post request,this user needs admin's approval.");
    }
    
        if (typeof inputs === 'object' && inputs !== null && Object.keys(inputs).length > 0) {
            const {
                model,
                manufacturer,
                fuel_type,
                drive,
                cylinders,
                transmission,
                year
            } = inputs;
        let api_car=await axios.get('https://api.api-ninjas.com/v1/cars', {
            params: {
            'model': inputs.model,
            'make': inputs.manufacturer,
            'fuel_type': inputs.fuel_type,
            'drive': inputs.drive,
            'cylinders': inputs.cylinders,
            'transmission': inputs.transmission,
            'year': inputs.year,
            },
            headers: {
            'accept': 'application/json',
            'X-Api-Key': '4LOPGxGX4/O1kovuYWUW4w==MzKpj7kYBiaKzEJZ'
            }
        });
        
        if (api_car.data.length==0) {
            return res.status(404).send({"message":"car not found"});
        }else{
            let insert=await Car_manufacturer.create({
                model:api_car.data[0].model,
                idx_manufacturer:id_manufacturer,
                fuel_type:api_car.data[0].fuel_type,
                year:api_car.data[0].year,
                drive:api_car.data[0].drive,
                transmission:api_car.data[0].transmission,
                cylinders:api_car.data[0].cylinders,
            });

            let display={
                message:"Added model to your lineup",
                model:api_car.data[0].model,
                fuel_type:api_car.data[0].fuel_type,
                year:api_car.data[0].year,
                drive:api_car.data[0].drive,
                transmission:api_car.data[0].transmission,
                cylinders:api_car.data[0].cylinders,
            }
            return res.status(201).send(display);
        }

    }else{
        return res.status(400).send("please fill a paramater (model/manufacturer/fuel_type/drive/cylinders/transmission/year)");
    }

});


// add car from model 
router.post("/manufacturer/add",async(req,res)=>{
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
    let manufacturer_data=await Manufacturer.findByPk(id_manufacturer);
    if (manufacturer_data.authorized==0) {
        return res.status(403).send("Cannot post request,this user needs admin's approval.");
    }

    const schema=Joi.object({
        car_model:Joi.string().required(),
        vehicle_code:Joi.string().required().min(5).max(5),
        security_check_digit:Joi.string().required(),
        quantity:Joi.number().required(),
    });
    try {
        await schema.validateAsync(req.body)
    } catch (error) {
        return res.status(400).send(error.message);
    }
    let car_data=await Car_manufacturer.findOne({where:{
        model:inputs.car_model
    }});
    if (!car_data) {
        return res.status(404).send("car model not found");
    }
    let check_car_model=await Car_manufacturer.findOne({
        where:{
            model:inputs.car_model,
            idx_manufacturer:id_manufacturer
        }
    });
    if (!check_car_model) {
        return res.status(403).send({"message":"cannot add car from different manufacturer"})
    }
    let cars=[];
    for (let i = 0; i < inputs.quantity; i++) {
        let num=1;
        let vin_number_front=manufacturer_data.region_id+(manufacturer_data.name.substring(0,2)).toUpperCase()+inputs.vehicle_code+inputs.security_check_digit+getYearCode(car_data.year)+manufacturer_data.plant_code
        let get_existing_cars=await Car.findAll({where:{
            idx_car_manufacturer:car_data.idx
        }})
        num=num+get_existing_cars.length;
        let vin_number=vin_number_front+num.toString().padStart(5,'0')
        let insert=await Car.create({
            vin:vin_number,
            idx_car_manufacturer:car_data.idx
        }) 
        let ins={
            vin:vin_number
        }
        cars.push(ins);
    }
    let display={
        message:"insert car/cars successful",
        cars
    }
    return res.status(201).send(display);
});


//update
router.put("/plat_number/:vin",async(req,res)=>{
    let vin=req.params.vin;
    let plat_number=req.body.plat_number;
    let token = req.header('x-auth-token')
    if(!req.header('x-auth-token')){
        return res.status(403).send({"messsage":'Authentication Required'})
    }
    try {
        let userdata = jwt.verify(token, JWT_KEY)
        if (userdata.role==1||userdata.role==3) {
            return res.status(403).send({"messasge":"Unauthorized Access"});
        }
        if (userdata.authorized!=1) {
            return res.status(403).send("Cannot post request,this user needs admin's approval.");
        }
        id_manufacturer=userdata.idx;
    } catch (error) {
        return res.status(403).send({"message":'Invalid JWT Key'})
    }
    let find_car=await Car.findByPk(vin);
    if (!find_car) {
        return res.status(404).send({"message":"Car not found"})
    }else{
        let updated=await Car.update({
            plat_number:plat_number
        },{
            where:{
                vin:vin
            }
        })
        return res.status(200).send({"message":`plat number successfully changed to ${plat_number}`});
    }
})



module.exports = router



function getYearCode(year) {
    var table = {
        '1980': 'A', '1981': 'B', '1982': 'C', '1983': 'D', '1984': 'E', '1985': 'F', '1986': 'G', '1987': 'H', '1988': 'J', '1989': 'K',
    '1990': 'L', '1991': 'M', '1992': 'N', '1993': 'P', '1994': 'R', '1995': 'S', '1996': 'T', '1997': 'V', '1998': 'W', '1999': 'X',
    '2000': 'Y', '2001': '1', '2002': '2', '2003': '3', '2004': '4', '2005': '5', '2006': '6', '2007': '7', '2008': '8', '2009': '9',
    '2010': 'A', '2011': 'B', '2012': 'C', '2013': 'D', '2014': 'E', '2015': 'F', '2016': 'G', '2017': 'H', '2018': 'J', '2019': 'K',
    '2020': 'L', '2021': 'M', '2022': 'N', '2023': 'P', '2024': 'R', '2025': 'S', '2026': 'T', '2027': 'V', '2028': 'W', '2029': 'X',
    '2030': 'Y', '2031': '1', '2032': '2', '2033': '3', '2034': '4', '2035': '5', '2036': '6', '2037': '7', '2038': '8', '2039': '9'
    };
    return table[year] || 'Invalid year';
}
