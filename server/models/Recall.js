const { getDB } = require("../config/sequelize");
const sequelize = getDB();
const { Model, DataTypes } = require("sequelize");
// const Report = require("../models/Report"); 

class Recall extends Model{
    static associate(models){
        // this.hasMany(Report,{foreignKey:'car_idx'});
    }
}

Recall.init(
    {
        idx:{
            type:DataTypes.INTEGER,
            allowNull:false,
            primaryKey:true,
            autoIncrement:true
        },
        idx_car_manufacturer:{
            type: DataTypes.BIGINT,
            allowNull:false,
        },
        cause:{
            type: DataTypes.STRING,
            allowNull:false,
        },
    },
    {
        sequelize,
        timestamps: false,
        modelName: "Recall",
        tableName: "recalls",
    }
);

module.exports = Recall;
