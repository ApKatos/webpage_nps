import { java, JavaObject, long, int, S, double, JavaNumber } from "jree";
import { CharSequence } from "jree/lib/java/lang/CharSequence.js";
import * as fs from "fs";
import * as path from "path";
import { argv, exit } from "process";
import { error } from "console";
import { Exception } from "jree/lib/java/lang";
// import { stringify } from "querystring";

/**
 * Controller class part of the model-view-controller dessign pattern. Used to connect Model and View and start server
 * for exgange of data between Model - server - user.
 */
export class Controller extends JavaObject {
    protected model: Model;

    /**
     * Creating instance of controller
     * @param model supplying logic and main computation based on user's input
     */
    public constructor(model: Model) {
        super();
        this.model = model;
    }

    /**
     * Main method to read config.json file and initialise all components necessary. Calls method that starts server.
     * @param args input arguments from console
     * @throws IOException
     */
    public static main(): void {
        // Careful how you pass the address to the files. If called from different directory the relative path is from there
        let metadata: java.nio.file.Path = java.nio.file.Path.of(new java.lang.String( path.resolve(__dirname, "resources\\HCCDCP_25_HCC_2022_WITH_NPS_METADATA.txt")));
        let cycles: java.nio.file.Path = java.nio.file.Path.of(new java.lang.String(path.resolve(__dirname, "resources\\cycles")));
        let weightMask: java.nio.file.Path = java.nio.file.Path.of(new java.lang.String(path.resolve(__dirname, "resources\\weight_matrices")));
        let normsXY: java.nio.file.Path = java.nio.file.Path.of(new java.lang.String(path.resolve(__dirname, "resources\\NormsXY_NPS_Level_II.csv")));
        let cbThreshold: java.nio.file.Path = java.nio.file.Path.of(new java.lang.String(path.resolve(__dirname, "resources\\cb2_thresholds.txt")));
        let patients: java.nio.file.Path = java.nio.file.Path.of(new java.lang.String(path.resolve(__dirname, "resources\\HCC_2022_WITH_NPS_RawDataExport_ExportID2.csv")));
        let model: Model = new Model(metadata, cycles, weightMask, normsXY, cbThreshold, patients);

        let controller: Controller = new Controller(model);

        // Evaluate one patient - 17 + 1 variables (ID)
        //        Patient p = new Patient(model.metadata,"000001737,0,73,1,0,1,8,0,3.5,1,1,.5,.5,7,1.4,16.2,14.5,144", false);
        //        controller.model.evalPat(p);
        // run all patients from file in config

        // let s = new java.lang.String("000000105,0,54,0,0,1,4,0,3.7,.29,1,.6,.5,1.2,.9,1.8,14.5,317,0,1029,34,0,6790,.230048368,.658185865,9,-.428137498,32.31772932")
        // let s2 = new java.lang.String("000000106,0,77,0,1,1,1.7,0,3.5,.6,1.18,.26,.7,1.11,.65,1101,11.4,317,1,761,25,1,8660,.676871126,.369854417,19,.307016709,78.04776302")
        
        // let p = new Patient(new Metadata(metadata),s2,false)
        // controller.model.evalPat(p)

        controller.model.processAllPatients();
        console.log("all pats evaluated")
    }
}


/**
 * Model class part of the model-view-controller dessign pattern. Used to run computation on input data from user.
 */
export class Model extends JavaObject {
  protected metadata: Metadata;
  protected cycles: Cycles;
  protected weightMatrices: WeightMatrices;
  protected normsXY: NormsXY;
  protected cbThr: CBthr;
  protected patients: java.nio.file.Path; // training dataset

  public constructor(
    metadata: java.nio.file.Path,
    cycles: java.nio.file.Path,
    weightMatrices: java.nio.file.Path,
    normXY: java.nio.file.Path,
    cbThr: java.nio.file.Path,
    patients: java.nio.file.Path
  ) {
    super();
    this.metadata = new Metadata(metadata);
    this.cycles = new Cycles(cycles);
    this.weightMatrices = new WeightMatrices(weightMatrices);
    this.normsXY = new NormsXY(normXY);
    this.cbThr = new CBthr(cbThr);
    this.patients = patients;
  }

  public getVariableNames(): Array<java.lang.String> {
    return this.metadata
      .getVarNamesInput()
      .toArray(
        new Array<java.lang.String>(this.metadata.getVarNamesInput().size())
      );
    // return this.metadata.getVarNamesInput();
  }

  public getCbTHRs(type: java.lang.Integer): string {
    return this.cbThr.getThrsForPhenotype(type);
  }
  /**
   * Method that runs NPS evaluation on all patients from train dataset. Lasts 30 seconds.
   */
  public processAllPatients(): void {
    let pats: java.lang.String[] = this.readPatients();
    let counter = 0;
    for (let patientofpats of pats) {
      counter += 1;
      console.log(counter);
      let p: Patient = new Patient(this.metadata, patientofpats, true);
      console.log("Patient ID: " + p.getId());
      this.evalPat(p);
    }
  }

  /**
   * Method reads file that contains rows of patients and saves them in a String array of String representations of
   * patients (further to be individually passed into constructor of Patient)
   * @return String array of patients, where each item in the array is line of their input values for variables
   */
  private readPatients(): java.lang.String[] {
    let patients: java.util.ArrayList<java.lang.String> =
      new java.util.ArrayList();
    let bf: java.io.BufferedReader;

    let fr = new java.io.FileReader(this.patients.toFile());
    bf = new java.io.BufferedReader(fr, require("buffer").constants.MAX_LENGTH);

    let line: java.lang.String | null;

    while (true) {
      if ((line = bf.readLine()) == null) break;
      if (line.split(",")[0].equals(new java.lang.String("PAT_ID"))) continue;
      patients.add(line);
    }
    fr.close();
    return patients.toArray(new Array<java.lang.String>(patients.size()));
  }

  /**
   * Method that takes instance of Patient and computes NPS1 and NPS2. NPS2 is directly dependent on the result of NPS1,
   * because all masks, cycles and constants for NPS2 are chosen based on the phenotype group the patient was assigned
   * to in NPS1. Patients that were classified into phenotype "10" will all survive and for them NPS2 is not evaluated.
   * All necessary outcomes are saved into patient's internal variables
   * @param patient whose results for the NPS model will be calculated
   */
  public evalPat(patient: Patient): void {
    let clinicalBurden2: double = 0.0;

    let distances: double[] = Cycles.editDistance(
      this.cycles.getCycles(this.cycles, new java.lang.String("A")),
      patient
    ); //return ED between cycles and patient's graph
    let pomPosNeg: Coords = WeightMatrices.evaluateEdges(
      this.weightMatrices.getWeightMask(new java.lang.String("A")),
      patient
    ); //comapring patients's graph and weighted mask
    let normsXYPair: Coords = this.normsXY.getNorms(new java.lang.String("G0")); //read norms for NPS1

    let nps1: Coords = this.calculateNPS(
      distances,
      pomPosNeg.getX(),
      pomPosNeg.getY(),
      normsXYPair
    ); // NPS1

    patient.setNPS1(nps1);

    let classPhenotype: int = this.deepClinicalPhenotype(patient.getNPS1()); //classification into phenotype

    patient.setPhenotypeGroup(classPhenotype);

    let clinicalBurden: double = this.clinicalBurden(patient.getNPS1()); //computation of clinical burden

    let pPat: double = this.probOfDeath(patient, clinicalBurden); // relative probability of death (among all other patients in the same phenotype)

    if (classPhenotype == 10) {
      // Skip NPS2 computation for patients whose phenotype equals 10 - because all of them survive
      patient.setAlive(true);
      patient.setClinicalBurden2(0.0);
      patient.setProbOfDeath(0.0);
    } else {
      // prepare masks, cycles and constants for NPS2

      distances = Cycles.editDistance(
        this.cycles.getCycles(
          this.cycles,
          new java.lang.String("G" + patient.getPhenotypeGroup()?.valueOf())
        ),
        patient
      );

      pomPosNeg = WeightMatrices.evaluateEdges(
        this.weightMatrices.getWeightMask(
          new java.lang.String("G" + patient.getPhenotypeGroup()?.valueOf())
        ),
        patient
      );

      normsXYPair = this.normsXY.getNorms(
        new java.lang.String("G" + patient.getPhenotypeGroup()?.valueOf())
      );

      // NPS2
      let nps2: Coords = this.calculateNPS(
        distances,
        pomPosNeg.getX(),
        pomPosNeg.getY(),
        normsXYPair
      );

      patient.setNPS2(nps2);
      clinicalBurden2 = this.clinicalBurden(patient.getNPS2());
      if (
        clinicalBurden2 < this.cbThr.getMainThr(patient.getPhenotypeGroup())
      ) {
        patient.setClinicalBurden2(clinicalBurden2);
        patient.setAlive(true);
      } else {
        patient.setClinicalBurden2(clinicalBurden2);
        patient.setAlive(false);
      }
    }
  }

