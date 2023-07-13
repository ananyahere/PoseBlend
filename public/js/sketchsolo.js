const { response } = require("express");

let video;
let poseNet;
let pose;
let yogaNN;
var iterationCounter;
let state = "predict";
let timeLimit = 10;
var timeLeft;
let target;
let poseCounter;
let errorCounter;
var imgArray = new Array();
var poseImage;
let english = [
  "Mountain Pose",
  "Tree Pose",
  "Downward Dog",
  "Warrior I",
  "Warrior II",
  "Chair Pose",
];
let posesArray = [
  "Tadasana",
  "Vrikshasana",
  "Adhmoukha svanasana",
  "Vidarbhasana I",
  "Vidarbhasana II",
  "Utkatasana",
];
let score = 0;

function setup() {
  var canvas = createCanvas(640, 480);
  canvas.position(50, 95);
  video = createCapture(VIDEO);
  video.size(width, height);
  targetLabel = 1; // equal to poseCounter+1. Holds label of current pose
  iterationCounter = 0;
  poseCounter = 0;
  errorCounter = 0;
  timeLeft = timeLimit;
  target = posesArray[poseCounter]; // current pose's name
  document.getElementById("poseName").textContent = target;
  let benefits = getBenefits();
  document.getElementById("benefits").innerHTML = `<ul class="list-unstyled">
  <li>${benefits[0]}</li>
  <li>${benefits[1]}</li>
  <li>${benefits[2]}</li>
  </ul>`;
  document.getElementById("score").textContent = `${score}`;
  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video, modelReady);
  // This sets up an event that fills the global variable "poses"
  // with an array every time new poses are detected
  poseNet.on("pose", function (results) {
    if (results.length > 0) {
      pose = results[0].pose;
    }
  });
  imgArray[0] = new Image();
  imgArray[0].src = "/public/images/mountain_pose.jpg";
  imgArray[1] = new Image();
  imgArray[1].src = "/public/images/tree_pose.jpg";
  imgArray[2] = new Image();
  imgArray[2].src = "/public/images/downward_dog.jpg";
  imgArray[3] = new Image();
  imgArray[3].src = "/public/images/warrior_1.jpg";
  imgArray[4] = new Image();
  imgArray[4].src = "/public/images/warrior_2.jpg";
  imgArray[5] = new Image();
  imgArray[5].src = "/public/images/chair.jpg";

  // Hide the video element, and just show the canvas
  document.getElementById("poseImg").src = imgArray[poseCounter].src;
  document.getElementById("next_asana").textContent =
    posesArray[poseCounter + 1];
  document.getElementById("english").textContent =
    '"' + english[poseCounter] + '"';
  benefits = getBenefits();
  document.getElementById("benefits").innerHTML = `<ul class="list-unstyled">
  <li>${benefits[0]}</li>
  <li>${benefits[1]}</li>
  <li>${benefits[2]}</li>
  </ul>`;
  document.getElementById("score").textContent = `${score}`;
  let options = {
    inputs: 34,
    outputs: 6,
    task: "classification",
    debug: true,
  };

  // Load Pretrained Model
  yogaNN = ml5.neuralNetwork(options);
  const modelInfo = {
    model: "/public/js/posenet_models/model.json",
    metadata: "/public/js/posenet_models/model_meta.json",
    weights: "/public/js/posenet_models/model.weights.bin",
  };
  yogaNN.load(modelInfo, yogiLoaded);

  video.hide();
}

function yogiLoaded() {
  console.log("Loaded yoga model");
  state = "predict";
  classifyPose();
}

function classifyPose() {
  if (pose) {
    console.log("CLASSIFYING...");
    let inputs = []; // prepare input for classify()
    for (let i = 0; i < pose.keypoints.length; i++) {
      let x = pose.keypoints[i].position.x;
      let y = pose.keypoints[i].position.y;
      inputs.push(x);
      inputs.push(y);
    }
    yogaNN.classify(inputs, gotResult);
  } else {
    console.log("NO POSE DETECTED");
    setTimeout(classifyPose, 100);
  }
}

