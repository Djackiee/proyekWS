const { getDB } = require("../config/sequelize");
const sequelize = getDB();
const { Model, DataTypes } = require("sequelize");
// const Report = require("../models/Report"); 

class Damage extends Model{
    static associate(models){
        // this.hasMany(Report,{foreignKey:'car_idx'});
    }
}

Damage.init(
    {
        idx:{
            type:DataTypes.INTEGER,
            allowNull:false,
            primaryKey:true,
            autoIncrement:true
        },
        vin:{
            type: DataTypes.STRING,
            allowNull:false,
        },
        description:{
            type: DataTypes.STRING,
            allowNull:false,
        },
        estimated:{
            type: DataTypes.INTEGER,
            allowNull:false,
        },
        picture:{
            type: DataTypes.STRING,
            allowNull:false,
        },

    },
    {
        sequelize,
        timestamps: false,
        modelName: "Damage",
        tableName: "damages",
    }
);

module.exports = Damage;
