"use strict";

let canvas;
let ctx;
let squares = {};
var socket = void 0;
var hash = void 0;

const update = (data) => {
  if(!squares[data.hash]) {
	squares[data.hash] = data;
	return;
  }
  
  const square = squares[data.hash]; 

  if(squares[data.hash].lastUpdate >= data.lastUpdate) {
	return;
  }

  square.lastUpdate = data.lastUpdate;
  square.prevX = data.prevX;
  square.prevY = data.prevY;
  square.destX = data.destX;
  square.destY = data.destY;
  square.alpha = 0;
  square.direction = data.direction;
  square.moveLeft = data.moveLeft;
  square.moveRight = data.moveRight;
  square.jump = data.jump;
};

const removeUser = (hash) => {
  if(squares[hash]) {
	delete squares[hash];
  }
};

const setUser = (data) => {
  hash = data.hash;
  squares[hash] = data;
  requestAnimationFrame(redraw);
};

const lerp = (v0, v1, alpha) => {
  return (1 - alpha) * v0 + alpha * v1;
};

const updatePosition = () => {
  const square = squares[hash];

  square.prevX = square.x;
  square.prevY = square.y;
  if(square.moveLeft && square.destX > 5) {
	square.destX -= 2;
  }
  
  if(square.moveRight && square.destX < 435) {
	square.destX += 2;
  }
  if(square.jump && square.y > 374){
    square.destY = square.y - 150;
  }
  
  square.alpha = 0;
  socket.emit('movementUpdate', square);
};

const redraw = (time) => {
  updatePosition();

  ctx.clearRect(0, 0, 500, 500);
  ctx.strokeRect(0, 0, 500, 500);
  const keys = Object.keys(squares);

  for(let i = 0; i < keys.length; i++) {

	const square = squares[keys[i]];

	if(square.alpha < 1) square.alpha += 0.05;

	if(square.hash === hash) {
	  ctx.filter = "none"
	}
	else {
	  ctx.filter = "hue-rotate(40deg)";
	}

	square.x = lerp(square.prevX, square.destX, square.alpha);
	square.y = lerp(square.prevY, square.destY, square.alpha);
    ctx.fillStyle="#00ffff";
    ctx.fillRect(square.x, square.y, square.width, square.height);
    ctx.fillStyle="#FFFFFF";
	ctx.strokeRect(square.x, square.y, square.width, square.height);
  }

  requestAnimationFrame(redraw);
};

const keyDownHandler = (e) => {
	var keyPressed = e.which;
	
	const square = squares[hash];
  
	if(keyPressed === 65 || keyPressed === 37) {
	  square.moveLeft = true;
	}
	else if(keyPressed === 68 || keyPressed === 39) {
	  square.moveRight = true;
	}
    
    if(keyPressed === 32) {
	  square.jump = true;
	}
    
	if(square.moveLeft || square.moveRight) {
	  e.preventDefault();
	}
};

const keyUpHandler = (e) => {
	var keyPressed = e.which;
  
	const square = squares[hash];
	if(keyPressed === 65 || keyPressed === 37) {
	  square.moveLeft = false;
	}
	else if(keyPressed === 68 || keyPressed === 39) {
	  square.moveRight = false;
	}       
    if(keyPressed === 32) {
	  square.jump = false;
	}
};

const init = () => {
	canvas = document.querySelector('#canvas');
	ctx = canvas.getContext('2d');

	socket = io.connect();
	
	socket.on('joined', setUser);
	
	socket.on('updatedMovement', update);
	
	socket.on('left', removeUser);
  
	document.body.addEventListener('keydown', keyDownHandler);
	document.body.addEventListener('keyup', keyUpHandler);
};

window.onload = init;