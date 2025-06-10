const { getDB } = require("../config/sequelize");
const sequelize = getDB();
const { Model, DataTypes } = require("sequelize");
// const Report = require("../models/Report"); 

class Car_manufacturer extends Model{
    static associate(models){
        // this.hasMany(Report,{foreignKey:'car_idx'});
         this.hasMany(models.Car, { foreignKey: 'idx_car_manufacturer' });
    }
}

Car_manufacturer.init(
    {
        idx:{
            type:DataTypes.INTEGER,
            allowNull:false,
            primaryKey:true,
            autoIncrement:true
        },
        model:{
            type: DataTypes.STRING,
            allowNull:false,
        },
        idx_manufacturer:{
            type: DataTypes.INTEGER,
            allowNull:false,
        },
        fuel_type:{
            type: DataTypes.STRING,
            allowNull:false,
        },
        year:{
            type: DataTypes.INTEGER,
            allowNull:false,
        },
        drive:{
            type: DataTypes.STRING,
            allowNull:false,
        },
        fuel_type:{
            type: DataTypes.STRING,
            allowNull:false,
        },
        transmission:{
            type: DataTypes.STRING,
            allowNull:false,
        },
        cylinders:{
            type: DataTypes.INTEGER,
            allowNull:false,
        },
    },
    {
        sequelize,
        timestamps: false,
        modelName: "Car_manufacturer",
        tableName: "car_manufacturer",
    }
);

module.exports = Car_manufacturer;
