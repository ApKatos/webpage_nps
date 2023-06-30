import encodedFiles from "./resources/data_base64_encoded_joined.json";


function getFileData(fileName: string): string {
  // @ts-ignore
  let a = atob(encodedFiles[fileName]);
  return a;
}

export class Controller {
  protected model: Model;
  public constructor(model: Model) {
    this.model = model;
  }

  public static main(): void {
    let metadata: string = "HCCDCP_25_HCC_2022_WITH_NPS_METADATA.txt";
    let normsXY: string = "NormsXY_NPS_Level_II.csv";
    let cbThreshold: string = "cb2_thresholds.txt";
    let patientsPath: string = "HCC_2022_WITH_NPS_RawDataExport_ExportID2.csv";
    let model: Model = new Model(metadata, normsXY, cbThreshold, patientsPath);

    let controller: Controller = new Controller(model);
  
    let s2 =
      "000000106,0,77,0,1,1,1.7,0,3.5,.6,1.18,.26,.7,1.11,.65,1101,11.4,317,1,761,25,1,8660,.676871126,.369854417,19,.307016709,78.04776302";
    let p = controller.model.createPatient(s2, false);
    let res_p = controller.model.evalPat(p);

    console.log(res_p);
   }
}
export class Model {
  protected metadata: Metadata;
  protected cycles: Cycles;
  protected weightMatrices: WeightMatrices;
  protected normsXY: NormsXY;
  protected cbThr: CBthr;
  protected patientsPath: string; // training dataset

  public constructor(
    metadata: string,
    normXY: string,
    cbThr: string,
    patientsPath: string
  ) {
    this.metadata = new Metadata(metadata);
    this.cycles = new Cycles();
    this.weightMatrices = new WeightMatrices();
    this.normsXY = new NormsXY(normXY);
    this.cbThr = new CBthr(cbThr);
    this.patientsPath = patientsPath;
  }

  public createPatient(patientInput: string, train: boolean): Patient {
    let pat: Patient = new Patient(this.metadata, patientInput, train);
    return pat;
  }
  public processAllPatients(): void {
    let pats: string[] = this.readPatients();
    let counter = 0;
    for (let patientofpats of pats) {
      counter += 1;
      console.log(counter);
      let p: Patient = new Patient(this.metadata, patientofpats, true);
      console.log("Patient ID: " + p.getId());
      this.evalPat(p);
    }
  }

  private readPatients(): string[] {
    let patients: string[] = new Array();

    let data= getFileData(this.patientsPath)
    let arr = data.split("\n")

    console.log(this.patientsPath);
    let counter = 1;

    
    for(let i=0; i<arr.length;i++) {
      let line = arr[i]
      if (line=="")
        continue

      if (line.split(",")[0] == "PAT_ID") {
        continue
      } else {
        patients.push(line);
        console.log(counter++);
      }
    };
    // bufferStream.close();
    return patients;
  }

