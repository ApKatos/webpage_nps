import { Patient, Model, Metadata } from "./Model";
import { java, JavaObject, long, int, S, double, JavaNumber } from "jree";
import * as path from "path";

// var test={
// export function
function getRes(jsonInput: Object) {
        // BASE_URL = "localhost:8080";
        // headers = "Content-Type: aplication/json";
        // async getData(params: object) {
        //     const api = "/getData"
        //     const res = await fetch(this.BASE_URL+api, params)
        //     return await res.json()

        // Necessary to pass absolute path, with relative path can be problem caused by the relativity of path when called from different path
        let metadata: java.nio.file.Path = java.nio.file.Path.of(
            new java.lang.String(
            path.resolve(
                __dirname,
                "resources\\HCCDCP_25_HCC_2022_WITH_NPS_METADATA.txt"
            )
            )
        );
        let cycles: java.nio.file.Path = java.nio.file.Path.of(
            new java.lang.String(path.resolve(__dirname, "resources\\cycles"))
        );
        let weightMask: java.nio.file.Path = java.nio.file.Path.of(
            new java.lang.String(path.resolve(__dirname, "resources\\weight_matrices"))
        );
        let normsXY: java.nio.file.Path = java.nio.file.Path.of(
            new java.lang.String(
            path.resolve(__dirname, "resources\\NormsXY_NPS_Level_II.csv")
            )
        );
        let cbThreshold: java.nio.file.Path = java.nio.file.Path.of(
            new java.lang.String(
            path.resolve(__dirname, "resources\\cb2_thresholds.txt")
            )
        );
        let patients: java.nio.file.Path = java.nio.file.Path.of(
            new java.lang.String(
            path.resolve(
                __dirname,
                "resources\\HCC_2022_WITH_NPS_RawDataExport_ExportID2.csv"
            )
            )
        );
        let model: Model = new Model(
            metadata,
            cycles,
            weightMask,
            normsXY,
            cbThreshold,
            patients
        );

        // Reading variables from model. I have order in which I am going to pass values
        let varNames = model.getVariableNames();
        let varNamesJS = []
        for (let item in varNames) {
            varNamesJS.push(varNames[item].toString().valueOf());
        }
        console.log(varNamesJS);

        // Read JSON from user
        let varValInput = JSON.parse(jsonInput.toString());

        // Save values into format the model accepts
        // "1,2,3"
        let valuesInOrder = []
        valuesInOrder.push("999999")    // Non-informative value - serves as PatID
        for (let variable in varNamesJS){
            console.log(varNamesJS[variable])
            let value = varValInput[varNamesJS[variable]];
            valuesInOrder.push(value);
        }
        let valuesAsString = valuesInOrder.join(',');
        console.log(valuesAsString)

        let metadataClass: Metadata = new Metadata(metadata);
        let pat=new Patient(metadataClass,new java.lang.String(valuesAsString), false)
        model.evalPat(pat)
        console.log(pat.getAlive())


        // Create output JSON
        let outputData: { [key: string]: any } = {};
        outputData["alive"]=pat.getAlive();
        outputData["timeEncPhenotype"]=pat.getTimeCodedPhenotype();
        let phenotype=pat.getPhenotypeGroup();
        outputData["probOfDeath"]=Math.round(pat.getProbOfDeath()*100)/100;

        let clinBurden: { [key: string]: any }={}
        clinBurden["phenotypeThrs"]=model.getCbTHRs(phenotype)
        clinBurden["patientValue"]=Math.round(pat.getClinicalBurden2()*1000)/1000;
        outputData["clinicalBurden"]=JSON.stringify(clinBurden);

        // Convert dict to JSON
        let outputJSON=JSON.stringify(outputData);
        console.log(outputJSON)

        // return JSON with results
        return outputJSON;
    }   
// }
export default getRes
console.log("hallo from client.ts");
