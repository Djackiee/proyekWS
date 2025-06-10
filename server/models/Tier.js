const { getDB } = require("../config/sequelize");
const sequelize = getDB();
const { Model, DataTypes } = require("sequelize");

class Tier extends Model{
    static associate(models){
        this.hasMany(models.Subscription,{foreignKey:'tier'});
    }
}

Tier.init(
    {
        idx:{
            type:DataTypes.INTEGER,
            allowNull:false,
            primaryKey:true,
            autoIncrement:true
        },
        tier_name:{
            type: DataTypes.STRING,
            allowNull:false,
        },
        price:{
            type: DataTypes.INTEGER,
            allowNull:false,
        },
        content_access:{
            type: DataTypes.INTEGER,
            allowNull:false,
        },
    },
    {
        sequelize,
        timestamps: false,
        modelName: "Tier",
        tableName: "tiers",
    }
);

module.exports = Tier;