  public evalPat(patient: Patient): string {
    let clinicalBurden2: number = 0.0;

    let distances: number[] = Cycles.editDistance(
      this.cycles.getCycles("A"),
      patient
    ); //return ED between cycles and patient's graph
    let pomPosNeg: Coords = WeightMatrices.evaluateEdges(
      this.weightMatrices.getWeightMask("A"),
      patient
    ); //comapring patients's graph and weighted mask
    let normsXYPair: Coords = this.normsXY.getNorms("G0"); //read norms for NPS1

    let nps1: Coords = this.calculateNPS(
      distances,
      pomPosNeg.getX(),
      pomPosNeg.getY(),
      normsXYPair
    ); // NPS1

    patient.setNPS1(nps1);

    let classPhenotype: number = this.deepClinicalPhenotype(patient.getNPS1()); //classification numbero phenotype

    patient.setPhenotypeGroup(classPhenotype);

    let clinicalBurden: number = this.clinicalBurden(patient.getNPS1()); //computation of clinical burden

    let pPat: number = this.probOfDeath(patient, clinicalBurden); // relative probability of death (among all other patients in the same phenotype)

    if (classPhenotype == 10) {
      // Skip NPS2 computation for patients whose phenotype equals 10 - because all of them survive
      patient.setAlive(true);
      patient.setClinicalBurden2(0.0);
      patient.setProbOfDeath(0.0);
    } else {
      // prepare masks, cycles and constants for NPS2

      distances = Cycles.editDistance(
        this.cycles.getCycles("G" + patient.getPhenotypeGroup()),
        patient
      );

      pomPosNeg = WeightMatrices.evaluateEdges(
        this.weightMatrices.getWeightMask("G" + patient.getPhenotypeGroup()),
        patient
      );

      normsXYPair = this.normsXY.getNorms("G" + patient.getPhenotypeGroup());

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
        clinicalBurden2 < this.cbThr.getUpperThr(patient.getPhenotypeGroup())
      ) {
        patient.setClinicalBurden2(clinicalBurden2);
        patient.setAlive(true);
      } else {
        patient.setClinicalBurden2(clinicalBurden2);
        patient.setAlive(false);
      }
    }
    let res = this.getJSONRes(patient)
    return res
  }

  public getJSONRes(p: Patient): string{
    let phenotype: number = p.getPhenotypeGroup() //TODO check if the pehnotype group is the time encoded or raw
    let JSONres=initResult(p.getNPS1() as unknown as number[], p.getNPS2() as unknown as number[] , 
        p.getClinicalBurden2(), this.cbThr.getLowerThr(phenotype), this.cbThr.getMainThr(phenotype), 
        this.cbThr.getUpperThr(phenotype), p.getPhenotypeGroup(), p.getTimeCodedPhenotype(), 
        p.getProbOfDeath(),p.getAlive())
    return JSON.stringify(JSONres)
  }

  public calculateNPS(
    distances: number[],
    pomP: number,
    pomN: number,
    norm: Coords
  ): Coords {
    let coordFactorX: number = 25.0;
    let coordFactorY: number = -25.0;

    let x: number =
      coordFactorX * pomP +
      1 * ((this.metadata.getInputVarNum() + distances[0] + 1) / 2) +
      1 * ((this.metadata.getInputVarNum() + distances[1] + 1) / 2);
    let y: number =
      coordFactorY * pomN +
      1 * ((this.metadata.getInputVarNum() + distances[2] + 1) / 2) +
      1 * ((this.metadata.getInputVarNum() + distances[3] + 1) / 2);

    x = Math.log10(x) / norm.getX();
    y = Math.log10(y) / norm.getY();

    return new Coords(x, y);
  }
  public deepClinicalPhenotype(coord: Coords): number {
    let coords: number[] = [coord.getX(), coord.getY()];
    let phenotype: number;
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
      console.log(
        "ERROR WITH ASSIGNING PHENOTYPE FOR COORDS " +
          coords[0] +
          ":" +
          coords[1]
      );
      throw new Error(
        "Patient's coordinates resulting from NPS1 process are outside of allowed range"
      );
    }
    return phenotype;
  }

  public clinicalBurden(coorC: Coords): number {
    return coorC.getX() - coorC.getY();
  }

  public probOfDeath(patient: Patient, patientCB: number): number {
    let prob: number =
      204.587794714775 /
        (1 + Math.exp(-1.5305944626126 * (patientCB + 1) + 0.484983496496863)) -
      89.689507380257;
    if (prob < 0.0) prob = 0.0;
    else if (prob > 100.0) prob = 100.0;
    patient.setProbOfDeath(prob);
    return prob;
  }
}

export abstract class PretrainedData {
  protected dataFiles: object = encodedFiles;
  /**
   * Method to check correctness of requested type. Correct type looks like letter(G) + number(1-25) or letter(A),
   * e.g. "A","G1","G25", ...
   * wrong example: "A0", "B2", "G0" , ..
   *
   * @param type - string value to be checked if it contains correct format
   * @return string value that is safe to call to select pretrained data files
   */
  protected checkType(type: string): string {
    let part1: string = type.charAt(0);
    if (type.length == 1) {
      // with length 1 only letter A is allowed
      if (part1 == "A") return type;
      else
        throw new Error(
          "One lettered identification " + "of cycle is only A, given " + type
        );
    } else {
      if (part1 == "G") {
        // letter G and number
        let part2: number = 0;
        part2 = parseInt(type.substring(1));
        if (part2 < 0 || part2 > 25)
          throw new Error(
            "Cycle identification number (+" +
              part2 +
              ") is outside allowed range 1-25"
          );

        var str1 = part1;
        var str2 = part2.toString();
        // type = part1 + number.toString(part2);
        type = [str1, str2].join(""); // TODO pozri ci taka konverzia moze fungovat
        return type;
      } else
        throw new Error(
          "Unknown identification of cycle. Only A and G_ cycles recognised." +
            " Called " +
            part1
        );
    }
  }
}

