const express = require('express');
const router = express.Router();

const { getDB } = require("../config/sequelize");
const sequelize = getDB();
const {QueryTypes} = require('sequelize');
const Reporter = require('../models/Reporter');
const Joi = require('joi').extend(require('@joi/date'));
const JWT_KEY = 'SOAcars';
const jwt = require("jsonwebtoken");


const checkUniqueUSERNAME = async (username) => {
    try {
      const [results, metadata] = await sequelize.query(`SELECT COUNT(*) as count FROM reporter WHERE username = '${username}'`);
      if (results[0].count > 0) {
        throw new Error("Username harus unik!");
      }
      return username;
    } catch (err) {
      throw new Error(err.message);
    }
  };

router.post("/register",async(req,res)=>{
    let {name,username,password,company} = req.body
    const schema = Joi.object({
        name: Joi.string().required(),
        username: Joi.string().required().external(checkUniqueUSERNAME),
        password: Joi.string().required(),
        company: Joi.string().required(),
    })
    try {
        await schema.validateAsync(req.body)
    } catch (error) {
        return res.status(403).send(error.toString())
    }
    let insReporter = await Reporter.create({
        name:name,
        username:username,
        password:password,
        company:company,
        authorized:0,
    });
    return res.status(201).send({
        message:"Reporter Registered Successfully",
        username:username,
        name:name,
        company:company,
    })
})
router.post("/login",async(req,res)=>{
    let {username, password} = req.body
    let sel = await sequelize.query(
        `select * from reporter where username=? AND password=?`,
        {
            replacements:[
                username, password
            ],
            type: QueryTypes.SELECT 
        }
    )
    if (sel.length == 0)
        return res.status(400).send({
            message: 'Login Gagal!'
        })
    let message = `Reporter ${username} berhasil login`;
    let token = jwt.sign({
        idx: sel[0].idx,
        username:username,
        role: 2, // reporter role
        authorized: sel[0].authorized
    }, JWT_KEY, {expiresIn: '3600s'})
    return res.status(200).send({
        Message: message,
        Token:token,
    })
})
module.exports = router