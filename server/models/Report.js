const { getDB } = require("../config/sequelize");
const sequelize = getDB();
const { Model, DataTypes } = require("sequelize");
const Car = require("../models/Car");

class Report extends Model{
    static associate(models){
        this.belongsTo(Car,{foreignKey:'vin'});
        this.belongsTo(models.ReportType,{foreignKey:'idx'});
        this.hasOne(models.Damage, {
            foreignKey: "vin",
            sourceKey: "vin",
            as: "damage", 
        });
    }
}

Report.init(
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
        type:{
            type: DataTypes.STRING,
            allowNull:false,
        },
        title:{
            type: DataTypes.STRING,
            allowNull:false,
        },
        location:{
            type: DataTypes.STRING,
            allowNull:false,
        },
        reporter_id:{
            type: DataTypes.INTEGER,
            allowNull:false,
        },
        reporter_name:{
            type: DataTypes.STRING,
            allowNull:false,
        },
        description:{
            type: DataTypes.STRING,
            allowNull:false,
        },
    },
    {
        sequelize,
        timestamps: true,
        modelName: "Report",
        tableName: "reports",
        paranoid:true,
    }
);

module.exports = Report;
