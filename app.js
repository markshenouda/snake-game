document.addEventListener('DOMContentLoaded', () => {


let mobilenet;
let model;
const webcam = new Webcam(document.getElementById('wc'));
const dataset = new RPSDataset();
var upSamples=0, rightSamples=0, leftSamples=0, downSamples=0;
let isPredicting = false;
const trainingPanels = document.querySelectorAll('.training-panel')
const playground = document.querySelectorAll('.playground')






async function loadMobilenet() {
  const mobilenet = await tf.loadLayersModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json');
  const layer = mobilenet.getLayer('conv_pw_13_relu');
  return tf.model({inputs: mobilenet.inputs, outputs: layer.output});
}

async function train() {
  dataset.ys = null;
  dataset.encodeLabels(4);
  model = tf.sequential({
    layers: [
      tf.layers.flatten({inputShape: mobilenet.outputs[0].shape.slice(1)}),
      tf.layers.dense({ units: 100, activation: 'relu'}),
      tf.layers.dense({ units: 4, activation: 'softmax'})
    ]
  });
  const optimizer = tf.train.adam(0.0001);
  model.compile({optimizer: optimizer, loss: 'categoricalCrossentropy'});
  let loss = 0;
  model.fit(dataset.xs, dataset.ys, {
    epochs: 10,
    callbacks: {
      onBatchEnd: async (batch, logs) => {
        loss = logs.loss.toFixed(5);
        console.log('Loss: ' + loss);
        }
      }
   });
}


const upBtn = document.querySelector('#up-btn')
const rightBtn = document.querySelector('#right-btn')
const leftBtn = document.querySelector('#left-btn')
const downBtn = document.querySelector('#down-btn')
upBtn.addEventListener('click', function(){
  upSamples++;
  document.getElementById("upsamples").innerText = "Up samples:" + upSamples;
  	label = 0;
	const img = webcam.capture();
	dataset.addExample(mobilenet.predict(img), label);
})
rightBtn.addEventListener('click', function(){
  rightSamples++;
  document.getElementById("rightsamples").innerText = "Right samples:" + rightSamples;
  	label = 1;
	const img = webcam.capture();
	dataset.addExample(mobilenet.predict(img), label);
})
leftBtn.addEventListener('click', function(){
  leftSamples++;
  document.getElementById("leftsamples").innerText = "Left samples:" + leftSamples;
  	label = 2;
	const img = webcam.capture();
	dataset.addExample(mobilenet.predict(img), label);
})
downBtn.addEventListener('click', function(){
  downSamples++;
  document.getElementById("downsamples").innerText = "Down samples:" + downSamples;
  	label = 3;
	const img = webcam.capture();
	dataset.addExample(mobilenet.predict(img), label);
})





async function predict() {
  while (isPredicting) {
    const predictedClass = tf.tidy(() => {
      const img = webcam.capture();
      const activation = mobilenet.predict(img);
      const predictions = model.predict(activation);
      return predictions.as1D().argMax();
    });
    const classId = (await predictedClass.data())[0];
    var predictionText = ""
    switch(classId){
		case 0:
      direction = -width
			predictionText = "Up 👆"
			break
		case 2:
      direction = 1
			predictionText = "Right 👉"
			break
		case 1:
      direction = -1
			predictionText = "Left 👈"
      break
    case 3:
      direction = +width
      predictionText = "Down 👇"
      break
	}
	document.getElementById("prediction").innerText = predictionText
			
    
    predictedClass.dispose()
    await tf.nextFrame()
  }
}

const trainBtn = document.querySelector('#train-btn')
trainBtn.addEventListener('click', function(){
  train()
  trainingPanels.forEach((e) => {
    e.classList.add('hide')
  })
  playground.forEach((e) => {
    e.classList.remove('hide')
  })
})


async function init(){
	await webcam.setup()
	mobilenet = await loadMobilenet()
	tf.tidy(() => mobilenet.predict(webcam.capture()))
		
}



init()

const squares = document.querySelectorAll('.grid div')
const scoreDisplay = document.querySelector('.score span')
const startBtn = document.querySelector('.start')

const width = 10
let currentIndex = 0 
let appleIndex = 0 
let currentSnake = [2,1,0] 
let direction = 1
let score = 0
let speed = 1
let intervalTime = 0
let interval = 0

function startGame() {
  isPredicting = true
	predict()
currentSnake.forEach(index => squares[index].classList.remove('snake'))
  squares[appleIndex].classList.remove('apple')
  clearInterval(interval)
  score = 0
  randomApple()
  direction = 1
  scoreDisplay.innerText = score
  intervalTime = 1000
  currentSnake = [2,1,0]
  currentIndex = 0
currentSnake.forEach(index => squares[index].classList.add('snake'))
  interval = setInterval(moveOutcomes, intervalTime)
}



function moveOutcomes() {
  if (
    (currentSnake[0] + width >= (width * width) && direction === width ) ||
    (currentSnake[0] % width === width -1 && direction === 1) ||
    (currentSnake[0] % width === 0 && direction === -1) ||
    (currentSnake[0] - width < 0 && direction === -width) ||
    squares[currentSnake[0] + direction].classList.contains('snake')
  ) {
    isPredicting = false;
    predict();
    alert('Game Over!')
    return clearInterval(interval)
  
  }

  const tail = currentSnake.pop()
  squares[tail].classList.remove('snake')
  currentSnake.unshift(currentSnake[0] + direction)

  if(squares[currentSnake[0]].classList.contains('apple')) {
    squares[currentSnake[0]].classList.remove('apple')
    squares[tail].classList.add('snake')
    currentSnake.push(tail)
    randomApple()
    score++
    scoreDisplay.textContent = score
    clearInterval(interval)
    intervalTime = intervalTime * speed
    interval = setInterval(moveOutcomes, intervalTime)
  }
  squares[currentSnake[0]].classList.add('snake')
}


function randomApple() {
  do{
    appleIndex = Math.floor(Math.random() * squares.length)
  } while(squares[appleIndex].classList.contains('snake')) 
  squares[appleIndex].classList.add('apple')
}


  startBtn.addEventListener('click', startGame)
})
