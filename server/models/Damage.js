const { getDB } = require("../config/sequelize");
const sequelize = getDB();
const { Model, DataTypes } = require("sequelize");
// const Report = require("../models/Report"); 

class Damage extends Model{
    static associate(models){
        // this.hasMany(Report,{foreignKey:'car_idx'});
        this.belongsTo(models.Report, {
        foreignKey: "vin",
        targetKey: "vin",
        as: "report", 
        });
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
            allowNull:true,
        },
        description:{
            type: DataTypes.STRING,
            allowNull:true,
        },
        estimated:{
            type: DataTypes.INTEGER,
            allowNull:true,
        },
        picture:{
            type: DataTypes.STRING,
            allowNull:true,
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
