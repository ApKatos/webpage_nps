<template>
    <div class="mainscreen">
        <div>
            <h1>RESULTS</h1>
        </div>
        <div class="results-container">
            <div style="padding-right: 5vw">
                <div style="display: grid; grid-template-columns: auto">
                    <canvas ref="nps1_picture" class="frame"></canvas>
                    <info-tag style="position: absolute; margin-left: -40px">{{
                        nps1info
                    }}</info-tag>

                </div>
                <!-- <div class="container">
                    <div class="text">
                        <div class="grid-item" style="display: grid;  grid-template-columns: 3fr 1fr 1fr;">
                            <p>Patient's phenotype group:</p>
                            <label> {{ JSONresult.TimePhenotype }} </label>
                            <info-tag> {{ phenotypesdescribed }}</info-tag>
                        </div>
                        <div class="grid-item" style="display: grid;  grid-template-columns: 3fr 1fr 1fr;">
                            <p>Death probability among the group:</p>
                            <label>{{ Math.round(JSONresult.ProbOfDeath) }}%</label>
                            <info-tag> {{ probdeathdescribed }}</info-tag>
                        </div>
                    </div>
                </div> -->

                <div class="container-left">
                    <div class="phenotype-text">
                        <p>Patient's phenotype group:</p>
                    </div>
                    <div class="phenotype-number">
                        <label> {{ JSONresult.TimePhenotype }} </label>
                    </div>
                    <div class="phenotype-info">
                        <info-tag> {{ phenotypesdescribed }} </info-tag>
                    </div>

                    <div class="probability-text">
                        <p>Death probability among the group:</p>
                    </div>
                    <div class="probability-number">
                        <label>{{ Math.round(JSONresult.ProbOfDeath) }}% </label>
                    </div>
                    <div class="probability-info">
                        <info-tag> {{ probdeathdescribed }}</info-tag>
                    </div>
                </div>
            </div>

            <div style="padding-left: 5vw">
                <div style="display: grid; grid-template-columns: auto">
                    <canvas ref="nps2_picture" class="frame"></canvas>
                    <!-- TODO: position tag next to image -->
                    <info-tag style="position: absolute; margin-left: -40px">
                        {{ nps2info }}
                    </info-tag>
                </div>
                <div class="container-right">
                    <div class="alive">
                        <label :style="{ color: JSONresult.Alive ? 'greenyellow' : 'gray' }" style="margin-left: 55px"
                            :class="{
                                'highlighted-label': JSONresult.Alive,
                            }">
                            ALIVE
                        </label>
                        <info-tag :style="{ visibility: JSONresult.Alive ? 'visible' : 'hidden' }"
                            style="margin-left: 5px; margin-top: 8px">
                            {{ aliveInfo }}</info-tag>
                    </div>
                    <div class="dead">
                        <label :style="{ color: JSONresult.Alive ? ' grey' : 'tomato' }" style="margin-left: 55px" :class="{
                            'highlighted-label': !JSONresult.Alive,
                        }">
                            DEAD
                        </label>
                        <info-tag :style="{ visibility: JSONresult.Alive ? 'hidden' : 'hidden' }"
                            style="margin-left: 5px; margin-top: 8px">
                            {{ deadInfo }}</info-tag>
                    </div>
                </div>
                <!-- <div class="container-left">
                    <div class="text">
                        <div class="column grid-item" style="margin-right: 1.5em">
                            <info-tag v-show="JSONresult.Alive"> {{ aliveInfo }}</info-tag>
                            <label :style="{ color: JSONresult.Alive ? 'greenyellow' : 'gray' }" :class="{
                                'highlighted-label': JSONresult.Alive,
                            }">
                                ALIVE
                            </label>
                        </div>

                        <div class="column grid-item" style="margin-left: 1.5em">
                            <label :style="{ color: JSONresult.Alive ? ' grey' : 'tomato' }" :class="{
                                'highlighted-label': !JSONresult.Alive,
                            }">
                                DEAD
                            </label>
                            <info-tag v-show="!JSONresult.Alive"> {{ deadInfo }}</info-tag>
                        </div>
                    </div>
                </div> -->
            </div>
        </div>
    </div>
</template>

<script>
import nps1_categories from "../utils/resources/images/patients_points_circles_updated.png";
import nps2_categories from "../utils/resources/images/NPS2_coords_general_cb0_update.png";
import InfoTag from "@/components/InfoTag.vue";

