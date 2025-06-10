const { getDB } = require("../config/sequelize");
const sequelize = getDB();
const { Model, DataTypes } = require("sequelize");

class Subscription extends Model{
    static associate(models){
        this.belongsTo(models.User,{foreignKey:'idx'});
    }
};


Subscription.init(
    {
        idx:{
            type:DataTypes.INTEGER,
            allowNull:false,
            primaryKey:true,
            autoIncrement:true
        },
        id_user:{
            type: DataTypes.INTEGER,
            allowNull:false,
        },
        tier:{
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
        timestamps: true,
        modelName: "Subscription",
        tableName: "subscriptions",
    }
);

module.exports = Subscription;