  /**
   * Method for mathematical evaluation of patient's specific values
   * @param distances array if size 4 resulting from comparing 4 cycles and adjacency matrix
   * @param pomP sum of positively weighted patient's edges that matched with edges in weight mask
   * @param pomN sum of negatively weighted patient's edges that matched with edges in weight mask
   * @param norm signifies 2 values that are specific for the NPS1 or NPS2
   * @returns coordinates x and y
   */
  public calculateNPS(
    distances: double[],
    pomP: double,
    pomN: double,
    norm: Coords
  ): Coords {
    let coordFactorX: double = 25.0;
    let coordFactorY: double = -25.0;

    let x: double =
      coordFactorX * pomP +
      1 * ((this.metadata.getInputVarNum() + distances[0] + 1) / 2) +
      1 * ((this.metadata.getInputVarNum() + distances[1] + 1) / 2);
    let y: double =
      coordFactorY * pomN +
      1 * ((this.metadata.getInputVarNum() + distances[2] + 1) / 2) +
      1 * ((this.metadata.getInputVarNum() + distances[3] + 1) / 2);

    x = Math.log10(x) / norm.getX();
    y = Math.log10(y) / norm.getY();

    return new Coords(x, y);
  }

  /**
   * Method to take resulting coordinates from NPS1 and evaluate the 2 dimensional interval where the patient belong.
   * This decides what phenotype will the patient beling to.
   * @param coord result of NPS1
   * @return number in range 1-25
   */
  public deepClinicalPhenotype(coord: Coords): int {
    let coords: double[] = [coord.getX(), coord.getY()];
    let phenotype: int;
    if (coords[0] > 0.7 && coords[1] <= 0.295) {
      phenotype = 1;
    } else if (coords[0] <= 0.7 && coords[0] > 0.58 && coords[1] <= 0.295) {
      phenotype = 2;
    } else if (coords[0] <= 0.58 && coords[0] > 0.41 && coords[1] <= 0.295) {
      phenotype = 3;
    } else if (coords[0] <= 0.41 && coords[0] > 0.3 && coords[1] <= 0.295) {
      phenotype = 4;
    } else if (coords[0] <= 0.3 && coords[1] <= 0.295) {
      phenotype = 5;
    } else if (coords[0] <= 0.3 && coords[1] > 0.295 && coords[1] <= 0.369) {
      phenotype = 6;
    } else if (coords[0] <= 0.3 && coords[1] > 0.369 && coords[1] <= 0.457) {
      phenotype = 7;
    } else if (coords[0] <= 0.3 && coords[1] > 0.457 && coords[1] <= 0.588) {
      phenotype = 8;
    } else if (coords[0] <= 0.3 && coords[1] > 0.588 && coords[1] <= 0.79) {
      phenotype = 9;
    } else if (coords[0] <= 0.3 && coords[1] > 0.79) {
      phenotype = 10;
    } else if (coords[0] > 0.7 && coords[1] > 0.295 && coords[1] <= 0.369) {
      phenotype = 11;
    } else if (
      coords[0] <= 0.7 &&
      coords[0] > 0.58 &&
      coords[1] > 0.295 &&
      coords[1] <= 0.369
    ) {
      phenotype = 12;
    } else if (
      coords[0] <= 0.58 &&
      coords[0] > 0.41 &&
      coords[1] > 0.295 &&
      coords[1] <= 0.369
    ) {
      phenotype = 13;
    } else if (
      coords[0] <= 0.41 &&
      coords[0] > 0.3 &&
      coords[1] > 0.295 &&
      coords[1] <= 0.369
    ) {
      phenotype = 14;
    } else if (coords[0] > 0.7 && coords[1] > 0.369 && coords[1] <= 0.457) {
      phenotype = 18;
    } else if (
      coords[0] <= 0.7 &&
      coords[0] > 0.58 &&
      coords[1] > 0.369 &&
      coords[1] <= 0.457
    ) {
      phenotype = 19;
    } else if (
      coords[0] <= 0.58 &&
      coords[0] > 0.41 &&
      coords[1] > 0.369 &&
      coords[1] <= 0.457
    ) {
      phenotype = 20;
    } else if (
      coords[0] <= 0.41 &&
      coords[0] > 0.3 &&
      coords[1] > 0.369 &&
      coords[1] <= 0.457
    )
      phenotype = 15;
    else if (coords[0] > 0.7 && coords[1] > 0.457 && coords[1] <= 0.588)
      phenotype = 23;
    else if (
      coords[0] <= 0.7 &&
      coords[0] > 0.58 &&
      coords[1] > 0.457 &&
      coords[1] <= 0.588
    )
      phenotype = 24;
    else if (
      coords[0] <= 0.58 &&
      coords[0] > 0.41 &&
      coords[1] > 0.457 &&
      coords[1] <= 0.588
    )
      phenotype = 21;
    else if (
      coords[0] <= 0.41 &&
      coords[0] > 0.3 &&
      coords[1] > 0.457 &&
      coords[1] <= 0.588
    )
      phenotype = 16;
    else if (coords[0] <= 0.41 && coords[0] > 0.3 && coords[1] > 0.588)
      phenotype = 17;
    else if (coords[0] <= 0.58 && coords[0] > 0.41 && coords[1] > 0.588)
      phenotype = 22;
    else if (coords[0] > 0.58 && coords[1] > 0.588) phenotype = 25;
    else {
      java.lang.System.out.println(
        "ERROR WITH ASSIGNING PHENOTYPE " + coords[0] + ":" + coords[1]
      );
      throw new java.lang.RuntimeException(
        "Patient's coordinates resulting from NPS1 process are outside of allowed range"
      );
    }
    return phenotype;
  }

  /**
   * Computation of clinical burden. 2-dimensional vector reduced to 1 dimension.
   * @param coorC result from NPS
   * @return the difference between x and y component of NPS coordinates
   */
  public clinicalBurden(coorC: Coords): double {
    return coorC.getX() - coorC.getY();
  }

  /**
   * Method to evaluate relative probability of death for given patient as poly-regression function. Out of all
   * patients in the same group, this number of patients died.
   * @param patient instance of patient for whom results are computed
   * @param patientCB clinical burden from NPS1 of patient
   * @return Double value of relative probability
   */
  public probOfDeath(patient: Patient, patientCB: double): double {
    let prob: double =
      204.587794714775 /
        (1 +
          java.lang.Math.exp(
            -1.5305944626126 * (patientCB + 1) + 0.484983496496863
          )) -
      89.689507380257;
    if (prob < 0.0) prob = 0.0;
    else if (prob > 100.0) prob = 100.0;
    patient.setProbOfDeath(prob);
    return prob;
  }
}

/**
 * Class PretrainedData serves as tag for classes that are dependant on data that were previously trained for proper
 * function and meaning of program. Pretrained data are accessible through the file name and therefore this class offers
 * method that checks the valid name for type of wanted data.
 */
export abstract class PretrainedData extends JavaObject {
    // All data were prepared with software that indexes from 1
    /** Variable to store path of file location. */
    protected filesLocation: java.nio.file.Path | null = null;  // TODO pridala som alebo null a rovna sa null

