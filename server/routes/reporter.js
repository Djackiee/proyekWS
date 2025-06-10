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
    const existingReporter = await Reporter.findOne({
      where: { username },
    });

    if (existingReporter) {
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
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const reporter = await Reporter.findOne({
      where: {
        username,
        password
      }
    });

    if (!reporter) {
      return res.status(400).send({
        message: "Login Gagal!"
      });
    }

    const token = jwt.sign({
      idx: reporter.idx,
      username: reporter.username,
      role: 2,
      authorized: reporter.authorized
    }, JWT_KEY, { expiresIn: '3600s' });

    return res.status(200).send({
      Message: `Reporter ${reporter.username} berhasil login`,
      Token: token
    });

  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Terjadi kesalahan di server." });
  }
});
module.exports = router