export class WeightMatrices extends PretrainedData {
  private masksName: Array<string> = [
    "A_RESULTS_HCC_2022_MIN_480_MAX_540_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_487.txt",
    "G1_RESULTS_HCC_2022_WITH_NPS_MIN_50_MAX_80_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_77.txt",
    "G2_RESULTS_HCC_2022_WITH_NPS_MIN_45_MAX_90_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_51.txt",
    "G3_RESULTS_HCC_2022_WITH_NPS_MIN_15_MAX_50_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_39.txt",
    "G4_RESULTS_HCC_2022_WITH_NPS_MIN_15_MAX_40_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_26.txt",
    "G5_RESULTS_HCC_2022_WITH_NPS_MIN_30_MAX_80_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_51.txt",
    "G6_RESULTS_HCC_2022_WITH_NPS_MIN_15_MAX_50_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_37.txt",
    "G7_RESULTS_HCC_2022_WITH_NPS_MIN_15_MAX_50_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_35.txt",
    "G8_RESULTS_HCC_2022_WITH_NPS_MIN_20_MAX_80_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_42.txt",
    "G9_RESULTS_HCC_2022_WITH_NPS_MIN_25_MAX_60_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_44.txt",
    "G10_RESULTS_HCC_2022_MIN_480_MAX_540_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_487.txt",
    "G11_RESULTS_HCC_2022_WITH_NPS_MIN_4_MAX_30000_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_36.txt",
    "G12_RESULTS_HCC_2022_WITH_NPS_MIN_4_MAX_30000_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_23.txt",
    "G13_RESULTS_HCC_2022_WITH_NPS_MIN_4_MAX_30000_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_72.txt",
    "G14_RESULTS_HCC_2022_WITH_NPS_MIN_4_MAX_30000_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_24.txt",
    "G15_RESULTS_HCC_2022_WITH_NPS_MIN_4_MAX_30000_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_37.txt",
    "G16_RESULTS_HCC_2022_WITH_NPS_MIN_30_MAX_70_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_49.txt",
    "G17_RESULTS_HCC_2022_WITH_NPS_MIN_10_MAX_50_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_26.txt",
    "G18_RESULTS_HCC_2022_WITH_NPS_MIN_30_MAX_70_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_63.txt",
    "G19_RESULTS_HCC_2022_WITH_NPS_MIN_5_MAX_40_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_19.txt",
    "G20_RESULTS_HCC_2022_WITH_NPS_MIN_5_MAX_50_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_22.txt",
    "G21_RESULTS_HCC_2022_WITH_NPS_MIN_25_MAX_70_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_27.txt",
    "G22_RESULTS_HCC_2022_WITH_NPS_MIN_15_MAX_55_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_20.txt",
    "G23_RESULTS_HCC_2022_WITH_NPS_MIN_50_MAX_90_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_77.txt",
    "G24_RESULTS_HCC_2022_WITH_NPS_MIN_5_MAX_40_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_24.txt",
    "G25_RESULTS_HCC_2022_WITH_NPS_MIN_35_MAX_85_JUMP_1_PROPORTIONAL_EDGE_SELECTION_MASK_COMPRESSED_37.txt",
  ];

  public constructor() {
    super();
  }
  public getWeightMask(type: string): Map<number, Map<number, number>> {
    type = super.checkType(type);
    let fileName = this.filesForType(type);
    let wMask: Map<number, Map<number, number>> = this.readWeightMask(fileName);
    return wMask;
  }
  private readWeightMask(fileName: string): Map<number, Map<number, number>> {
    let weightMask: Map<number, Map<number, number>> = new Map();

    let data: string = getFileData(fileName);
    let arr = data.split("\n");

    for (let i = 0; i < arr.length; i++) {
      let line = arr[i];
      if (line == "") {
        continue;
      }
      line = line.replace("(", "").trim();
      line = line.replace(")", "").trim();
      line = line.replace("|", " ").trim();

      let items: string[];
      if (line == null) {
        break;
      } else {
        items = line.split(" ");
      }

      let ii: number = parseFloat(items[0].trim());
      ii++; // adjusting the number of vertex to be indexed from 1
      let jj: number = parseFloat(items[1].trim());
      jj++;

      let subDict: Map<number, number> | undefined = weightMask.get(ii);
      // ak este nebol subdict initialised s vertex number
      if (subDict == undefined) {
        let subDict2: Map<number, number> = new Map(); // vytvorim subdict
        subDict2.set(jj, parseFloat(items[2].trim()));
        weightMask.set(ii, subDict2); // a subdict vlozim do hlavneho dictu
      } else {
        subDict.set(jj, parseFloat(items[2].trim()));
      }
    }
    return weightMask;
  }
  private filesForType(type: string): string {
    console.log("Hladam file type v weight masks");
    for (let file of this.masksName) {
      let fType: string = file.split("_")[0];
      if (fType.toUpperCase() == type) {
        console.log(file + "vraciam tento file v fileForType pre wMasky DONE");
        return file;
      }
    }
    throw new Error();
  }
  public static evaluateEdges(
    weightMask: Map<number, Map<number, number>>,
    patient: Patient
  ): Coords {
    let pos: number = 0.0;
    let neg: number = 0.0;
    for (let row of patient.getFullGraph()) {
      let edgeWeight: number | undefined;
      // patient's vertices
      let ver1: number = row[0];
      let ver2: number = row[1];

      // fetch the edge value for the 2 patient's vertices
      let nd: Map<number, number> | undefined = weightMask.get(ver1);
      if (nd == undefined) {
        weightMask.set(ver1, new Map<number, number>());
      } else {
        edgeWeight = nd.get(ver2);
        if (edgeWeight == undefined) {
          edgeWeight = 0.0;
        }
      }

      if (edgeWeight == undefined) edgeWeight = 0.0; //if the sub-dictionary does not contain second vertex from patient
      if (edgeWeight < 0) neg += edgeWeight;
      else pos += edgeWeight;
    }
    return new Coords(pos, neg);
  }
}