    /**
     * Method to check correctness of requested type. Correct type looks like letter(G) + number(1-25) or letter(A),
     * e.g. "A","G1","G25", ...
     * wrong example: "A0", "B2", "G0" , ..
     *
     * @param type - string value to be checked if it contains correct format
     * @return string value that is safe to call to select pretrained data files
     */
    protected checkType(type: java.lang.String): java.lang.String {
        let part1: java.lang.String = new java.lang.String(String.fromCharCode(type.charAt(0)))
        if (type.valueOf().length == 1) {
            // with length 1 only letter A is allowed
            if (part1.equals(new java.lang.String("A"))) return type; 
            else throw new java.lang.IllegalArgumentException("One lettered identification " +
                "of cycle is only A, given " + type.toString());
        } else {
            if (part1.equals(new java.lang.String("G"))) {
                // letter G and number
                let part2: int = 0;
                part2 = java.lang.Integer.parseInt(type.substring(1));
                if (part2 < 0 || part2 > 25)
                    throw new java.lang.IllegalArgumentException("Cycle identification number (+" + part2 + ") is outside allowed range 1-25");


                var str1 = new java.lang.String(part1);
                var str2 = new java.lang.String(java.lang.Integer.toString(part2))
                // type = part1 + java.lang.Integer.toString(part2);
                type = new java.lang.String([str1, str2].join(""));    // TODO pozri ci taka konverzia moze fungovat
                return type;
                
            } else
                throw new java.lang.IllegalArgumentException("Unknown identification of cycle. Only A and G_ cycles recognised." +
                    " Called " + part1);
        }
    }

}



/**
 * Class WeightMatrices is inheriting from PretrainedData and contains files that are used during NPS1 and NPS2. Also
 * offers method to evaluate edges between patient's full graph and loaded weight mask
 */
export class WeightMatrices extends PretrainedData {

    /**
     * Instance of this class carries the location of all weight matrices needed for evaluation of NPS1 and NPS2.
     * Weight matrix is represented as dictionary of dictionaries of neighboring vertices with given weight. Weight mask
     * contains weighed edges between partitions.
     * All numbers representing vertices are indexed from 0 (not 1 as all others pretrained data).
     * @param filesLocation path of directory where all mask files are located
     */
    public constructor(filesLocation: java.nio.file.Path) {
        super();
        // if (java.nio.file.Files.isDirectory(filesLocation))
        this.filesLocation = filesLocation;
        // else
        //     throw new java.lang.InstantiationError("Given Path not directory");
    }

    /**
     * This method is used to get weight mask for particular type (either for NPS1 or NPS2 by phenotype group of patient)
     * @param type of weigh mask needed for NPS1 or NPS2
     * @return dictionary of dictionaries where vertices representing weighted edges are stored
     */
    public getWeightMask(type: java.lang.String): Map<double, Map<double, double>> {
        type = super.checkType(type);
        return this.readWeightMask(this.filesForType(type));
    }

    /**
     * Creating dictionary of dictionaries from given path where the file is stored.
     * @param path of file to be read
     * @return dictionary of dictionaries with information about weighted edges
     */
    private readWeightMask(path: java.nio.file.Path): Map<double, Map<double, double>> {
        let weightMask: Map<double, Map<double, double>> = new Map();
        let bf: java.io.BufferedReader;
        let fl: java.io.FileReader;
        // let fsfile = fs.open(path.toString().valueOf())
        fl = new java.io.FileReader(path.toFile())
        bf = new java.io.BufferedReader(fl,24000*1024);
        let line: java.lang.String | null;
        while (true) {
            try {
                if ((line = bf.readLine()) == null) break;
            } catch (e) {
                
                if (e instanceof java.io.IOException) {
                    throw new java.lang.RuntimeException(e);
                } else {
                    throw e;
                }
            }
            // line = line.replaceAll("[\\(\\)|]", " ").trim();
            line = line.replace('('.charCodeAt(0), "".charCodeAt(0)).trim();
            line = line.replace(')'.charCodeAt(0), "".charCodeAt(0)).trim();
            line = line.replace('|'.charCodeAt(0), " ".charCodeAt(0)).trim();

            let items: java.lang.String[]
            if (line == null){
                break
            } else{
                items = line.split(" ");
                
            }

            let ii: double = parseFloat(((items[0]?.valueOf()).trim()));
            ii++;   // adjusting the number of vertex to be indexed from 1
            let jj: double = parseFloat((items[1]?.valueOf()).trim());
            jj++;   // adjusting the number of vertex to be indexed from 1
            // try {

            // if dictionary already has been initialised with the vertex number
            let subDict: Map<double, double> | undefined  = weightMask.get(ii);
            // ak este nebol subdict initialised s vertex number
            if (subDict == undefined){
                let subDict2: Map<double, double> = new Map();  // vytvorim subdict
                subDict2.set(jj,parseFloat((items[2]?.valueOf()).trim()));
                weightMask.set(ii, subDict2);   // a subdict vlozim do hlavneho dictu
            } else{
                subDict.set(jj, parseFloat((items[2]?.valueOf()).trim()));
            }

            // } catch (npe) {
            //     if (npe instanceof java.lang.NullPointerException) {
            //         // create subdict for new vertex number
            //         let subDict2: java.util.Dictionary<java.lang.Double, java.lang.Double> = new java.util.Hashtable();
            //         subDict2.put(jj, java.lang.Double.parseDouble(items[2].trim()));
            //         weightMask.put(ii, subDict2);
            //     } else {
            //         throw npe;
            //     }
            // }
        }
        fl.close()
        return weightMask;
    }

    /**
     * Get path for given type of weight matrix (given by NPS1 or NPS2 and phenotype group) by iterating
     * over all files in given directory and looking for the one that contains @type in first part of file name
     * @param type
     * @return
     */
    private filesForType(type: java.lang.String): java.nio.file.Path {
        let files = fs.readdirSync(this.filesLocation?.toString().valueOf() as string);
        
        for (let file of files) {
            // if (java.nio.file.Files.isRegularFile(file)) {
            if (fs.lstatSync(this.filesLocation + "/" +file).isFile()) {
                let fType: string = file.split("_")[0];
                if (fType.toUpperCase() == (type.valueOf())) {
                    return java.nio.file.Path.of(new java.lang.String(this.filesLocation + "/" +file));
                }
            }
        }
        throw new java.lang.RuntimeException();
    }

    /**
     * Static method that evaluates edges that are present in patient's graph and weight matrix for particular NPS type.
     * Positive and negative weights are summed up separately and returned.
     * @param weightMask weight mask to use in evaluation
     * @param patient instance where full graph of compressed adjacency matrix can be called
     * @return Coords type variable which contains summed values for positive and negative edges
     */
    public static evaluateEdges(weightMask: Map<double, Map<double, double>>, patient: Patient): Coords {
        let pos: double = 0.0;
        let neg: double = 0.0;
        for (let row of patient.getFullGraph()) {
            let edgeWeight: double | undefined;
            // patient's vertices
            let ver1: double = row[0];
            let ver2: double = row[1];
            // try {

                // fetch the edge value for the 2 patient's vertices
            let nd: Map<double, double> | undefined = weightMask.get(ver1);
            if (nd == undefined){
                weightMask.set(ver1, new Map<double,double>)
            } else {
                edgeWeight = nd.get(ver2);
                if (edgeWeight == undefined){
                    edgeWeight = 0.0;
                }
            }

            // } catch (npe) {
            //     if (npe instanceof java.lang.NullPointerException) {
            //         // assign edge value zero if it is not in the weight mask
            //         edgeWeight = 0.0;
            //     } else {
            //         throw npe;
            //     }
            // }
            if (edgeWeight == undefined) edgeWeight = 0.0;   //if the sub-dictionary does not contain second vertex from patient
            if (edgeWeight < 0) neg += edgeWeight; else pos += edgeWeight;
        }
        return new Coords(pos, neg);
    }
}





/**
 * Patient class inherits from PretrainedData. Represents patients from input data. Stores results from NPS computations.
 */
