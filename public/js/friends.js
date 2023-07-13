let otherVideo;
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
let p5l;
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
function setup() {
  var canvas = createCanvas(640, 480);
  canvas.position(10, 180);

  let constraints = { audio: true, video: true };
  video = createCapture(constraints, function (stream) {
    p5l = new p5LiveMedia(this, "CAPTURE", stream, ROOM_ID);
    p5l.on("data", gotData);
    p5l.on("stream", gotStream);
  });
  video.elt.muted = true; // muted video
  video.size(width, height);
  targetLabel = 1; // equal to poseCounter+1. Holds label of current pose
  iterationCounter = 0;
  poseCounter = 0;
  errorCounter = 0;
  timeLeft = timeLimit;
  target = posesArray[poseCounter];
  document.getElementById("poseCounter").textContent = poseCounter.toString();
  document.getElementById(
    "item" + poseCounter.toString()
  ).style.backgroundColor = "rgb(240, 239, 237)";
  document.getElementById("poseName").textContent = target;
  let benefits = getBenefits();
  document.getElementById("benefits").innerHTML = `<ul class="list-unstyled">
  <li>${benefits[0]}</li>
  <li>${benefits[1]}</li>
  <li>${benefits[2]}</li>
  </ul>`;
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
  //   document.getElementById("next_asana").textContent = posesArray[poseCounter+1] + " >> ";
  document.getElementById("english").textContent =
    '"' + english[poseCounter] + '"';
  benefits = getBenefits();
  document.getElementById("benefits").innerHTML = `<ul class="list-unstyled">
  <li>${benefits[0]}</li>
  <li>${benefits[1]}</li>
  <li>${benefits[2]}</li>
  </ul>`;

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

// When data from other player's stream is recieved
function gotData(data, id) {
  let d = JSON.parse(data);
  document.getElementById("poseCounterOther").textContent = d; // recieve the poseCount of other player and display
}

// To display stream of other player
function gotStream(stream, id) {
  // This is just like a video/stream from createCapture(VIDEO)
  otherVideo = stream;
  //otherVideo.id and id are the same and unique identifiers
  otherVideo.size(320, 240);
  otherVideo.position(1100, 180);
}

function yogiLoaded() {
  console.log("Loaded yoga model");
  state = "predict";
  classifyPose();
}

function classifyPose() {
  if (pose) {
    console.log("CLASSIFYING...");
    let inputs = [];
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
    if (results[0].confidence > 0.62 && otherVideo) {
      console.log("GOT RESULTS!");
      if (targetLabel == 6) {
        iterationCounter = iterationCounter + 1;
        if (iterationCounter == timeLimit) {
          iterationCounter = 0;
          nextPose();
        } else {
          timeLeft = timeLeft - 1;
          if (timeLeft < 10) {
            document.getElementById("time").textContent = "00:0" + timeLeft;
            document.getElementById("instruction").textContent =
              "Hold the position";
          } else {
            document.getElementById("time").textContent = "00:" + timeLeft;
          }
          document.getElementById("instruction").textContent =
            "Start the position";
          setTimeout(classifyPose, 1000);
        }
      } else if (results[0].label == targetLabel.toString()) {
        console.log("CORRECT POSE!");
        iterationCounter = iterationCounter + 1;
        if (iterationCounter == timeLimit) {
          console.log("TIME UP");
          iterationCounter = 0;
          nextPose();
        } else {
          timeLeft = timeLeft - 1;
          if (timeLeft < 10) {
            console.log("HOLD THE POSITION");
            document.getElementById("time").textContent = "00:0" + timeLeft;
            document.getElementById("instruction").textContent =
              "Hold the position";
          } else {
            document.getElementById("time").textContent = "00:" + timeLeft;
            document.getElementById("instruction").textContent =
              "Start the position";
          }
          setTimeout(classifyPose, 1000);
        }
      } else {
        errorCounter = errorCounter + 1;
        if (errorCounter >= 4) {
          iterationCounter = 0;
          timeLeft = timeLimit;
          if (timeLeft < 10) {
            document.getElementById("time").textContent = "00:0" + timeLeft;
            document.getElementById("instruction").textContent =
              "Hold the position";
          } else {
            document.getElementById("time").textContent = "00:" + timeLeft;
            document.getElementById("instruction").textContent =
              "Start the position";
          }
          errorCounter = 0;
          setTimeout(classifyPose, 100);
        } else {
          setTimeout(classifyPose, 100);
        }
      }
    } else {
      setTimeout(classifyPose, 100);
    }
  }
}

function nextPose() {
  if (poseCounter >= 5) {
    console.log("ALL POSES DONE");
    document.getElementById("poseCounter").textContent = "6";
    document.getElementById("time").textContent = "Well done!";
    document.getElementById("time2").textContent = "You have learnt all poses.";
  } else {
    console.log("NEXT POSE");
    errorCounter = 0;
    iterationCounter = 0;
    document.getElementById(
      "item" + poseCounter.toString()
    ).style.backgroundColor = "white";
    poseCounter = poseCounter + 1;
    if (p5l) {
      p5l.send(JSON.stringify(poseCounter)); // send updated pose count
    }
    document.getElementById(
      "item" + poseCounter.toString()
    ).style.backgroundColor = "rgb(240, 239, 237)";
    targetLabel = poseCounter + 1;
    target = posesArray[poseCounter];
    document.getElementById("poseCounter").textContent = poseCounter.toString();
    document.getElementById("poseName").textContent = target;
    document.getElementById("english").textContent =
      '"' + english[poseCounter] + '"';
    document.getElementById("poseImg").src = imgArray[poseCounter].src;
    benefits = getBenefits();
    document.getElementById("benefits").innerHTML = `<ul class="list-unstyled">
    <li>${benefits[0]}</li>
    <li>${benefits[1]}</li>
    <li>${benefits[2]}</li>
    </ul>`;
    timeLeft = timeLimit;
    document.getElementById("time").textContent = "00:" + timeLeft;
    document.getElementById("instruction").textContent = "Start the position";
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