export class Patient extends PretrainedData {
  private static readonly tg: number[] = [
    0, 25, 23, 20, 16, 11, 8, 6, 4, 2, 1, 24, 21, 17, 13, 9, 7, 3, 22, 18, 14,
    10, 5, 19, 15, 12,
  ]; //array listing order of phenotype groups
  /** List of all instantiated patients from training dataset */
  public static patients: Array<Patient> = new Array(); //TODO - potrebujem vobec tieto Arrays??
  private id: number = 0; // patients id
  private clinicalBurden2: number = 0.0;
  private phenotypeGroup: number = 0; // assigned phenotype group
  private timeCodedPhenotype: number = 0; // ordered (by time) phenotype group
  private probOfDeath: number = 0.0; // relative probability of patient dying in comparision with all other patient in the same @phenotypeGroup
  private alive: boolean = true; //if he is going to belong to patients who die or live
  private numPartitions: number; // number of input variables to fill in
  private cAdjMat: number[][]; // patient's compressed adjacency matrix
  private NPS1: Coords = new Coords(0.0, 0.0); //coords for NPS1
  private NPS2: Coords = new Coords(0.0, 0.0); //coords for NPS2
  protected outputVars: number[]; // output variables that only patients from train dataset have - not used anywhere
  protected model: Metadata; // model the patient belongs to (only Evaluation of Total Hepatocellular Cancer Lifespan)

  public constructor(model: Metadata, patientInput: string, train: boolean) {
    super();
    this.model = model;
    this.numPartitions = model.getInputVarNum();
    console.log("toto su numpartitions "+this.numPartitions)
    this.outputVars = new Array<number>(model.getOutputVarNum());
    this.cAdjMat = [];
    // TODO - pozri ci for cyklus robi to iste co by spravilo toto - new Array<number>(this.numPartitions)[];
    for (let index = 0; index < this.numPartitions; index++) {
      this.cAdjMat[index] = [];
    }
    console.log("Vytvaram cAdjMat ")
    this.cAdjMat = this.createMatrix(patientInput);
  }
  public getPhenotypeGroup(): number {
    return this.phenotypeGroup;
  }

  public setPhenotypeGroup(group: number): void {
    for (let i: number = 1; i < Patient.tg.length; i++) {
      if (Patient.tg[i] == group) this.timeCodedPhenotype = i; // set time encoded phenotype group that represents linear order of disease developing
    }
    this.phenotypeGroup = group;
  }

  public getTimeCodedPhenotype(): number {
    return this.timeCodedPhenotype;
  }

  public getNPS1(): Coords {
    return this.NPS1;
  }
  public getNPS2(): Coords {
    return this.NPS2;
  }
  public setNPS1(coords: Coords): void {
    this.NPS1 = coords;
  }
  public setNPS2(coords: Coords): void {
    this.NPS2 = coords;
  }
  public getId(): number {
    return this.id;
  }