export class Patient extends PretrainedData {
    private static readonly tg: Int32Array = new Int32Array([0, 25, 23, 20, 16, 11, 8, 6, 4, 2, 1, 24, 21, 17, 13, 9, 7, 3, 22, 18, 14, 10, 5, 19, 15, 12]); //array listing order of phenotype groups
    /** List of all instantiated patients from training dataset */
    public static patients: java.util.ArrayList<Patient> = new java.util.ArrayList();
    private id: int = 0; // patients id
    // TODO pridala som |'null = null pozri ci to nerobi problemy A TIEZ som pridala = 0
    // TODO inicializacia arrayu je [] ??? pozri outputvars
    private clinicalBurden2: double = 0.0;
    private phenotypeGroup: int = 0; // assigned phenotype group
    private timeCodedPhenotype: int = 0; // ordered (by time) phenotype group
    private probOfDeath: double = 0.0; // relative probability of patient dying in comparision with all other patient in the same @phenotypeGroup
    private alive: boolean = true; //if he is going to belong to patients who die or live
    private numPartitions: int;  // number of input variables to fill in
    private cAdjMat: double[][]; // patient's compressed adjacency matrix
    private NPS1: Coords = new Coords(0.0, 0.0); //coords for NPS1
    private NPS2: Coords = new Coords(0.0, 0.0); //coords for NPS2
    protected outputVars: double[];  // output variables that only patients from train dataset have - not used anywhere
    protected model: Metadata; // model the patient belongs to (only Evaluation of Total Hepatocellular Cancer Lifespan)

    /**
     * Instance of this class represents patient and his results after NPS1 and NPS2
     * @param model representing metadata instance, what variables are in model and how the input will be interpreted
     * @param patientInput string representation of patient's input variables
     * @param train boolean if patient belongs to training set
     */
    public constructor(model: Metadata, patientInput: java.lang.String, train: boolean) {
        super();
        this.model = model;
        this.numPartitions = model.getInputVarNum();
        this.outputVars = new Array<double>(model.getOutputVarNum());
        this.cAdjMat = []   
        // TODO - pozri ci for cyklus robi to iste co by spravilo toto - new Array<double>(this.numPartitions)[];
        for (let index = 0; index < this.numPartitions; index++) {
            this.cAdjMat[index]=[];
        }
        this.cAdjMat = this.createMatrix(patientInput);

    }
    /**
     * Getter for the unordered phenotype group patient belongs to
     * @return phenotype group of patient
     */
    public getPhenotypeGroup(): java.lang.Integer {
        return new java.lang.Integer(this.phenotypeGroup);
    }

    /**
     * Setter for phenotype group that also assigns phenotype ordered by time
     * @param group phenotype the patient belongs to
     */
    public setPhenotypeGroup(group: int): void {
        for (let i: int = 1; i < Patient.tg.length; i++) {
            if (Patient.tg[i] == group)
                this.timeCodedPhenotype = i; // set time encoded phenotype group that represents linear order of disease developing
        }
        this.phenotypeGroup = group;
    }

    /**
     * Getter of time ordered phenotype. Informs about the severity of disease. Values are between 1-25. The closer to
     * 25 the more severe stage of disease. The closer to 1 the less dangerous stage of disease.
     * @return phenotype ordered by time
     */
    public getTimeCodedPhenotype(): int {
        return this.timeCodedPhenotype;
    }

    /** Getter for NPS1 coordinates */
    public getNPS1(): Coords {
        return this.NPS1;
    }
    /** Getter for NPS2 coordinates */
    public getNPS2(): Coords {
        return this.NPS2;
    }
    /** Setter of NPS1 coordinates from array */
    // public setNPS1(arr: double[]): void;
    /** Setter of NPS1 coordinates from Coords class */
    public setNPS1(coords: Coords): void{
        this.NPS1 = coords;
    }
    // public setNPS1(...args: unknown[]): void {
    //     switch (args.length) {
    //         case 1: {
    //             const [arr] = args as [double[]];
    //             this.NPS1 = new Coords(arr[0], arr[1]);
    //             break;
    //         }
    //         case 1: {
    //             const [coords] = args as [Coords];
    //             this.NPS1 = coords;
    //             break;
    //         }
    //         default: {
    //             throw new java.lang.IllegalArgumentException(S`Invalid number of arguments`);
    //         }
    //     }
    // }

    /** Setter of NPS2 coordinates from Coords class */
    public setNPS2(coords: Coords): void {
        this.NPS2 = coords;
    }
    /** Getter for patients id */
    public getId(): int {
        return this.id;
    }

    /**
     * Get value of output variable.
     * Only usable for patients from train set.
     * @param varName variable name
     * @return value of the variable name
     */
    public getOutputVar(varName: java.lang.String): double{
        let index: int = -1;
        let varNames: java.lang.String[] = this.model.getVarNamesOutput().toArray(new Array<java.lang.String>(0));
        for (let i: int = 0; i < varNames.length; i++)
            if ((varName?.valueOf()).toUpperCase().trim() == (varNames[i]?.valueOf())) index = i;
        return this.outputVars[index];
    }
    /** Getter of patient's compressed adjacency matrix. Contains only edges between outer partitions. Is cyclic. */
    public getcAdjMat(): double[][] {
        return this.cAdjMat;
    }

    /**
     * Method creates fully connected graph out of compressed adjacency matrix by connecting each vertex with every other vertex.
     * @return full graph
     */
    public getFullGraph(): double[][] {
        // There are no loop edges
        let fullGraph: double[][] = []; // TODO pozri ci toto instanciuje ako ma
        // new Array<double>((this.numPartitions * (this.numPartitions - 1)) / 2)[];
        let i: int = 0;
        for (let j: int = 0; j < this.cAdjMat.length; j++) {
            fullGraph[i]=[]
            for (let jj: int = j; jj < this.cAdjMat.length - 1; jj++) {
                let v1: double = this.cAdjMat[j][0];
                let v2: double = this.cAdjMat[jj][1];
                fullGraph[i++] = [v1, v2, 1.0];
            }
        }
        return fullGraph;
    }

    /**
     * Method creates cyclic graph from input data for patient. Searches for vertex number in a metadata instance
     * based on input value for given variable. Then those vertexes are connected with outer cycle, where the cycle
     * is represented by partitions (variables).
     * @param input string representation separated by commas of patients input data
     * @return cyclic graph of patients vertices for all partitions
     */
    public createMatrix(input: java.lang.String): double[][] {
        let res: double[][] = [] 
        // new Array<double>(this.numPartitions)[];

        let lineToSplit: java.lang.String = input
        lineToSplit = input.replace(','.charCodeAt(0) ,' '.charCodeAt(0))

        const parts: string[] = lineToSplit.valueOf().split(/\s+/);
        let values: java.lang.String[] = []
        for (let index = 0; index < parts.length; index++) {
            values[index] = new java.lang.String(parts[index]);
        }
        // let values: java.lang.String[] = input.split("\\s*[,]{1}\\s*");
        
        if (values.length < this.model.getInputVarNum()){
            throw new java.lang.IllegalArgumentException();
        }else if (values.length <= this.model.getOutputVarNum() + this.model.getInputVarNum() + 1) // +1 because patient's ID also counts
            values = java.util.Arrays.copyOf(values, this.model.getInputVarNum() + this.model.getOutputVarNum() + 1);

        this.id = java.lang.Integer.parseInt(values[0]);   //patient id


        // these variables used at the end to close the cyclic graph
        let vertNoFirst: int = this.model.getNoVertex(this.model.getVarNames().get(0), values[1]); //.get(0) because varNames do not include patID
        // values[1] because patID is at index 0;
        let vertNoLast: int = 0;

        // indexing from zero -> due to listing of variable names where I do not have patID as the first variable
        let i: int = 0;

        // assign vertex number to all variables based on input values
        for (; i < this.numPartitions - 1; i++) {
            let varName1: java.lang.String = this.model.getVarNames().get(i);
            let varName2: java.lang.String = this.model.getVarNames().get(i + 1);

            let vertNo1: int = this.model.getNoVertex(varName1, values[i + 1]);  //index shifted by 1 because patient's id is at index 0
            let vertNo2: int = this.model.getNoVertex(varName2, values[i + 2]); // +2 because it is next value from the previous one
            vertNoLast = vertNo2;

            // creating edge for numbered vertices from input values
            let edge: double[] = [vertNo1, vertNo2, 1.0];
            res[i] = edge;
        }

        // additional edge that closes the cyclic graph (cAdjMat) of patient
        let edge: double[] = [vertNoLast,vertNoFirst,1.0];
        res[i] = edge;

        // If input string is from train dataset, then save also output variable values (from values' subset (17:end))
        let iOutput: int = 0;
        while (++i < values.length - 1) {
            if (values[i + 1] == null)
                this.outputVars[iOutput++] = 0.0;
            else
                this.outputVars[iOutput++] = parseFloat(values[i + 1]?.valueOf());
        }
        return res;
    }

