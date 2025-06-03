const { getDB } = require("../config/sequelize");
const sequelize = getDB();
const { Model, DataTypes } = require("sequelize");

class User extends Model{
    static associate(models){
        this.hasOne(models.Subscription,{foreignKey:'idx'});
    }
};

User.init(
    {
        idx:{
            type:DataTypes.INTEGER,
            allowNull:false,
            primaryKey:true,
            autoIncrement:true
        },
        email:{
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
        name:{
            type: DataTypes.STRING,
            allowNull:false,
        },
        account_type:{
            type: DataTypes.STRING,
            allowNull:false,
        },
        API_KEY:{
            type: DataTypes.STRING,
            allowNull:false,
        },
    },
    {
        sequelize,
        timestamps: true,
        modelName: "User",
        tableName: "users",
    }
);

module.exports = User;
