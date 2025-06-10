const express = require('express');
const Reporter = require('../models/Reporter');
const Manufacturer = require('../models/Manufacturer');
const router = express.Router()

//authorize reporter
router.put("/reporter/:id",async(req,res)=>{
    let {id} = req.params;
    let reporter = await Reporter.findOne({
        where:{
            idx:id
        }
    });

    if(reporter){
        if(!reporter.authorized){
            let updateReporter= await Reporter.update({
                authorized:1
            },{
                where:{
                    idx:id
                }
            });

            return res.status(200).send({
                reporter:reporter.name,
                message:"Given Authorization"
            });
        }
        return res.status(200).send({
            reporter:reporter.name,
            message:"Already have Authorization"
        });
    }
    else{
        return res.status(404).send({
            message:"Not Found"
        })
    }


});

//authorize manufacter
router.put("/manufacturer/:id",async(req,res)=>{
    let {id} = req.params;
    let manufacter = await Manufacturer.findOne({
        where:{
            idx:id
        }
    });

    if(manufacter){
        if(!manufacter.authorized){
            let updateManufacturer= await Manufacturer.update({
                authorized:1
            },{
                where:{
                    idx:id
                }
            });

            return res.status(200).send({
                manufacter:manufacter.name,
                message:"Given Authorization"
            });
        }
        return res.status(200).send({
            manufacter:manufacter.name,
            message:"Already have Authorization"
        });
    }
    else{
        return res.status(404).send({
            message:"Not Found"
        })
    }
});

module.exports = router;