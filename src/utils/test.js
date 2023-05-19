console.log("hallo from test.ts")
const myMod = require("./client.mts/index.js")
console.log("../resources/cb2_thresholds.txt")

let jsonData={}

jsonData["PLATELETS"] = 70000;
jsonData["HBV"]=0
jsonData["TUMOR_NODULES"]=3
jsonData["GENDER"]=1
jsonData["PVT"]=1
jsonData["BILI"]=2.5
jsonData["ALT"]=0
jsonData["GGT"]=1
jsonData["AFP"]=1
jsonData["HCV"]=5.2
jsonData["AGE"]=58
jsonData["TUMOR_DIAM"]=5.9
jsonData["ALB"]=0
jsonData["INR"]=2
jsonData["AST"]=2
jsonData["ALKP"]=1.5
jsonData["HEMOGLOBIN"]=152

let jsonString=JSON.stringify(jsonData);
let a =myMod.getRes(jsonString)
console.log(a)
