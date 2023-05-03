/*jshint esversion: 11 */

let osc;

let rW;
let lW;

let backgroundSound;

let video;

function preload() {
  backgroundSound = loadSound("homecomin.mp3");
}

// This will contain all of our lines
paint = [];

// This is like pmouseX and pmouseY...but for every finger [pointer, middle, ring, pinky]
let prevPointer = [
  // Left hand
  [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ],
  // Right hand
  [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ],
];

// Landmark indexes for fingertips [pointer, middle, ring, pinky]...these are the same for both hands
let fingertips = [8, 12, 16, 20];

function setup() {
  sketch = createCanvas(1500, 600);
  video = createCapture(VIDEO);
  video.size(1500, 600);

  backgroundSound.loop();

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video, modelReady);
  // This sets up an event that fills the global variable "poses"
  // with an array every time new poses are detected
  poseNet.on("pose", function (results) {
    poses = results;
  });
  // Hide the video element, and just show the canvas
  video.hide();

  osc = new p5.Oscillator();

  osc.start();

  colorMap = [
    [
      color(0, 0, 0),
      color(255, 0, 255),
      color(0, 0, 255),
      color(255, 255, 255),
    ],

    [color(255, 0, 0), color(0, 255, 0), color(0, 0, 255), color(255, 255, 0)],
  ];

  // #1 Turn on some models (hand tracking) and the show debugger
  // @see https://handsfree.js.org/#quickstart-workflow
  handsfree = new Handsfree({
    // showDebug: true, // Comment this out to hide the default webcam feed with landmarks
    hands: true,
  });
  handsfree.enablePlugins("browser");
  handsfree.plugin.pinchScroll.disable();

  // Add webcam buttons under the canvas
  // Handsfree.js comes with a bunch of classes to simplify hiding/showing things when things are loading
  // @see https://handsfree.js.org/ref/util/classes.html#started-loading-and-stopped-states
  buttonStart = createButton("Start Webcam");
  buttonStart.class("handsfree-show-when-stopped");
  buttonStart.class("handsfree-hide-when-loading");
  buttonStart.mousePressed(() => handsfree.start());

  // Create a "loading..." button
  buttonLoading = createButton("...loading...");
  buttonLoading.class("handsfree-show-when-loading");

  // Create a stop button
  buttonStop = createButton("Stop Webcam");
  buttonStop.class("handsfree-show-when-started");
  buttonStop.mousePressed(() => handsfree.stop());
}

function modelReady() {
  select("#status").html("Model Loaded");
}

function draw() {
  // image(video, 0, 0, width, height);

  background(0);
  fingerPaint();
  mousePaint();
  drawHands();

  // from ml5
  // rightWristX = poses[0].pose.rightWrist.x
  // leftWristY = poses[0].pose.leftWrist.y

  // from ml5
  // drawKeypoints();
  // drawSkeleton();
}

function fingerPaint() {
  let bounds = document.querySelector("canvas").getClientRects()[0];

  const hands = handsfree.data?.hands;

  if (hands?.pinchState) {
    hands.pinchState.forEach((hand, handIndex) => {
      hand.forEach((state, finger) => {
        if (hands.landmarks?.[handIndex]?.[fingertips[finger]]) {
          let x =
            sketch.width -
            hands.landmarks[handIndex][fingertips[finger]].x * sketch.width;
          let y =
            hands.landmarks[handIndex][fingertips[finger]].y * sketch.height;

          if (state === "start") {
            prevPointer[handIndex][finger] = { x, y };
          } else if (state === "held") {
            paint.push([
              prevPointer[handIndex][finger].x,
              prevPointer[handIndex][finger].y,
              x,
              y,
              colorMap[handIndex][finger],
            ]);
          }

          prevPointer[handIndex][finger] = { x, y };
        }
      });
    });


    if (handsfree.data.hands.landmarks[1][21]) {
      if (handsfree.data.hands.landmarks[0][21]) {
        console.log("hands detected");
        rW = handsfree.data.hands.landmarks[1][21]["y"];
        lW = handsfree.data.hands.landmarks[0][21]["y"];

        let freq = map(rW, 0, 1, 800, 100);
        let vol = map(lW, 1, 0, 0.2, 1);
        osc.freq(freq);
        osc.amp(vol);
      }
    }
  }

  if (hands?.pinchState && hands.pinchState[0][3] === "released") {
    paint = [];
  }

  paint.forEach((p) => {
    fill(p[4]);
    stroke(p[4]);
    strokeWeight(10);

    line(p[0], p[1], p[2], p[3]);
  });
}

function mousePaint() {
  if (mouseIsPressed === true) {
    fill(colorMap[1][0]);
    stroke(colorMap[1][0]);
    strokeWeight(10);
    line(mouseX, mouseY, pmouseX, pmouseY);
  }
}

// function drawKeypoints() {
//   // Loop through all the poses detected
//   for (let i = 0; i < poses.length; i++) {
//     // For each pose detected, loop through all the keypoints
//     let pose = poses[i].pose;
//     for (let j = 0; j < pose.keypoints.length; j++) {
//       // A keypoint is an object describing a body part (like rightArm or leftShoulder)
//       let keypoint = pose.keypoints[j];
//       // Only draw an ellipse is the pose probability is bigger than 0.2
//       if (keypoint.score > 0.2) {
//         fill(255, 0, 0);
//         noStroke();
//         // ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
//         // ellipse (poses[0].pose.rightWrist.x, poses[0].pose.rightWrist.y, 10);
//       }
//     }
//   }
// }

function drawHands() {
  const hands = handsfree.data?.hands;

  if (!hands?.landmarks) return;

  hands.landmarks.forEach((hand, handIndex) => {
    hand.forEach((landmark, landmarkIndex) => {
      if (colorMap[handIndex]) {
        switch (landmarkIndex) {
          case 8:
            fill(colorMap[handIndex][0]);
            break;
          case 12:
            fill(colorMap[handIndex][1]);
            break;
          case 16:
            fill(colorMap[handIndex][2]);
            break;
          case 20:
            fill(colorMap[handIndex][3]);
            break;
          default:
            fill(color(255, 255, 255));
        }
      }
      // Set stroke
      if (handIndex === 0 && landmarkIndex === 8) {
        stroke(color(255, 255, 255));
        strokeWeight(5);
        circleSize = 40;
      } else {
        stroke(color(0, 0, 0));
        strokeWeight(0);
        circleSize = 10;
      }

      circle(
        sketch.width - landmark.x * sketch.width,
        landmark.y * sketch.height,
        circleSize
      );
    });
  });
}

// // A function to draw the skeletons
// function drawSkeleton() {
//   // Loop through all the skeletons detected
//   for (let i = 0; i < poses.length; i++) {
//     let skeleton = poses[i].skeleton;
//     // For every skeleton, loop through all body connections
//     for (let j = 0; j < skeleton.length; j++) {
//       let partA = skeleton[j][0];
//       let partB = skeleton[j][1];
//       stroke(255, 0, 0);
//       line(
//         partA.position.x,
//         partA.position.y,
//         partB.position.x,
//         partB.position.y
//       );
//     }
//   }
// }
