const express = require('express')
const router = express.Router()
const Report=require('../models/Report');
const Damage=require('../models/Damage');
const User=require('../models/User');

const Subscription=require('../models/Subscription');
const multer = require("multer");
const fs = require("fs");
const { log } = require('console');
const JWT_KEY = 'SOAcars';
const jwt = require("jsonwebtoken");
const Joi = require('joi').extend(require('@joi/date'));
const { getDB } = require("../config/sequelize");
const sequelize = getDB();
const {QueryTypes} = require('sequelize');

router.use(express.json()) 
router.use(express.urlencoded({ extended: true }));

const upload = multer({
    dest: "./server/uploads",
    limits: { fileSize: 10000000 },
    fileFilter: function (req, file, cb) {
      if (file.mimetype != "image/png" && file.mimetype !== "image/jpeg" && file.mimetype !== "image/jpg") {
        return cb(new Error("Wrong file type"), null);
      }
      cb(null, true);
    },
  });

// post damage+picture
router.post("/damage",async(req,res)=>{
  let token = req.header('x-auth-token')
  if(!req.header('x-auth-token')){
      return res.status(400).send('Authentication token is missing')
  }
  try{
    let reporterdata = jwt.verify(token, JWT_KEY);
    if(reporterdata.role == 2 && reporterdata.authorized == 1){
      const uploadFunc = upload.single("image");
uploadFunc(req, res, async function(err){
    if(err){
      return res.status(400).send({...err, msg:"wrong filetype"});
    }
    let {vin, description, estimated} = req.body
    const schema = Joi.object({
      vin: Joi.string().required(),
      description: Joi.string().required(),
      estimated:Joi.number().min(1).required(),
  })
  try {
      await schema.validateAsync(req.body)
  } catch (error) {
      return res.status(403).send(error.toString())
  }
    // const files = fs.readdirSync("./uploads");
    // const index = files.length + 1;
    const filename = `${vin}_${req.file.originalname}`;
    fs.renameSync(`./server/uploads/${req.file.filename}`, `./server/uploads/${filename}`);


    let insDamage=await Damage.create({
      vin:vin,
      description:description,
      estimated:estimated,
      picture:filename,
  });

    return res.status(200).send({
      Message: "Suceess Insert Damage",
      vin:vin,
      description:description,
      image:req.file.originalname,
    });
  });
    }
    else{
      return res.status(400).send({
        message: 'Unauthorized'
    })
  }
  }catch(err){
      console.log(err);
      return res.status(400).send('Invalid JWT Key!')
  }
});

//post report registration
// taxi, theft, activity, km, usage
router.post("/",async(req,res)=>{
    let {vin,type,title,location,description} = req.body
    let token = req.header('x-auth-token')
    if(!req.header('x-auth-token')){
        return res.status(400).send('Authentication token is missing')
    }
    try{
      let reporterdata = jwt.verify(token, JWT_KEY);
        if(reporterdata.role == 2 && reporterdata.authorized == 1){
              const schema = Joi.object({
              vin: Joi.string().required(),
              type: Joi.string().valid("taxi", "theft", "activity", "km", "usage").insensitive().required(), 
              title: Joi.string().required(),
              location: Joi.string().required(),
              description: Joi.string().required(),
          })
          try {
              await schema.validateAsync(req.body)
          } catch (error) {
              return res.status(403).send(error.toString())
          }
          let insReport=await Report.create({
            vin:vin,
            type:type,
            title:title,
            location:location,
            reporter_id:reporterdata.idx,
            reporter_name:reporterdata.username,
            description:description,
        });
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().split('T')[0];
        return res.status(200).send({
          Message: 'Success Insert Report',
          vin:vin,
          Type:type,
          Title:title,
          Location:location,
          Description:description,
          Reporter_Name:reporterdata.username,
          Created_At: formattedDate,
      })
        }
        else{
            return res.status(400).send({
              message: 'Unauthorized'
          })
        }
    }
    catch(err){
      console.log(err);
      return res.status(400).send('Invalid JWT Key!')
    }
});

