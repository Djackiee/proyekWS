const { getDB } = require("../config/sequelize");
const sequelize = getDB();
const { Model, DataTypes } = require("sequelize");
// const Report = require("../models/Report"); 

class Car extends Model{
    static associate(models){
        // this.hasMany(Report,{foreignKey:'car_idx'});
        this.belongsTo(models.Car_manufacturer, { foreignKey: 'idx_car_manufacturer' });
        this.hasMany(models.Report, { foreignKey: 'vin' });
    }
}

Car.init(
    {
        vin:{
            type:DataTypes.STRING,
            allowNull:false,
            primaryKey:true,
            autoIncrement:true
        },
        idx_car_manufacturer:{
            type: DataTypes.INTEGER,
            allowNull:false,
        },
        plat_number:{
            type: DataTypes.STRING,
            allowNull:true,
        },

    },
    {
        sequelize,
        timestamps: false,
        modelName: "Car",
        tableName: "cars",
    }
);

module.exports = Car;