    /** Setter of alive parameter that is computed in NPS2*/
    public setAlive(alive: boolean): void {
        this.alive = alive;
    }
    /** Setter of relative probability of death among 100 patients with the same input parameter as the patient has */
    public setProbOfDeath(prob: double): void {
        this.probOfDeath = prob;
    }
    /** Getter of relative probability of death among 100 patients with the same input parameter as the patient has */
    public getProbOfDeath(): double {
        return this.probOfDeath;
    }
    /** Getter of the boolean information whether patient belongs to the group of survivors */
    public getAlive(): boolean {
        return this.alive;
    }
    public getClinicalBurden2(): double {
        return this.clinicalBurden2;
    }
    public setClinicalBurden2(clinicalBurden2: double): void {
        this.clinicalBurden2 = clinicalBurden2;
    }
}


/**
 * Class NormsXY is inheriting from class PretrainedData because contains normalised constants that are used during
 * evaluation of NPS1 and NPS2
 */
export class NormsXY extends PretrainedData {
    private normsXY: Map<java.lang.String, double[]>;

    /**
     * Class of this instance contains address to the location of normalised constants necessary for NPS1 and NPS2.
     * @param path to file with constants
     */
    public constructor(path: java.nio.file.Path) {
        super();
        // try {
        this.filesLocation = path;
        let fr: java.io.FileReader = new java.io.FileReader(path.toFile());
        let bf: java.io.BufferedReader = new java.io.BufferedReader(fr);
        this.normsXY = this.read(bf);
        fr.close()
        // } catch (e) {
        //     if (e instanceof java.lang.Exception) {
        //         java.lang.System.err.print(new java.lang.String("Error with reading norm values x,y input file"));
        //     } else {
        //         throw e;
        //     }
        // }
    }

    /**
     * Method to get neccesary constants for given NPS type
     * @param type of NPS for which constants are needed
     * @return pair of values of wanted type
     */
    public getNorms(type: java.lang.String): Coords {
        type = this.checkType(type);   
        const mapIter = this.normsXY.keys();
        
        while (true) {
            let a = mapIter.next()
            if (a.value == undefined){
                console.log("No such key in normxy as wanted "+type)
                return new Coords(0.0, 0.0);
                break;
            }else{
                if (type.equals(a.value)){
                    return new Coords(this.normsXY.get(a.value)!)
            }
        }

    }
    }
    /**
     * Method to read values from source file into local variable. File does not contain norms for NPS1, therefore are
     * being added under name "G0"
     * @param br of type BufferedReader (of file that contains the constants)
     * @return dictionary where keys are NPS types and values are double arrays of values to be returned for particular
     * NPS type
     * @throws IOException
     */
    private read(br: java.io.BufferedReader): Map<java.lang.String, double[]> {
        let readNorms: Map<java.lang.String, double[]> = new Map();


        let line: java.lang.String | null = br.readLine();
        while ((line = br.readLine()) !== null) {

            let values: java.lang.String[] = line.split(",");
            
            if (values.length == 1) {
                let vklad = values[0].trim();
                readNorms.set(vklad, [0.0, 0.0]);
            } else{
                let vklad = values[0].trim();
                readNorms.set(vklad, [parseFloat(values[1]!.valueOf()), parseFloat(values[2]!.valueOf())]);
            }
        }
        return readNorms;
    }
}


/**
 * Metadata class represents the construction of NPS model - the variables the model will be reading on input and their
 * categories, thresholds for each variable. Also creates graphical representation for each interval of variable on
 * the input. Stores information about variable names.
 */
export class Metadata extends JavaObject {
    private MAXVAL: int = 1000000;
    private inputVarNum: int = 0;  // TODO vpisala som tu vsade 0, zisti ci to neni problem
    private outputVarNum: int = 0;
    private thrSize: int = 0; // max number of thresholds for variable that was observed in metadata input file
    private varNames: java.util.ArrayList<java.lang.String> = new java.util.ArrayList<java.lang.String>();
    private varNamesInput: java.util.ArrayList<java.lang.String> = new java.util.ArrayList<java.lang.String>(); // variable names every patient will have in input (without Patient ID first)
    private varNamesOutput: java.util.ArrayList<java.lang.String> = new java.util.ArrayList<java.lang.String>(); // variable names that only train patients have
    private varThresholds: java.util.ArrayList<Float64Array> = new java.util.ArrayList();  // thresholds for every input variable
    private varType: java.util.ArrayList<java.lang.String> = new java.util.ArrayList();  // variable types

    private numPatients: int = 0;

    /**
     * Every instance of Metadata class has input variables that are all listed in metadata file. These variables
     * can be categorical or real - split into discrete intervals. Instance of this class required valid path to
     * the metadata file that will be the key framework for model.
     * Each variable has equal amounts of vertices representing its intervals. If there is not enough intervals or variable
     * is categorical then the unreachable intervals will still be numbered (but the number are unused).
     * Each such variable is referred to as partition.
     *
     * @param path of the metadata file for NPS model
     */
    public constructor(path: java.nio.file.Path ) {
        super();
        try{
            let fr: java.io.FileReader = new java.io.FileReader(path.toFile());
            console.log("here it wont get")
            let bf: java.io.BufferedReader = new java.io.BufferedReader(fr);
            this.read(bf);
            fr.close()
        }catch(e){
            console.log((e as Error).toString().valueOf());
        }
    }

    /**
     * Method that reads and parses metadata file. Each line representing input variable consists of variable name,
     * list of thresholds, variable type. The number of thresholds is observed and saved for each variable and then the
     * highest number of thresholds is used to make the number of variable thresholds uniform.
     *
     * @param metadata
     * @throws Exception
     */
    private read(metadata: java.io.BufferedReader): void {
        // let s: java.util.Scanner = new java.util.Scanner(metadata);
        let s = metadata
        let line: java.lang.String | null= s.readLine();

        while ("PAT_ID"!=(line?.valueOf())) {
            line = s.readLine();
        }
        while ((line = s.readLine()) !== null) {
            line = line.replace('['.charCodeAt(0)," ".charCodeAt(0));
            line = line.replace(']'.charCodeAt(0), " ".charCodeAt(0));
            line = line.replace(','.charCodeAt(0), " ".charCodeAt(0));

            const parts: string[] = line.valueOf().split(/\s+/);
            let lineSplit: java.lang.String[] = []
            for (let index = 0; index < parts.length; index++) {
                lineSplit[index] = new java.lang.String(parts[index]);
            }
            
            // end of metadata file
            if ("total" == (lineSplit[1]?.valueOf()).toLowerCase()) {
                this.numPatients = java.lang.Integer.parseInt(lineSplit[0]);
                break;
            }

            let varNam: java.lang.String = this.readVarname(lineSplit[0]);
            this.varNames.add(varNam); // add name of variable

            // checks if INPUT variable (and  not Output - those only have name and type in metadata file)
            if (lineSplit.length !== 2) {
                // add thresholds of variable
                let arrayItems: java.lang.String[] = [] ;
                for (let index = 1; index < lineSplit.length-1; index++) {
                    arrayItems[index-1] = lineSplit[index];
                }
                this.varThresholds.add(this.readThresholds(arrayItems));

                // choose bigger number: number of thr for actual variable or maxSize yet acquired
                this.thrSize = Math.max(this.varThresholds.get(this.varThresholds.size() - 1).length - 1, this.thrSize); // -1 because when creating arr of this length it is +1 bigger than wanted
            }

            // add type of variable
            let varTyp: java.lang.String = this.readType(lineSplit[lineSplit.length - 1]);
            if ("C" == (varTyp?.valueOf()) || "R" == (varTyp?.valueOf()))
                this.varNamesInput.add(varNam);
            else if ("O"  == (varTyp?.valueOf()))
                this.varNamesOutput.add(varNam);
            this.varType.add(varTyp);
        }
    
        this.thrSize += 1; // +1 because including classification into undefined state

        // Set all thr arrays to the same length and set last item on -1 (meaning of undefined state)

        for (let i: int = 0; i < this.varThresholds.size(); i++) {
            let arrThr: Float64Array = java.util.Arrays.copyOf(this.varThresholds.get(i), this.thrSize); //extend array with zeros and overwrite intervals
            this.varThresholds.set(i, arrThr);
            arrThr[this.thrSize - 1] = -1; // set last on -1 = undefined state of variable
        }
    }