  public getOutputVar(varName: string): number {
    let index: number = -1;
    let varNames: string[] = this.model.getVarNamesOutput();
    for (let i: number = 0; i < varNames.length; i++)
      if (varName.toUpperCase().trim() == varNames[i]) index = i;
    return this.outputVars[index];
  }
  public getcAdjMat(): number[][] {
    return this.cAdjMat;
  }
  public getFullGraph(): number[][] {
    // There are no loop edges
    let fullGraph: number[][] = []; // TODO pozri ci toto instanciuje ako ma
    // new Array<number>((this.numPartitions * (this.numPartitions - 1)) / 2)[];
    let i: number = 0;
    for (let j: number = 0; j < this.cAdjMat.length; j++) {
      fullGraph[i] = [];
      for (let jj: number = j; jj < this.cAdjMat.length - 1; jj++) {
        let v1: number = this.cAdjMat[j][0];
        let v2: number = this.cAdjMat[jj][1];
        fullGraph[i++] = [v1, v2, 1.0];
      }
    }
    return fullGraph;
  }
  public createMatrix(input: string): number[][] {
    let res: number[][] = [];
    // new Array<number>(this.numPartitions)[];

    let lineToSplit: string = input;
    lineToSplit = input.replaceAll(",", " ");
    const parts: string[] = lineToSplit.split(/\s+/);

    // let parts: string[] = input.split("\\s*[,]{1}\\s*");

    if (parts.length < this.model.getInputVarNum()) {
      throw new Error();
    } else if (
      parts.length <
      this.model.getOutputVarNum() + this.model.getInputVarNum() + 1
    )
      // +1 because patient's ID also counts
      // If there is not enough values in patient's input i just add plain zeros
      while (
        parts.length <
        this.model.getOutputVarNum() + this.model.getInputVarNum() + 1
      ) {
        parts.push("0.0");
      }
    // parts = java.util.Arrays.copyOf(parts, this.model.getInputVarNum() + this.model.getOutputVarNum() + 1);

    this.id = parseInt(parts[0]); //patient id

    // these variables used at the end to close the cyclic graph
    let vertNoFirst: number = this.model.getNoVertex(
      this.model.getVarNames()[0],
      parts[1]
    ); //.get(0) because varNames do not include patID
    // parts[1] because patID is at index 0;
    let vertNoLast: number = 0;

    // indexing from zero -> due to listing of variable names where I do not have patID as the first variable
    let i: number = 0;

    // assign vertex number to all variables based on input values
    for (; i < this.numPartitions - 1; i++) {
      let varName1: string = this.model.getVarNames()[i];
      let varName2: string = this.model.getVarNames()[i + 1];

      let vertNo1: number = this.model.getNoVertex(varName1, parts[i + 1]); //index shifted by 1 because patient's id is at index 0
      let vertNo2: number = this.model.getNoVertex(varName2, parts[i + 2]); // +2 because it is next value from the previous one
      vertNoLast = vertNo2;

      // creating edge for numbered vertices from input values
      let edge: number[] = [vertNo1, vertNo2, 1.0];
      res[i] = edge;
    }
    let edge: number[] = [vertNoLast, vertNoFirst, 1.0];
    res[i] = edge;

    // If input string is from train dataset, then save also output variable values (from values' subset (17:end))
    let iOutput: number = 0;
    while (++i < parts.length - 1) {
      if (parts[i + 1] == null) this.outputVars[iOutput++] = 0.0;
      else this.outputVars[iOutput++] = parseFloat(parts[i + 1]);
    }
    return res;
  }
  public setAlive(alive: boolean): void {
    this.alive = alive;
  }
  public setProbOfDeath(prob: number): void {
    this.probOfDeath = prob;
  }
  public getProbOfDeath(): number {
    return this.probOfDeath;
  }
  public getAlive(): boolean {
    return this.alive;
  }
  public getClinicalBurden2(): number {
    return this.clinicalBurden2;
  }
  public setClinicalBurden2(clinicalBurden2: number): void {
    this.clinicalBurden2 = clinicalBurden2;
  }
}

export class NormsXY extends PretrainedData {
  private normsXY: Map<string, number[]>;

  public constructor(fileName: string) {
    super();
    this.normsXY = this.read(fileName);
  }
  public getNorms(type: string): Coords {
    type = this.checkType(type);
    const mapIter = this.normsXY.keys();

    while (true) {
      let a = mapIter.next();
      if (a.value == undefined) {
        console.log("No such key in normxy as wanted " + type);
        return new Coords(0.0, 0.0);
      } else {
        if (type == a.value) {
          return new Coords(this.normsXY.get(a.value)!);
        }
      }
    }
  }
  private read(fileName: string): Map<string, number[]> {
    let readNorms: Map<string, number[]> = new Map();

    let data = getFileData(fileName);
    let arr = data.split("\n");

    for (let i = 0; i < arr.length; i++) {
      let line = arr[i];
      if (line == "") {
        continue;
      }
      let values: string[] = line.split(",");
      if (values.length == 1) {
        let vklad = values[0].trim();
        readNorms.set(vklad, [0.0, 0.0]);
      } else {
        let vklad = values[0].trim();
        readNorms.set(vklad, [parseFloat(values[1]!), parseFloat(values[2]!)]);
      }
    }
    return readNorms;
  }
}

export class Metadata {
  private MAXVAL: number = 1000000;
  private inputVarNum: number = 0; // TODO vpisala som tu vsade 0, zisti ci to neni problem
  private outputVarNum: number = 0;
  private thrSize: number = 0; // max number of thresholds for variable that was observed in metadata input file
  private varNames: Array<string> = new Array<string>();
  private varNamesInput: Array<string> = new Array<string>(); // variable names every patient will have in input (without Patient ID first)
  private varNamesOutput: Array<string> = new Array<string>(); // variable names that only train patients have
  private varThresholds: Array<Float64Array> = new Array(); // thresholds for every input variable
  private varType: Array<string> = new Array(); // variable types

  private numPatients: number = 0;

  public constructor(path: string) {
    this.read(path);
  }

