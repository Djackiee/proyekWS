const express = require('express')
const router = express.Router()
const Report=require('../models/Report');
const Damage=require('../models/Damage');
const User=require('../models/User');
const ReportType=require('../models/ReportType');
const Car=require('../models/Car');
const Car_manufacturer=require('../models/Car_manufacturer')

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
const path = require('path');

router.use(express.json()) 
router.use(express.urlencoded({ extended: true }));

Report.associate({ Damage, Car, ReportType });
Damage.associate({ Report });
Car.associate({ Car_manufacturer, Report }); // <-- add this
Car_manufacturer.associate({ Car });   



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./server/uploads");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, basename + "-" + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.mimetype)) {
      return cb(new Error("Wrong file type"), false);
    }
    cb(null, true);
  }
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
          attributes: ['vin', 'type','title','location' ,'reporter_name','description','createdAt'],
            include: [
            {
                model: Damage,
                as: "damage", 
                attributes: ['description', 'estimated', 'picture']
            },
             {
              model: Car,
              attributes: ['vin', 'plat_number'],
              include: [
            {
              model: Car_manufacturer,
              attributes: ['model', 'fuel_type', 'year', 'drive', 'transmission', 'cylinders']
                }
              ]
            }
          ]
        });

          if (getreport.length==0) {
              return res.status(404).send("Report not found")
          }
          return res.status(200).send(getreport);
      }else{
          return res.status(200).send(await Report.findAll({
            attributes: ['vin', 'type','title','location' ,'reporter_name','description','createdAt'],
              include: [
            {
                model: Damage,
                as: "damage", 
                attributes: ['description', 'estimated', 'picture']
            },
            {
              model: Car,
              attributes: ['vin', 'plat_number'], 
              include: [
            {
              model: Car_manufacturer,
              attributes: ['model', 'fuel_type', 'year', 'drive', 'transmission', 'cylinders']
                }
              ]
            }
          ]
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
            attributes: ['vin', 'type','title','location' ,'reporter_name','description','createdAt'],
              include: [
            {
                model: Damage,
                as: "damage", 
                attributes: ['description', 'estimated', 'picture']
            },
            {
              model: Car,
              attributes: ['vin', 'plat_number'], 
              include: [
            {
              model: Car_manufacturer,
              attributes: ['model', 'fuel_type', 'year', 'drive', 'transmission', 'cylinders']
                }
              ]
            }
          ]
          });
            if (getreport.length==0) {
                return res.status(404).send("Report not found")
            }
            await Subscription.update(
              {
                content_access: sequelize.literal('content_access - 1')
              },
              {
                where: { id_user: id }
              }
            );
            return res.status(200).send(getreport);
        }
        else{
            await Subscription.update(
              {
                content_access: sequelize.literal('content_access - 1')
              },
              {
                where: { id_user: id }
              }
            );
            return res.status(200).send(await Report.findAll({
            attributes: ['vin', 'type','title','location' ,'reporter_name','description','createdAt'],
              include: [
            {
                model: Damage,
                as: "damage", 
                attributes: ['description', 'estimated', 'picture']
            },
            {
              model: Car,
              attributes: ['vin', 'plat_number'],
              include: [
            {
              model: Car_manufacturer,
              attributes: ['model', 'fuel_type', 'year', 'drive', 'transmission', 'cylinders']
                }
              ]
            }
          ]
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
              await Subscription.update(
                {
                  content_access: sequelize.literal('content_access - 1')
                },
                {
                  where: { id_user: id }
                }
              );
            return res.status(200).send(getDamage);
        }
        else{
          console.log("masuk");
          await Subscription.update(
            {
              content_access: sequelize.literal('content_access - 1')
            },
            {
              where: { id_user: id }
            }
          );
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

router.delete('/:id?', async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await Report.destroy({
            where: { idx: id }
        });

        if (deleted === 0) {
            return res.status(404).json({ message: "Report not found" });
        }

        return res.status(200).json({ message: "Report deleted!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
});



router.post("/", upload.any(), async (req, res) => {
  const { vin, type, title, location, description } = req.body;
  const token = req.header("x-auth-token");

  if (!token) return res.status(400).send("Authentication token is missing");

  try {
    const reporterdata = jwt.verify(token, JWT_KEY);
    if (reporterdata.role !== 2 || reporterdata.authorized !== 1) {
      return res.status(403).send({ message: "Unauthorized" });
    }

    let damageDescription = "";
    let damageEstimated = "";
    let damagePicture = null;

    const damages = req.body.damages;

    if (damages) {
      damageDescription = damages.description;
      damageEstimated = damages.estimated;
    }


    const file = req.files.find((f) => f.fieldname === "damages[picture]");
    if (file) {
      const filename = `${vin}_${file.originalname}`;
      fs.renameSync(file.path, `./server/uploads/${filename}`);
      damagePicture = filename;
    }

    const damageSchema = Joi.object({
      description: Joi.string().required(),
      estimated: Joi.number().min(1).required(),
      picture: Joi.string().optional().allow(null, ""),
    });

    const reportSchema = Joi.object({
      vin: Joi.string().required(),
      type: Joi.string()
        .valid("taxi", "theft", "activity", "km", "usage","damage")
        .insensitive()
        .required(),
      title: Joi.string().required(),
      location: Joi.string().required(),
      description: Joi.string().required(),
      damages: damageSchema.optional(),
    });

    // Validate the full report object with or without damages
    await reportSchema.validateAsync({
      vin,
      type,
      title,
      location,
      description,
      damages: damages
        ? {
            description: damageDescription,
            estimated: damageEstimated,
            picture: damagePicture,
          }
        : undefined, // if no damages, don't pass damages object
    });

    const t = await sequelize.transaction();

    try {
      // Insert report (required)
      const newReport = await Report.create(
        {
          vin,
          type,
          title,
          location,
          description,
          reporter_id: reporterdata.idx,
          reporter_name: reporterdata.username,
        },
        { transaction: t }
      );

      if (damageDescription && damageEstimated) {
        await Damage.create(
          {
            vin,
            description: damageDescription,
            estimated: damageEstimated,
            picture: damagePicture || "",
          },
          { transaction: t }
        );
      }

      await t.commit();

      return res.status(201).json({
        message: "Report and damage successfully saved",
        report: newReport,
        damage: damages
          ? {
              description: damageDescription,
              estimated: damageEstimated,
              picture: damagePicture,
            }
          : null,
      });
    } catch (error) {
      await t.rollback();
      console.error("this error",error);
      return res.status(500).send("Transaction failed");
    }
  } catch (err) {
    console.error(err);
    return res.status(401).send({ error: err.message });
  }
});





module.exports = router