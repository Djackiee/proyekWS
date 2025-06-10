const { getDB } = require("../config/sequelize");
const sequelize = getDB();
const { Model, DataTypes } = require("sequelize");

class Reporter extends Model{
   
}

Reporter.init(
    {
        idx:{
            type:DataTypes.INTEGER,
            allowNull:false,
            primaryKey:true,
            autoIncrement:true
        },
        name:{
            type: DataTypes.STRING,
            allowNull:false,
        },
        username:{
            type: DataTypes.STRING,
            allowNull:false,
        },
        password:{
            type: DataTypes.STRING,
            allowNull:false,
        },
        company:{
            type: DataTypes.STRING,
            allowNull:false,
        },
        authorized:{
            type: DataTypes.INTEGER,
            allowNull:false,
        },
    },
    {
        sequelize,
        timestamps: true,
        paranoid: true, 
        modelName: "Reporter",
        tableName: "reporter",
    }
);

module.exports = Reporter;