    /** Getter for number of output variables */
    public getOutputVarNum(): int {
        return this.outputVarNum;
    }
    /** Getter for input variable names */
    public getVarNamesInput(): java.util.ArrayList<java.lang.String> {
        return this.varNamesInput;
    }  // without patID
    /** Getter for names of output variables */
    public getVarNamesOutput(): java.util.ArrayList<java.lang.String> {
        return this.varNamesOutput;
    }
    /** Getter for all varibles names */
    public getVarNames(): java.util.ArrayList<java.lang.String> {
        return this.varNames;
    }   // without patID
    /** Getter for number of input variables */
    public getInputVarNum(): int {
        return this.inputVarNum;
    }
    /** Getter for number of thresholds that each input variable has */
    public getThrSize(): int {
        return this.thrSize; // number of thresholds each variable has assigned
    }

    /**
     * Used to clear the variable name from gaps and unify into upper letters
     * @param s string representation of variable name
     * @return checked string of variable name
     */
    private readVarname(s: java.lang.String): java.lang.String {
        return new java.lang.String(((s?.valueOf()).trim().toUpperCase()));
    }

    /**
     * Method parses array of thresholds (either categorical or real) and return array of intervals
     * @param s array representation of strings where numbers are and signify thresholds of variable
     * @return valid double array of variable thresholds
     */
    private readThresholds(s: java.lang.String[]): Float64Array {
        let res: Float64Array = new Float64Array(s.length + 2);

        // If variable categorical - has only 1 threshold (for 2 categories 0.5)
        if (s.length == 1) {
            res[0] = 0;
            res[1] = 1;
            return res;
        }

        // variable is real
        res[0] = -this.MAXVAL; // set lower bound of interval to -infinity
        for (let i: int = 1; i < s.length + 1; i++)   //s.length + 1 because started indexing from 1
            res[i] = parseFloat((s[i - 1]?.valueOf()).trim());

        res[res.length - 1] = this.MAXVAL;  // set upper bound of variable interval
        return res;
    }

    /**
     * Checks correct format of variable type. If invalid variable type throws error.
     * @param s contains variable type
     * @return checked variable type
     * @throws Exception if variable type is invalid
     */
    private readType(s: java.lang.String): java.lang.String {
        switch ((s.valueOf()).toUpperCase().trim()) {
            case "O":
                this.outputVarNum++;
                return new java.lang.String("O");
            case "C":
                this.inputVarNum++;
                return new java.lang.String("C");
            case "R":
                this.inputVarNum++;
                return new java.lang.String("R");
            default:
                throw new java.lang.Exception("Wrong input format. Don't know variable of type " + s);
        }
    }

    /**
     * Assigns vertex number to value in variable name. Each verted number to be returned has added 1 to it because
     * it is adjusted to being indexed from 1.
     *
     * @param vertName name of the variable
     * @param strValue value for the variable
     * @return id of vertex whose interval contains value
     */
    public getNoVertex(vertName: java.lang.String, strValue: java.lang.String): int {
        //        Print.message("The vertex name is: " + vertName + " and wanted value is "+strValue);
        let vertNo: int = -1;
        let value: double;

        let i: int = this.varNames.indexOf(vertName);  // if invalid name of variable
        if (i == -1) return i;

        value = parseFloat(strValue?.valueOf());  // TODO biig problem - na vynimkach zalezi 
        if (isNaN(value)){
            vertNo = i * this.thrSize + (this.thrSize - 1);      // the last item for undefined state
            return vertNo + 1;   // +1 because adjusting to indexing from 1
        } else if (value == -1 * 1.0) {
            throw new java.lang.NumberFormatException("Input value can not be equal to -1");
        }

        // If the vertName is categorical variable
        if ("C" == (this.varType.get(i)?.valueOf())) {
            if (value == 0.0) vertNo = i * this.thrSize;
            else if (value == 1.0) vertNo = i * this.thrSize + 1;
            else vertNo = (i + 1) * this.thrSize - 1;

            return vertNo + 1;    // +1 because adjusting to indexing from 1
        } else if ("R" == (this.varType.get(i)?.valueOf())) {
            // Find interval where the value falls
            // |1|3|5|7|9|
            // |2| | | | | <-- correct
            // | |2| | | | <-- incorrect
            for (let thr: int = 0; thr < this.thrSize - 1; thr++) {
                let v1: double = this.varThresholds.get(i)[thr];
                let v2: double = this.varThresholds.get(i)[thr + 1];
                if (value >= v1) {
                    // Falls between interval
                    if (value < v2) {
                        vertNo = i * this.thrSize + (thr);

                        //                        Print.message("Assigned value is "+ vertNo+1);
                        return vertNo + 1;    // +1 because adjusting to indexing from 1
                    }
                    // Case of thr where thr arraylist fully occupied, the next thr is for the undefined state
                    if (thr == this.thrSize - 2) {
                        vertNo = i * this.thrSize + thr;

                        //                        Print.message("Assigned value is "+ vertNo+1);
                        return vertNo + 1;    // +1 because adjusting to indexing from 1
                    }
                }
            }
        }
        return vertNo + 1;
    }

    /**
     * Get the name of variable and range it belongs to from vertex id
     * @param vertNo vertex id for which variable name and value range will be returned
     * @return string variable name and interval joined by gap
     */
    public getVertNameValue(vertNo: int): java.lang.String {
        vertNo -= 1;   // vertNo-1 because my representation is indexed from 0

        let name: java.lang.String;
        let value: java.lang.String;
        let i: int = vertNo / this.thrSize;
        let resid: int = vertNo % this.thrSize;
        name = this.varNames.get(i);
        if (resid == this.thrSize - 2 && (this.varThresholds.get(i)[resid] !== 0))
            value = new java.lang.String(this.toString(this.varThresholds.get(i)[resid]).valueOf() + "<");
        else if (resid == this.thrSize - 1) {
            value = new java.lang.String("NaN");
        } else if (this.varThresholds.get(i)[resid] == 0 && resid !== 0) {      // co ak thr values -10,-5,0,5,10...
            // radsej checkni ci aj value za touto je 0 (alebo pred)
            value = new java.lang.String("-");
        } else if (this.varThresholds.get(i)[resid + 1] == this.MAXVAL){
            value = new java.lang.String((this.toString(this.varThresholds.get(i)[resid]).valueOf() + "<"));
        } else if ("C" == (this.varType.get(i)?.valueOf())) {
            value = new java.lang.String(this.toString(this.varThresholds.get(i)[resid]));
        } else
            value = new java.lang.String(this.toString(this.varThresholds.get(i)[resid])?.valueOf() + "-" + this.toString(this.varThresholds.get(i)[resid + 1]).valueOf());
        //        return new String[]{name,value};
        return new java.lang.String((name?.valueOf() + "  " + value?.valueOf()));
    }

    /** Convert double value into printable string */
    private toString(v: double): java.lang.String {
        return (new java.lang.String(v.toString()));
    }

    /**
     * Method to list all variables that are categorical
     * @return ArrayList of categorical variable names
     */
    public getCategVarNames(): java.util.ArrayList<java.lang.String> | null {
        let output: java.util.ArrayList<java.lang.String> = new java.util.ArrayList();
        for (let i: int = 0; i < this.getVarNamesInput().size(); i++) {
            if ((this.varType.get(i)?.valueOf()).toUpperCase() == ("C")) {
                output.add(this.varNamesInput.get(i));
            }
        }
        return output;
    }

    /**
     * Getter for variable thresholds array
     * @return thresholds for each variable
     */
    public getVarThresholds(): java.util.ArrayList<Float64Array> {
        return this.varThresholds;
    }
}


/**
 * Cycles class inherits from PretrainedData. Serves for loading cycles data for NPS1 and NPS2. Supplies method for
 * comparing patients compressed cyclic adjacency matrix with cycles data from file.
 */
