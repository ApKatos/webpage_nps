<template>
    <div class="mainscreen">
        <div>
            <h1>RESULTS</h1>
        </div>
        <div>
            <div class="summary column">
                <div class="result">
                    <div>
                        <!-- add a help tag or something to describe a picture -->
                        <canvas ref="nps1_picture" class="frame"></canvas>
                    </div>
                    <div class="text">
                        <div class="column">
                            <p>Patient's phenotype group: </p>
                            <info-tag> {{ phenotypesdescribed }}</info-tag>
                            <label> {{ JSONresult.TimePhenotype }} </label>
                        </div>
                        <div class="column">
                            <p>Death probability among the group: </p>
                            <info-tag> {{ probdeathdescribed }}</info-tag>
                            <label>{{ Math.round(JSONresult.ProbOfDeath) }}%</label>
                        </div>
                    </div>
                </div>
            </div>

            <div class="summary column">
                <div class="result">
                    <info-tag> {{ patientgreyarea }} </info-tag>
                    <div>
                        <canvas ref="nps2_picture" class="frame"></canvas>
                    </div>
                    <div class="text">
                        <div style="{
                            justify-content: center; 
                            display:flex; 
                            }">
                            <div class="column" style="margin-right: 1.5em;">
                                <info-tag v-show="JSONresult.Alive"> {{ aliveInfo }}</info-tag>
                                <label :style="{ color: JSONresult.Alive ? 'greenyellow' : 'gray' }" :class="{
                                    'highlighted-label':
                                        JSONresult.Alive
                                }"> ALIVE
                                </label>
                            </div>

                            <div class="column" style="margin-left: 1.5em;">
                                <label :style="{ color: JSONresult.Alive ? ' grey' : 'tomato' }" :class="{
                                    'highlighted-label':
                                        !JSONresult.Alive
                                }"> DEAD
                                </label>
                                <info-tag v-show="!JSONresult.Alive"> {{ deadInfo }}</info-tag>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import nps1_categories from "../utils/resources/images/patients_points_circles_updated.png";
import nps2_categories from "../utils/resources/images/NPS2_coords_general_cb0_update.png"
import InfoTag from "@/components/InfoTag.vue";

export default {
    components: { InfoTag },
    data() {
        return {
            briefVisible: false,
            detailedVisible: false,
            JSONresult: "",
            phenotypesdescribed: "Phenotypes represent the timed evolution of disease in range of 1-25. The closer to phenotype 25 the more developed disease",
            probdeathdescribed: "Out of all patiens from given phenotype group, this percentage of patients died at the end og their disease",
            patientgreyarea: " If the location of patient is the grey area then their evolution of disease can still be greatly influenced",
            aliveInfo: "This patient belongs to the phenotype group that will survive",
            deadInfo: "This patient belongs to the phenotype group that will die"
        };
    },
    methods: {
        drawNPSGraph(canvasTag, pictureName, xCoord, yCoord) {
            const xCorrection = 0 // not necessary - previously set on 0.018
            const yCorrection = 0 // not necessary - previously set on 0.018

            const canvas = canvasTag;
            const context = canvas.getContext("2d");

            const imageWidth = 1409; // Width of the original picture in pixels
            const imageHeight = 1410; // Height of the original picture in pixels

            const canvasSize = Math.min(1000, 1000 * (imageWidth / imageHeight)); // Size of the canvas based on the image aspect ratio

            // Load the picture
            const image = new Image();
            image.src = pictureName;

            let pointX = xCoord + xCorrection; // X-coordinate of the point on the picture
            console.log(pointX)
            let pointY = 1 - yCoord + yCorrection; // Y-coordinate of the point on the picture
            console.log(pointY)

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
                const canvasX = posX + (pointX * imageWidth * scale);
                const canvasY = posY + (pointY * imageHeight * scale);

                // Draw the point on the canvas
                // context.beginPath();
                // context.arc(canvasX, canvasY, 10, 0, 2 * Math.PI, false);
                // context.fillStyle = "black";
                // context.fill();

                var circle1 = { radius: 5, color: "red", width: 10 }
                var circle2 = { radius: 11, color: "black", width: 6 }

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
            }
        },

    },
    mounted() {
        this.JSONresult = JSON.parse(this.$route.query.result);
        this.drawNPSGraph(this.$refs.nps1_picture, nps1_categories, this.JSONresult.NPS1["x"], this.JSONresult.NPS1["y"]);
        this.drawNPSGraph(this.$refs.nps2_picture, nps2_categories, this.JSONresult.NPS2["x"], this.JSONresult.NPS2["y"]);

    },
};
</script>

<style scoped>
.mainscreen {
    height: 100%;
    padding: 0.3125em 5vw 0.3125em 5vw;
    background-image: linear-gradient(0.35turn, gray, lightgreen);
    display: inline-block;
    border: 5px solid black;
}

.summary {
    /* overflow: hidden; */
    /* Clear float */
    /* height: 85vh; */
    height: 33em;
    padding: 1.25em 1.25em 1.25em 1.25em;
    background-color: rgba(0, 0, 0, .35);
    box-sizing: border-box;
}

.result {
    /* Daj tu to co je v result, text */
    width: 100%;
    /* Set the width to 50% to adjust to the parent container */
    justify-content: center;
    /* display: grid; */
    padding-right: 5.5em;
    padding-left: 5.5em;
}

.text {
    /* display: flex; */
    /* background-color: lightgrey; */
    height: em;
    /* margin: 0 0 0 5.25em; */
    background-color: lightgray;
    border: 5px solid black;
    display: flex;
    width: 30vw;
    justify-content: space-evenly;
}

/* .text:hover {
    font-size: 18px;
} */

.column {
    float: left;
    width: 50%;
    /* border: 5px solid green */
}

.row {
    float: top;
    width: 50%;
    /* border: 5px solid green */
}

.frame {
    border: 5px solid black;
}

/* Responsive layout - makes the two columns stack on top of each other instead of next to each other on smaller screens (600px wide or less) */
@media screen and (max-width: 600px) {
    .result {
        width: 100%;
    }
}

label {
    font-size: 2em;
    font-weight: bold;
    opacity: 0.5;
}

canvas {
    display: block;
    width: 30vw;
}

.highlighted-label {
    background-color: grey;
    border: 2px solid black;
    opacity: 1;
    text-shadow: 0 0 0.375rem black;
    box-shadow: 0 0 0.5rem hsl(300, 40%, 5%);
}
</style>