function gotResult(error, results) {
  if (results) {
    if (results[0].confidence > 0.62) {
      console.log("GOT RESULTS!");
      if (targetLabel == 6) {
        iterationCounter = iterationCounter + 1;
        if (iterationCounter == timeLimit) {
          iterationCounter = 0;
          score = score + 1;
          nextPose();
        } else {
          timeLeft = timeLeft - 1;
          if (timeLeft < 10) {
            document.getElementById("time").textContent = "00:0" + timeLeft;
          } else {
            document.getElementById("time").textContent = "00:" + timeLeft;
          }
          setTimeout(classifyPose, 1000);
        }
      } else if (results[0].label == targetLabel.toString()) {
        // when the pose by user is correct
        console.log("CORRECT POSE! YOUR SCORE = ", score);
        iterationCounter = iterationCounter + 1;
        if (iterationCounter == timeLimit) {
          // update: check this
          console.log("TIME UP");
          score = score + 1;
          iterationCounter = 0;
          nextPose(); // move to next pose
        } else {
          // hold the correct pose for 10 sec
          timeLeft = timeLeft - 1;
          console.log("HOLD THE POSITION");
          if (timeLeft < 10) {
            document.getElementById("time").textContent = "00:0" + timeLeft;
          } else {
            document.getElementById("time").textContent = "00:" + timeLeft;
          }
          setTimeout(classifyPose, 1000); // keep classifying new poses in each sec
        }
      } else {
        // when the pose by user is incorrect
        errorCounter = errorCounter + 1;
        if (errorCounter >= 4) {
          // reset counter if # of error>=4. Only 4 error are allowed per pose
          iterationCounter = 0;
          timeLeft = timeLimit;
          if (timeLeft < 10)
            document.getElementById("time").textContent = "00:0" + timeLeft;
          else document.getElementById("time").textContent = "00:" + timeLeft;
          errorCounter = 0;
          score = 0; // reset score when # of error>=4
          setTimeout(classifyPose, 100);
        } else {
          setTimeout(classifyPose, 100);
        }
      }
    } else {
      console.log("what we really dont want");
      setTimeout(classifyPose, 100);
    }
  }
}

function nextPose() {
  if (poseCounter >= 5) {
    // User completed all poses
    console.log("ALL POSES DONE");
    document.getElementById("time").textContent = "Well done!";
    document.getElementById("time2").textContent = "You have learnt all poses!";
    // update user score
    updateUserScore()
  } else {
    console.log("NEXT POSE");
    errorCounter = 0;
    iterationCounter = 0;
    poseCounter = poseCounter + 1;
    targetLabel = poseCounter + 1;

    target = posesArray[poseCounter];
    document.getElementById("poseName").textContent = target;
    document.getElementById("english").textContent =
      '"' + english[poseCounter] + '"';
    document.getElementById("poseImg").src = imgArray[poseCounter].src;
    let benefits = getBenefits();
    document.getElementById("benefits").innerHTML = `<ul class="list-unstyled">
     <li>${benefits[0]}</li>
     <li>${benefits[1]}</li>
     <li>${benefits[2]}</li>
     </ul>`;
    document.getElementById("score").textContent = `${score}`;
    if (poseCounter < 5) {
      document.getElementById("next_asana").textContent =
        posesArray[poseCounter + 1];
    } else {
      document.getElementById("next_asana").textContent = "";
    }
    timeLeft = timeLimit;
    document.getElementById("time").textContent = "00:" + timeLeft;
    setTimeout(classifyPose, 4000);
  }
}

function draw() {
  translate(video.width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);

  if (state == "predict") {
    if (pose) {
      for (let j = 0; j < pose.keypoints.length; j++) {
        let keypoint = pose.keypoints[j];
        // Only draw an ellipse is the pose probability is bigger than 0.2
        fill(0, 255, 0);
        noStroke();
        ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
      }
    }
  }
}

// When the model is loaded
function modelReady() {
  console.log("PoseNet is here");
}

function getBenefits() {
  switch (poseCounter) {
    case 0:
      return ["Posture", "Flexibility", "Gut health"];
    case 1:
      return ["Concentration", "Stamina", "Immunity"];
    case 2:
      return ["Blood Circulation", "Tension relieves", "Spine Elongation"];
    case 3:
      return ["Leg Stretches", "Glute Strength", "Hip Flexors"];
    case 4:
      return ["Calf Muscles Stretch", "Spinal Strength", "Blood Circulation"];
    case 5:
      return ["Spinal Strength", "Thigh Toning", "Chest Muscles"];
    default:
      return [];
  }
}

function updateUserScore() {
  fetch("/api/user/score", {
    method: PUT,
    headers: {
      "Content-type": "application/json; charset=UTF-8",
      Authorization: `Bearer ${localStorage.getItem("jwt")}`,
    },
    body: JSON.stringify({ score: score }),
  }).then((response) => {
    // notify user
    if(response.status == 1)
      document.getElementById("score_alert").innerHTML = `<div class="alert alert-success">${response.message}</div>`
    else 
      document.getElementById("score_alert").innerHTML = `<div class="alert alert-danger">Unable to update score </div>`
  });
}