export class Cycles extends PretrainedData {
    protected filesNameForEachNPS: java.lang.String[][]; // file names, at index i, to be read for NPS1 or NPS2 with group i,


    /**
     * Instance of class that returns matrix-like data for computation of NPS1 or NPS2. Cycle files contain edges
     * between vertexes that are used to be compared with patient's cycle graph. For each NPS1/NPS2 4 cycle files
     * are read and compared.
     * Cycles are of two types. The labeling for the type of cycles depends on the first letter. Cycles at index 0 in
     * array @filesNameForEachNPS are for NPS1 and the file name starts with "A". Cycles at indexes 1-25 are for NPS2
     * and the file name starts with G and given number.
     *
     * @param filesLocation - location where all files that will be read are placed
     */
    public constructor(filesLocation: java.nio.file.Path) {
        super();
        // if (java.nio.file.Files.isDirectory(filesLocation)) {
        this.filesLocation = filesLocation;
        let filesNames: java.lang.String = new java.lang.String('\
        A_41_23_Cycles.net, A_44_24_Cycles.net, A_22_75_Cycles.net, A_59_12_Cycles.net#\
          G1_57_2_Cycles.net, G1_69_1_Cycles.net, G1_9_24_Cycles.net, G1_10_9_Cycles.net#\
            G2_0_22_Cycles.net, G2_1_24_Cycles.net, G2_21_2_Cycles.net, G2_27_2_Cycles.net#\
            G3_12_5_Cycles.net, G3_31_2_Cycles.net, G3_3_16_Cycles.net, G3_3_16_Cycles.net#\
            G4_2_7_Cycles.net, G4_16_2_Cycles.net, G4_11_3_Cycles.net, G4_21_1_Cycles.net#\
            G5_12_2_Cycles.net, G5_27_1_Cycles.net, G5_11_5_Cycles.net, G5_30_1_Cycles.net#\
            G6_9_6_Cycles.net, G6_25_2_Cycles.net, G6_12_5_Cycles.net, G6_36_1_Cycles.net#\
            G7_5_14_Cycles.net, G7_8_15_Cycles.net, G7_10_8_Cycles.net, G7_24_2_Cycles.net#\
            G8_11_11_Cycles.net, G8_18_8_Cycles.net, G8_0_29_Cycles.net, G8_10_15_Cycles.net#\
            G9_12_18_Cycles.net, G9_17_14_Cycles.net, G9_36_4_Cycles.net, G9_52_1_Cycles.net#\
            A_41_23_Cycles.net, A_44_24_Cycles.net, A_22_75_Cycles.net, A_59_12_Cycles.net#\
            G11_57_1_Cycles.net, G11_57_1_Cycles.net, G11_7_6_Cycles.net, G11_15_3_Cycles.net#\
            G12_0_9_Cycles.net, G12_5_4_Cycles.net, G12_34_1_Cycles.net, G12_34_1_Cycles.net#\
            G13_0_11_Cycles.net, G13_9_6_Cycles.net, G13_16_4_Cycles.net, G13_48_1_Cycles.net#\
            G14_0_8_Cycles.net, G14_5_3_Cycles.net, G14_23_1_Cycles.net, G14_23_1_Cycles.net#\
            G15_0_6_Cycles.net, G15_1_3_Cycles.net, G15_10_2_Cycles.net, G15_10_2_Cycles.net#\
            G16_10_3_Cycles.net, G16_14_2_Cycles.net, G16_38_1_Cycles.net, G16_38_1_Cycles.net#\
            G17_2_9_Cycles.net, G17_15_2_Cycles.net, G17_37_1_Cycles.net, G17_51_1_Cycles.net#\
            G18_43_1_Cycles.net, G18_60_1_Cycles.net, G18_11_4_Cycles.net, G18_35_1_Cycles.net#\
            G19_3_4_Cycles.net, G19_3_4_Cycles.net, G19_30_1_Cycles.net, G19_30_1_Cycles.net#\
            G20_35_1_Cycles.net, G20_40_1_Cycles.net, G20_29_1_Cycles.net, G20_39_1_Cycles.net#\
            G21_15_4_Cycles.net, G21_19_2_Cycles.net, G21_17_4_Cycles.net, G21_38_1_Cycles.net#\
            G22_0_11_Cycles.net, G22_3_7_Cycles.net, G22_21_2_Cycles.net, G22_31_2_Cycles.net#\
            G23_25_3_Cycles.net, G23_41_1_Cycles.net, G23_12_4_Cycles.net, G23_67_1_Cycles.net#\
            G24_9_4_Cycles.net, G24_9_4_Cycles.net, G24_10_5_Cycles.net, G24_24_2_Cycles.net#\
            G25_2_12_Cycles.net, G25_20_3_Cycles.net, G25_52_1_Cycles.net, G25_52_1_Cycles.net\
        ');
        this.filesNameForEachNPS = this.parseArray(filesNames);
        // } else {
        //     java.lang.System.out.println("Given Path not directory");
        //     throw new java.lang.IllegalArgumentException("Given path for cycles location is not directory");
        // }
    }

    /**
     * Method to parse array of arrays into format String[][]
     * @param inputArr
     * @return
     */
    private parseArray(inputArr: java.lang.String): java.lang.String[][] {
        let output: java.lang.String[][] = [];
        let arr: java.lang.String[] = inputArr.split("#"); // I will have 25 items in string
        for (let i: int = 0; i < arr.length; i++) {
            output[i]=[]
            let linearr: java.lang.String[] = arr[i].split(",");
            for (let j: int = 0; j < linearr.length; j++) {
                output[i][j] = linearr[j].trim();
            }
        }
        return output;
    }

    /**
     * Adjusting reading the type of cycle in Cycles class to return only numbers (cycle type into NPS1/NPS2)
     * @param type string value to be checked if it contains correct format
     * @return integer as a String type
     */
    protected checkType(type: java.lang.String): java.lang.String {
        let s: java.lang.String = super.checkType(type);    // run the parent checkType method
        // if result is "A" -> cycle's representation of A is 0
        if ((new java.lang.String("A")).equals(s)) {
            return new java.lang.String("0");
        } else {
            // else, the result is "G{number}" -> cycle's representation is {number}
            s = s.substring(1); // extracting the number after letter G
            return s;
        }
    }

    /**
     * Method returns Iterator consisting of all cycles read from files for wanted NPS type.
     * @param type states which NPS cycles are needed
     * @return iterator of cycles already read from files
     */
    public getCycles(outer: Cycles, type: java.lang.String): java.util.Iterator<double[][]> {
        type = this.checkType(type);
        
        let number: int = java.lang.Integer.parseInt(type);

        return new class extends JavaObject implements java.util.Iterator<double[][]> {
            // TODO tu vytvaram inner class ktora musi reachovat do von - problem?
            protected files: java.nio.file.Path[] = this.filesForType(outer,outer.filesNameForEachNPS[number]);   // path of cycles to be read into iterator
            protected index: int = 0;

            public hasNext(): boolean {
                if (this.index < this.files.length) return true; else return false;
            }

            public remove(): void {
            }

            public next(): double[][] {
                let res: double[][] 
                try{
                    res = outer.readInput(this.files[this.index++]);
                } catch (e: unknown){
                    console.log((e as Error).stack);
                    throw(e)
                } 
                return res;
            }

            /**
             * Method to get full path of file given its name and directory address where all files are located.
             * @param arrFiles list of file names
             * @return Path array consisting of file addresses
             */
            private filesForType(outer: Cycles,arrFiles: java.lang.String[]): java.nio.file.Path[] {
                let res: java.util.ArrayList<java.nio.file.Path> = new java.util.ArrayList();

                for (let file of arrFiles) {
                    // TODO myslim ze toto .get by malo joinovat dokopy adresu kde su ulozene subory a ten subor na vstupe (absolutnu adresu or sth)
                    let path: java.nio.file.Path = java.nio.file.Paths.get(new java.lang.String(outer.filesLocation?.toString().valueOf() + "/"  + file.valueOf()));
                    res.add(path);
                }

                let len: int = res.size();
                let pRes: java.nio.file.Path[] = new Array<java.nio.file.Path>(len);
                pRes = res.toArray(pRes);
                return pRes;
            }
        }();
    }