  private read(fileName: string): void {
    let pacientInfo = false;

    let data = getFileData(fileName);
    let arr = data.split("\n");

    for (let i = 0; i < arr.length; i++) {
      let line = arr[i];
      if (line == "") {
        continue;
      }

      if (!pacientInfo && line != "PAT_ID") {
        // nothing happens
      } else if (line == "PAT_ID") {
        pacientInfo = true;
      } else {
        line = line.replace("[", " ");
        line = line.replace("]", " ");
        line = line.replace(",", " ");

        const parts: string[] = line.split(/\s+/);

        if ("total" == parts[1].toLowerCase()) {
          console.log("total amount");
          console.log(parseInt(parts[0]));
          break; // kill the reading here
        }

        let varNam: string = this.readVarname(parts[0]);
        this.varNames.push(varNam); // add name of variable

        if (parts.length !== 2) {
          // add thresholds of variable
          let arrayItems: string[] = [];
          for (let index = 1; index < parts.length - 1; index++) {
            arrayItems[index - 1] = parts[index];
          }
          this.varThresholds.push(this.readThresholds(arrayItems));

          // choose bigger number: number of thr for actual variable or maxSize yet acquired
          this.thrSize = Math.max(
            this.varThresholds[this.varThresholds.length - 1].length - 1,
            this.thrSize
          ); // -1 because when creating arr of this length it is +1 bigger than wanted
        }
        // add type of variable
        let varTyp: string = this.readType(parts[parts.length - 1]);
        if ("C" == varTyp || "R" == varTyp) this.varNamesInput.push(varNam);
        else if ("O" == varTyp) this.varNamesOutput.push(varNam);
        this.varType.push(varTyp);
      }
    }

    this.thrSize += 1; // +1 because including classification numbero undefined state

    // Set all thr arrays to the same length and set last item on -1 (meaning of undefined state)
    for (let i: number = 0; i < this.varThresholds.length; i++) {
      let arrThr: Float64Array = new Float64Array(this.thrSize);

      if (this.varThresholds[i].length < this.thrSize) {
        for (let item = 0; item < this.varThresholds[i].length; item++) {
          arrThr[item] = this.varThresholds[i][item];
        }
        arrThr[this.thrSize - 1] = -1; // set last on -1 = undefined state of variable
        this.varThresholds[i] = arrThr;
      } else {
        continue;
      }
    }
  }

  public getOutputVarNum(): number {
    return this.outputVarNum;
  }
  public getVarNamesInput(): Array<string> {
    return this.varNamesInput;
  } // without patID
  public getVarNamesOutput(): Array<string> {
    return this.varNamesOutput;
  }
  public getVarNames(): Array<string> {
    return this.varNames;
  } // without patID
  public getInputVarNum(): number {
    return this.inputVarNum;
  }
  public getThrSize(): number {
    return this.thrSize; // number of thresholds each variable has assigned
  }
  private readVarname(s: string): string {
    // TODO pozri ci to robi co ma
    return s.trim().toUpperCase();
  }
  private readThresholds(s: string[]): Float64Array {
    let res: Float64Array = new Float64Array(s.length + 2);

    // If variable categorical - has only 1 threshold (for 2 categories 0.5)
    if (s.length == 1) {
      res[0] = 0;
      res[1] = 1;
      return res;
    }

    // variable is real
    res[0] = -this.MAXVAL; // set lower bound of numbererval to -infinity
    for (
      let i: number = 1;
      i < s.length + 1;
      i++ //s.length + 1 because started indexing from 1
    )
      res[i] = parseFloat(s[i - 1].trim());

    res[res.length - 1] = this.MAXVAL; // set upper bound of variable numbererval
    return res;
  }
  private readType(s: string): string {
    switch (s.toUpperCase().trim()) {
      case "O":
        this.outputVarNum++;
        return "O";
      case "C":
        this.inputVarNum++;
        return "C";
      case "R":
        this.inputVarNum++;
        return "R";
      default:
        throw new Error(
          "ERROR with accepting variable type in file with metadata"
        );
    }
  }
  public getNoVertex(vertName: string, strValue: string): number {
    //        Prnumber.message("The vertex name is: " + vertName + " and wanted value is "+strValue);
    let vertNo: number = -1;
    let value: number;

    let i: number = this.varNames.indexOf(vertName); // if invalid name of variable
    if (i == -1) return i;

    value = parseFloat(strValue); // TODO biig problem - na vynimkach zalezi
    if (isNaN(value)) {
      vertNo = i * this.thrSize + (this.thrSize - 1); // the last item for undefined state
      return vertNo + 1; // +1 because adjusting to indexing from 1
    } else if (value == -1 * 1.0) {
      console.log("Input variable value for patient can not be equal to -1");
    }

    // If the vertName is categorical variable
    if ("C" == this.varType[i]) {
      if (value == 0.0) vertNo = i * this.thrSize;
      else if (value == 1.0) vertNo = i * this.thrSize + 1;
      else vertNo = (i + 1) * this.thrSize - 1;

      return vertNo + 1; // +1 because adjusting to indexing from 1
    } else if ("R" == this.varType[i]) {
      // Find numbererval where the value falls
      // |1|3|5|7|9|
      // |2| | | | | <-- correct
      // | |2| | | | <-- incorrect
      for (let thr: number = 0; thr < this.thrSize - 1; thr++) {
        let v1: number = this.varThresholds[i][thr];
        let v2: number = this.varThresholds[i][thr + 1];
        if (value >= v1) {
          // Falls between numbererval
          if (value < v2) {
            vertNo = i * this.thrSize + thr;
            //                        Prnumber.message("Assigned value is "+ vertNo+1);
            return vertNo + 1; // +1 because adjusting to indexing from 1
          }
          // Case of thr where thr arraylist fully occupied, the next thr is for the undefined state
          if (thr == this.thrSize - 2) {
            vertNo = i * this.thrSize + thr;

            //                        Prnumber.message("Assigned value is "+ vertNo+1);
            return vertNo + 1; // +1 because adjusting to indexing from 1
          }
        }
      }
    }
    return vertNo + 1;
  }
  public getVertNameValue(vertNo: number): string {
    vertNo -= 1; // vertNo-1 because my representation is indexed from 0

    let name: string;
    let value: string;
    let i: number = vertNo / this.thrSize;
    let resid: number = vertNo % this.thrSize;
    name = this.varNames[i];
    if (resid == this.thrSize - 2 && this.varThresholds[i][resid] !== 0)
      value = this.varThresholds[i][resid] + "<";
    else if (resid == this.thrSize - 1) {
      value = "NaN";
    } else if (this.varThresholds[i][resid] == 0 && resid !== 0) {
      // co ak thr values -10,-5,0,5,10...
      // radsej checkni ci aj value za touto je 0 (alebo pred)
      value = "-";
    } else if (this.varThresholds[i][resid + 1] == this.MAXVAL) {
      value = this.varThresholds[i][resid] + "<";
    } else if ("C" == this.varType[i]) {
      value = this.varThresholds[i][resid].toString();
    } else
      value =
        this.varThresholds[i][resid] + "-" + this.varThresholds[i][resid + 1];
    //        return new String[]{name,value};
    return name + "  " + value;
  }