export default {
    components: { InfoTag },
    data() {
        return {
            briefVisible: false,
            detailedVisible: false,
            JSONresult: "",
        };
    },
    methods: {
        drawNPSGraph(canvasTag, pictureName, xCoord, yCoord) {
            const xCorrection = 0; // not necessary - previously set on 0.018
            const yCorrection = 0; // not necessary - previously set on 0.018

            const canvas = canvasTag;
            const context = canvas.getContext("2d");

            const imageWidth = 1409; // Width of the original picture in pixels
            const imageHeight = 1410; // Height of the original picture in pixels

            const canvasSize = Math.min(1000, 1000 * (imageWidth / imageHeight)); // Size of the canvas based on the image aspect ratio

            // Load the picture
            const image = new Image();
            image.src = pictureName;

            let pointX = xCoord + xCorrection; // X-coordinate of the point on the picture
            let pointY = 1 - yCoord + yCorrection; // Y-coordinate of the point on the picture

            image.onload = function () {
                // Calculate the scaling factor for mapping the picture coordinates to the canvas
                const scale = canvasSize / Math.max(imageWidth, imageHeight);

                // Calculate the target dimensions to fit the image within the canvas
                const targetWidth = imageWidth * scale;
                const targetHeight = imageHeight * scale;

                // Calculate the positioning to center the image within the canvas
                const posX = (canvasSize - targetWidth) / 2;
                const posY = (canvasSize - targetHeight) / 2;

                // Set the canvas dimensions
                canvas.width = canvasSize;
                canvas.height = canvasSize;

                // Draw the picture on the canvas
                context.drawImage(image, posX, posY, targetWidth, targetHeight);

                // Calculate the coordinates on the canvas based on the picture coordinates and scaling factors
                const canvasX = posX + pointX * imageWidth * scale;
                const canvasY = posY + pointY * imageHeight * scale;


                var circle1 = { radius: 5, color: "red", width: 10 };
                var circle2 = { radius: 11, color: "black", width: 6 };

                context.beginPath();
                context.arc(canvasX, canvasY, circle1.radius, 0, 2 * Math.PI, false);
                context.closePath();
                context.lineWidth = circle1.width;
                context.strokeStyle = circle1.color;
                context.stroke();

                context.beginPath();
                context.arc(canvasX, canvasY, circle2.radius, 0, 2 * Math.PI, false);
                context.closePath();
                context.lineWidth = circle2.width;
                context.strokeStyle = circle2.color;
                context.stroke();
            };
        },
    },
    computed: {
        phenotypesdescribed() {
            return "Phenotypes represent the timed evolution of disease in range of 1-25. The closer to phenotype 25 the more developed the disease";
        },
        probdeathdescribed() {
            return "Out of all patiens from given phenotype group, displayed percentage of patients died at the end of their disease";
        },
        nps2info() {
            return "If the patient's location is in the grey area then their disease progress can still be greatly influenced";
        },
        aliveInfo() {
            return "This patient belongs to the surviving propotion of the phenotype";
        },
        deadInfo() {
            return "This patient belongs to the dying proportion of the phenotype group";
        },
        nps1info() {
            return "This image informs about the progress of disease. Development of disease is described by 25 phenotypes divided into 3 colors according to the severity of the disease. The closer the patient to 25, the more advanced stage of the disease they have. Numbers close to 1 indicate earlier stages and beginnings of the disease.";
        },
    },
    mounted() {
        this.JSONresult = JSON.parse(this.$route.query.result);
        this.drawNPSGraph(
            this.$refs.nps1_picture,
            nps1_categories,
            this.JSONresult.NPS1["x"],
            this.JSONresult.NPS1["y"]
        );
        this.drawNPSGraph(
            this.$refs.nps2_picture,
            nps2_categories,
            this.JSONresult.NPS2["x"],
            this.JSONresult.NPS2["y"]
        );
    },
};
</script>

<style scoped>
.mainscreen {
    height: 100%;
    padding: 0.3125em 5vw 0.3125em 5vw;
    background-image: linear-gradient(0.35turn, gray, lightgreen);
    border: 5px solid black;
}


.container-left {
    display: grid;
    grid-template-columns: 17.5vw 3.9vw 2.6vw;
    grid-template-rows: 80px 80px;
    gap: 0px 0px;
    grid-auto-flow: row;
    grid-template-areas:
        "phenotype-text phenotype-number phenotype-info"
        "probability-text probability-number probability-info";
    background-color: lightgray;
    border: 5px solid black;
}

.container-left>div>p {
    font-size: 1.35em;
}

.container-left>div {
    display: flex;
    justify-content: center;
    margin: auto;
}

.phenotype-text {
    grid-area: phenotype-text;
    margin-left: 10px !important;
    justify-content: left !important;
}

.probability-text {
    grid-area: probability-text;
    margin-left: 10px !important;
    justify-content: left !important;
}

.phenotype-number {
    grid-area: phenotype-number;
}

.probability-number {
    grid-area: probability-number;
}

.phenotype-info {
    grid-area: phenotype-info;
}

.probability-info {
    grid-area: probability-info;
}

.container-right {
    display: grid;
    grid-template-columns: 24vw;
    grid-template-rows: 80px 80px;
    gap: 0px 0px;
    grid-auto-flow: row;
    grid-template-areas:
        "alive"
        "dead";
    background-color: lightgray;
    border: 5px solid black;
}

.container-right>div {
    display: flex;
    justify-content: center;
    margin: auto;
}

.alive {
    grid-area: alive;
}

.dead {
    grid-area: dead;
}

.text {
    display: grid;
    width: inherit;
    height: inherit;
    justify-content: center;
    align-items: center;
    grid-template-columns: repeat(minmax(45%, 100%));
    grid-gap: 15px;
}

.grid-item {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: auto;
    margin-left: 2em;
    margin-right: 2em;
}

.summary {
    height: 33em;
    padding: 1.25em 1.25em 1.25em 1.25em;
    background-color: rgba(0, 0, 0, 0.35);
    box-sizing: border-box;
}

.column {
    float: left;
    width: 50%;
}

.frame {
    border: 5px solid black;
}

label {
    font-size: 1.75em;
    font-weight: bold;
    opacity: 0.5;
}

canvas {
    display: block;
    width: 26vw;
}

.highlighted-label {
    background-color: grey;
    border: 2px solid black;
    opacity: 1;
    text-shadow: 0 0 0.375rem black;
    box-shadow: 0 0 0.5rem hsl(300, 40%, 5%);
}

.results-container {
    display: flex;
    justify-content: center;
    width: 100%;
    flex-wrap: wrap;
    background-color: rgba(0, 0, 0, 0.35);
    padding: 10px;
    margin: auto;
}

@media only screen and (max-width: 1200px) {
    label {
        font-size: 1.25em;
    }

    .container-left>div>p {
        font-size: 1em;
    }
}
</style>