    /**
     * Method to process content of file of given path. The data in the file carry compressed graph information
     * (each row contains two vertices and weight of the edge). The information about edges is read into Double[][]
     * variable.
     * @param filesLocation path of file to be read
     * @return variable containing vertices and weight of the represented edge
     */
    public readInput(filesLocation: java.nio.file.Path): double[][] {
        let readMatrix: java.util.ArrayList<Float64Array> = new java.util.ArrayList();
        let bf: java.io.BufferedReader;

        let fr = new java.io.FileReader((filesLocation).toFile())
        bf = new java.io.BufferedReader(fr, 4*8000*1024);
        
        let line: java.lang.String | null;
        while (true) {
            try {
                if ((bf.readLine()?.valueOf()) == ("*Edges")) break;
            } catch (e) {
                
                if (e instanceof java.io.IOException) {
                    throw new java.lang.RuntimeException(e);
                } else {
                    throw e;
                }
            }
        }
        // read all lines from file
        while (true) {
            try {
                if (((line = bf.readLine()) == null)) break;
            } catch (e) {
                
                if (e instanceof java.io.IOException) {
                    throw new java.lang.RuntimeException(e);
                } else {
                    throw e;
                }
            }
            let arrLine: Float64Array = new Float64Array(3);

            let items: java.lang.String[] = line.split(" ");   // each line has 3 values

            // storing vertices with their original numbering indexed from 1
            for (let i: int = 0; i < items.length; i++) {
                arrLine[i] = parseFloat(items[i]?.valueOf());
            }
            readMatrix.add(arrLine);
        }
        // convert ArrayList into Double[][] array
        let res: double[][] = [];
        for (let i: int = 0; i < readMatrix.size(); i++) {
            res[i]=[]
            for (let j: int = 0; j < readMatrix.get(0).length; j++) {
                res[i][j] = readMatrix.get(i)[j];
            }
        }
        fr.close()
        return res;
    }

    /**
     * Method to compare each patient's graph with cycle that corresponds to actually processed NPS. Amount of edges
     * in patient and cycle is the same and vertices form cycle, therefore the comparision counts number of mismatching
     * edges leading between partitions.
     * @param cycles to use for comparing with patient
     * @param patient anjacency matrix to compare with cycles
     * @return array of integer values where each informs about number of mismatching edges between patient
     * and NPS cycles
     */
    public static editDistance(cycles: java.util.Iterator<double[][]>, patient: Patient): double[] {
        let diffs: double[] = new Array<double>(4);
        let patientAdjMat: double[][] = patient.getcAdjMat();

        let j: int = 0;
        while (cycles.hasNext()) {
            let cycle: double[][] = cycles.next() as double[][];
            if (cycle == null) break;
            let numOfPartitions: int = patientAdjMat.length;
            let diff: int = 0;
            for (let i: int = 0; i < numOfPartitions; i++) {
                if (cycle[i][0] != (patientAdjMat[i][0]) || cycle[i][1] != (patientAdjMat[i][1])) {
                    diff = diff - 1;
                }
            }
            diffs[j++] = diff as double;
        }
        return diffs;

    }
}


/**
 * Coords class represents wrapper class for coordinate data or data that are evaluated in pairs
 */
export class Coords extends JavaObject {
    private x: double;
    private y: double;

    /**
     * Constructor for array of size two
     * @param xy array with 2 values
     */
    public constructor(xy: double[]);

    /**
     * Constructor for two coordinates
     * @param x value
     * @param y value
     */
    public constructor(x: double, y: double);
    public constructor(...args: unknown[]) {
        switch (args.length) {
            case 1: {
                const [xy] = args as [double[]];


                super();
                if (xy.length == 2) {
                    this.x = xy[0];
                    this.y = xy[1];
                } else throw new java.lang.IllegalArgumentException("Wrong size of array for coords instance");


                break;
            }

            case 2: {
                const [x, y] = args as [double, double];


                super();
                this.x = x;
                this.y = y;


                break;
            }

            default: {
                throw new java.lang.IllegalArgumentException(S`Invalid number of arguments`);
            }
        }
    }


    /**
     * Getter X coordinate
     * @return X coordinate
     */
    public getX(): double {
        return this.x;
    }

    /**
     * Getter for Y coordinate
     * @return Y coordinate
     */
    public getY(): double {
        return this.y;
    }

    /**
     * Convert coordinates into printable string
     * @return string to print representation of coordinates
     */
    public toString(): java.lang.String  {
        return new java.lang.String( "(" + this.x?.valueOf() + ":" + this.y?.valueOf() + ")" );
    }
}




/**
 * CBThr class contains data for NPS2 that is used to classify patients into group of people that survive or die
 */
export class CBthr extends PretrainedData {
  protected thr: Map<java.lang.Integer, double[]>;
  //TODO filesLocation with .super() or .this()

  public constructor(path: java.nio.file.Path) {
    super();
    this.filesLocation = path;
    let fr: java.io.FileReader = new java.io.FileReader(path.toFile());
    let bf: java.io.BufferedReader = new java.io.BufferedReader(fr);
    this.thr = this.read(bf);
    fr.close();
  }

  /**
   * Method that parses file with thresholds. Each NPS2 group has 3 thresholds. The middle one is crutial to assign
   * patient if survivor or not. First and third gives interval of neutral range where the result has potential to
   * be changed in the future.
   * @param bf buffered reader from file where thresholds occur
   * @return resulting parsed dictionary of Double arrays
   * @throws IOException
   */
  private read(bf: java.io.BufferedReader): Map<java.lang.Integer, double[]> {
    let read: Map<java.lang.Integer, double[]> = new Map<
      java.lang.Integer,
      double[]
    >();
    let nps2_group: java.lang.Integer = new java.lang.Integer(1);
    let line: java.lang.String | null;
    while ((line = bf.readLine()) !== null) {
      let values: java.lang.String[] = line.split(",");
      let thresholds: double[] = new Array<double>(3);
      for (let i: int = 0; i < values.length; i++) {
        let num: double;
        num = parseFloat(values[i]?.valueOf());
        if (isNaN(num)) {
          thresholds[i] = 0.0;
        } else {
          thresholds[i] = num;
        }
      }
      read.set(nps2_group, thresholds);
      nps2_group = new java.lang.Integer(nps2_group.intValue() + 1);
    }
    return read;
  }

  public getThrsForPhenotype(type: java.lang.Integer): string {
    let thrsData: { [key: string]: any } = {};
    thrsData["lower"]=Math.round(this.getLowerThr(type)*1000)/1000;
    thrsData["main"]=Math.round(this.getMainThr(type)*1000)/1000;
    thrsData["upper"]=Math.round(this.getUpperThr(type)*1000)/1000;

    let thrsJSON=JSON.stringify(thrsData);
    return thrsJSON;
  }
  /**
   * Method to get threshold value for NPS type
   * @param type of phenotype (for NPS2)
   * @return the threshold value
   */
  public getMainThr(type: java.lang.Integer): double {
    const mapIter = this.thr.keys();
    while (true) {
      let a = mapIter.next();
      if (a.value == undefined) {
        console.log("No such key in normxy as wanted " + type);
        return 0;
        break;
      } else {
        if (type.equals(a.value)) {
          let res: double[] = this.thr.get(a.value)!;
          return res[1];
        }
      }
    }
  }
  public getUpperThr(type: java.lang.Integer): double {
    const mapIter = this.thr.keys();
    while (true) {
      let a = mapIter.next();
      if (a.value == undefined) {
        console.log("No such key in normxy as wanted " + type);
        return 0;
        break;
      } else {
        if (type.equals(a.value)) {
          // console.log("The value is "+ a.value + " just as I need " + type)
          let res: double[] = this.thr.get(a.value)!;
          return res[2];
        }
      }
    }
  }
  public getLowerThr(type: java.lang.Integer): double {
    const mapIter = this.thr.keys();
    while (true) {
      let a = mapIter.next();
      if (a.value == undefined) {
        console.log("No such key in normxy as wanted " + type);
        return 0;
      } else {
        if (type.equals(a.value)) {
          let res: double[] = this.thr.get(a.value)!;
          return res[0];
        }
      }
    }
  }
}

console.log("hallo from Model.ts")