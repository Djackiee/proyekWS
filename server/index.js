const express = require("express")
const app = express()
app.set("port", 3000)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const car=require("./routes/car")
const recall=require("./routes/recall")
const report=require("./routes/report")
const manufacturer=require("./routes/manufacturer")
const user=require("./routes/user")
const authorization=require("./routes/authorization")
const reporter=require("./routes/reporter")


app.use("/car",car);
app.use("/recall",recall);
app.use("/report",report);
app.use("/user",user);
app.use("/authorization",authorization);
app.use("/manufacturer",manufacturer);
app.use("/reporter",reporter);


app.listen(app.get("port"), () => {
    console.log(`Server started at http://localhost:${app.get("port")}`)
})

module.exports = app