  public getCategVarNames(): Array<string> | null {
    let output: Array<string> = new Array();
    for (let i: number = 0; i < this.getVarNamesInput().length; i++) {
      if (this.varType[i].toUpperCase() == "C") {
        output.push(this.varNamesInput[i]);
      }
    }
    return output;
  }

  public getVarThresholds(): Array<Float64Array> {
    return this.varThresholds;
  }
}

export class Cycles extends PretrainedData {
  protected filesNameForEachNPS: string[][]; // file names, at index i, to be read for NPS1 or NPS2 with group i,

  public constructor() {
    super();
    let filesNames: string =
      "\
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
        ";
    this.filesNameForEachNPS = this.parseArray(filesNames);
  }

  private parseArray(inputArr: string): string[][] {
    let output: string[][] = [];
    let arr: string[] = inputArr.split("#"); // I will have 25 items in string
    for (let i: number = 0; i < arr.length; i++) {
      output[i] = [];
      let linearr: string[] = arr[i].split(",");
      for (let j: number = 0; j < linearr.length; j++) {
        output[i][j] = linearr[j].trim();
      }
    }
    return output;
  }

  protected checkType(type: string): string {
    let s: string = super.checkType(type); // run the parent checkType method
    // if result is "A" -> cycle's representation of A is 0
    if ("A" == s) {
      return "0";
    } else {
      // else, the result is "G{number}" -> cycle's representation is {number}
      s = s.substring(1); // extracting the number after letter G
      return s;
    }
  }

  public getCycles(_type: string): Array<number[][]> {
    _type = this.checkType(_type);
    let type: number = parseInt(_type);

    let resultCycles: Array<number[][]> = [];

    let filesNames: string[] = this.filesNamesForType(type);

    for (let index = 0; index < filesNames.length; index++) {
      let cycle: number[][] = this.readInput(filesNames[index]);
      resultCycles.push(cycle);
    }

    return resultCycles;
  }

  private filesNamesForType(npsType: number): string[] {
    let res: string[] = [];

    let arrFiles: string[] = this.filesNameForEachNPS[npsType];
    for (let file of arrFiles) {
      res.push(file);
    }
    return res;
  }
  public readInput(fileName: string): number[][] {
    let readMatrix: number[][] = [];

    let data: string = getFileData(fileName);
    let arr: string[] = data.split("\n");

    let skippedIntro = false;

    for (let i = 0; i < arr.length; i++) {
      let line = arr[i];
      if (line == "") {
        continue;
      }

      if (!skippedIntro && line != "*Edges") {
        continue;
      } else if (line == "*Edges") {
        skippedIntro = true;
      } else if (skippedIntro) {
        let arrLine: number[] = [];
        let items: string[] = line.split(" "); // each line has 3 values
        for (let i: number = 0; i < items.length; i++) {
          arrLine[i] = parseFloat(items[i]);
        }
        readMatrix.push(arrLine);
      }
    }
    return readMatrix;
  }

