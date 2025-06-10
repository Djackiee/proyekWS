const { getDB } = require("../config/sequelize");
const sequelize = getDB();
const { Model, DataTypes } = require("sequelize");

class ReportType extends Model{
    static associate(models){
        this.hasMany(models.Report,{foreignKey:'idx'});
    }
   
}

ReportType.init(
    {
        idx:{
            type:DataTypes.INTEGER,
            allowNull:false,
            primaryKey:true,
            autoIncrement:true
        },
        report_type:{
            type: DataTypes.STRING,
            allowNull:false,
        },
        
    },
    {
        sequelize,
        timestamps: false,
        modelName: "ReportType",
        tableName: "report_type",
    }
);

module.exports = ReportType;