//get all report details
router.get("/:id?",async(req,res)=>{
  let idxcar= req.query.vin
  let token = req.header('x-auth-token')
  if(!req.header('x-auth-token')){
      return res.status(400).send('Authentication token is missing')
  }
  try{
    let check = jwt.verify(token, JWT_KEY);
    if(check.role != 1){
      if (idxcar!=null) {
        let getreport = await Report.findAll({
          where: { vin: idxcar },
          attributes: ['vin', 'type','title','location' ,'reporter_name','description','createdAt']
        });

          if (getreport.length==0) {
              return res.status(404).send("Report not found")
          }
          return res.status(200).send(getreport);
      }else{
          return res.status(200).send(await Report.findAll({
            attributes: ['vin', 'type','title','location' ,'reporter_name','description','createdAt']
          }));
        } 
    }
    else{
      //user
     let id = check.idx;
      let getHit = await Subscription.findOne({
        where:{
            id_user:check.idx
        }
    });
    if(!getHit){
      return res.status(200).send("User Belum berlangganan!");
    }
      let api_hit = getHit.content_access;
      if(api_hit==0){
        return res.status(200).send("Tidak bisa mendapatkan report karena sudah mencapai batas!");
      }
      else{
        if (idxcar != null) {
          let getreport = await Report.findAll({
            where: { vin: idxcar },
            attributes: ['vin', 'type','title','location' ,'reporter_name','description','createdAt']
          });
            if (getreport.length==0) {
                return res.status(404).send("Report not found")
            }
            let updateHit = await sequelize.query(
              `UPDATE subscriptions SET content_access = content_access - 1 WHERE id_user = ?;
              `,
              {
                  replacements:[
                      id
                  ],
                  type: QueryTypes.UPDATE 
              }
            )
            return res.status(200).send(getreport);
        }
        else{
          console.log("masuk");
          let updateHit = await sequelize.query(
            `UPDATE subscriptions SET content_access = content_access - 1 WHERE id_user = ?;
            `,
            {
                replacements:[
                    id
                ],
                type: QueryTypes.UPDATE 
            }
          )
            return res.status(200).send(await Report.findAll({
            attributes: ['vin', 'type','title','location' ,'reporter_name','description','createdAt']
            }));
        }
      }
    }
  }catch(err){
    console.log(err);
    return res.status(400).send('Invalid JWT Key!')
  }
});


//get all damage 
router.get("/damage/detail/:vin?",async(req,res)=>{
  let idxcar= req.query.vin
  let token = req.header('x-auth-token')
  if(!req.header('x-auth-token')){
      return res.status(400).send('Authentication token is missing')
  }
  try{
    let check = jwt.verify(token, JWT_KEY);
    if(check.role != 1){
      console.log("bukan user");
      if (idxcar!=null) {
        let getDamage = await Damage.findAll({
          where: { vin: idxcar },
          attributes: ['vin', 'description','estimated']
        });

          if (getDamage.length==0) {
              return res.status(404).send("Damage not found")
          }
          return res.status(200).send(getDamage);
      }else{
          return res.status(200).send(await Damage.findAll({
            attributes: ['vin', 'description','estimated']
          }));
        } 
    }
    else{
      //user 
     let id = check.idx;
      let getHit = await Subscription.findOne({
        where:{
            id_user:check.idx
        }
    });
    if(!getHit){
      return res.status(200).send("User Belum berlangganan!");
    }
      let api_hit = getHit.content_access;
      if(api_hit==0){
        return res.status(200).send("Tidak bisa mendapatkan detail damage karena sudah mencapai batas!");
      }
      else{
        if (idxcar != null) {
          let getDamage = await Damage.findAll({
            where: { vin: idxcar },
            attributes: ['vin', 'description','estimated']
          });
            if (getDamage.length==0) {
                return res.status(404).send("Damage not found")
            }
            let updateHit = await sequelize.query(
              `UPDATE subscriptions SET content_access = content_access - 1 WHERE id_user = ?;
              `,
              {
                  replacements:[
                      id
                  ],
                  type: QueryTypes.UPDATE 
              }
            )
            return res.status(200).send(getDamage);
        }
        else{
          console.log("masuk");
          let updateHit = await sequelize.query(
            `UPDATE subscriptions SET content_access = content_access - 1 WHERE id_user = ?;
            `,
            {
                replacements:[
                    id
                ],
                type: QueryTypes.UPDATE 
            }
          )
            return res.status(200).send(await Damage.findAll({
              attributes: ['vin', 'description','estimated']
            }));
        }
      }
    }
  }catch(err){
    console.log(err);
    return res.status(400).send('Invalid JWT Key!')
  }

});

module.exports = router