  public static editDistance(
    cycles: Array<number[][]>,
    patient: Patient
  ): number[] {
    let diffs: number[] = [];
    let patientAdjMat: number[][] = patient.getcAdjMat();

    let j: number = 0;
    // while (cycles.hasNext()) {
    for (let index = 0; index < cycles.length; index++) {
      let cycle: number[][] = cycles[index];
      if (cycle == null) throw new Error("CYCLE IS NULL");
      let numOfPartitions: number = patientAdjMat.length;
      let diff: number = 0;
      for (let i: number = 0; i < numOfPartitions; i++) {
        if (
          cycle[i][0] != patientAdjMat[i][0] ||
          cycle[i][1] != patientAdjMat[i][1]
        ) {
          diff = diff - 1;
        }
      }
      diffs[j++] = diff;
    }
    return diffs;
  }
}

export class Coords {
  private x: number;
  private y: number;

  public constructor(x: number, y: number);
  public constructor(x: number[]);

  constructor(x?: number | number[], y?: number) {
    if (typeof x === "object" && x !== undefined) {
      this.x = (x as unknown as number[])[0];
      this.y = (x as unknown as number[])[1];
    } else if (x !== undefined && y !== undefined && typeof x === "number") {
      this.x = x;
      this.y = y;
    } else throw new Error("The constructor for coordinates is not valid");
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  public toString(): string {
    return "(" + this.x + ":" + this.y + ")";
  }
}

export class CBthr extends PretrainedData {
  protected thr: Map<number, number[]>;
  //TODO filesLocation with .super() or .this()

  public constructor(fileName: string) {
    super();
    this.thr = this.read(fileName);
  }

  private read(fileName: string): Map<number, number[]> {
    let read: Map<number, number[]> = new Map<number, number[]>();
    let nps2_group: number = 1;

    let data: string = getFileData(fileName);
    let arr: string[] = data.split("\n");

    for (let i = 0; i < arr.length; i++) {
      let line = arr[i];
      if (line == "") continue;

      let values: string[] = line.split(",");
      let thresholds: number[] = new Array<number>(3);
      for (let i: number = 0; i < values.length; i++) {
        let num: number;
        num = parseFloat(values[i]);
        if (isNaN(num)) {
          thresholds[i] = 0.0;
        } else {
          thresholds[i] = num;
        }
      }
      read.set(nps2_group, thresholds);
      nps2_group = nps2_group + 1;
    }
    return read;
  }

  public getMainThr(type: number): number {
    // TODO - strictly have a look if this works!!!!
    const mapIter = this.thr.keys();
    while (true) {
      let a = mapIter.next();
      if (a.value == undefined) {
        console.log("No such key in normxy as wanted " + type);
        return 0;
      } else {
        if (type == a.value) {
          let res: number[] = this.thr.get(a.value)!;
          return res[1];
        }
      }
    }
  }
  public getUpperThr(type: number): number {
    const mapIter = this.thr.keys();
    while (true) {
      let a = mapIter.next();
      if (a.value == undefined) {
        console.log("No such key in normxy as wanted " + type);
        return 0;
        break;
      } else {
        if (type == a.value) {
          // console.log("The value is "+ a.value + " just as I need " + type)
          let res: number[] = this.thr.get(a.value)!;
          return res[2];
        }
      }
    }
  }
  public getLowerThr(type: number): number {
    const mapIter = this.thr.keys();
    while (true) {
      let a = mapIter.next();
      if (a.value == undefined) {
        console.log("No such key in normxy as wanted " + type);
        return 0;
      } else {
        if (type == a.value) {
          let res: number[] = this.thr.get(a.value)!;
          return res[0];
        }
      }
    }
  }
}

type Result = {
  NPS1: number[]
  NPS2: number[]
  ClinicalBurden: number
  CB_lower: number
  CB_main: number
  CB_upper: number
  RawPhenotype: number
  TimePhenotype: number
  ProbOfDeath: number
  Alive: boolean
}
function initResult(nps1: number[], nps2: number[], clinicalburden: number, cb_lower: number, cb_main:number, cb_upper:number,
  rawphenotype: number, timephenotype: number, probofdeath: number, alive: boolean): Result {
    let res: Result={
      NPS1: nps1,
      NPS2: nps2,
      ClinicalBurden : clinicalburden,
      CB_lower: cb_lower,
      CB_main: cb_main,
      CB_upper: cb_upper,
      RawPhenotype: rawphenotype,
      TimePhenotype: timephenotype,
      ProbOfDeath: probofdeath,
      Alive: alive
    }
    return res
  }

console.log("hallo");
Controller.main();
