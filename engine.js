class Tile {
	constructor(x, y, sprite, angle, animationSpeed) {
		this.x = x;
		this.y = y;
		this.sprite = sprite;
		this.angle = angle;
		this.animationFrame = 0;
		this.animationSpeed = animationSpeed;
	}

	toString() {
		return 't ' + this.sprite[0] + ' ' + this.sprite[1].toString() + ' ' + this.sprite[2].toString() + ' ' + this.sprite[3].toString() + ' ' + this.sprite[4].toString()
					+ ' ' + this.sprite[5].toString() + ' ' + this.animationSpeed.toString() + ' ' + this.x.toString() + ' ' + this.y.toString() + ' ' + this.angle.toString();
	}
}

class GameObject {
	constructor(x, y, sprite, angle, animationSpeed, collideable, playable, speed) {
		this.x = x;
		this.y = y;
		this.sprite = sprite;
		this.angle = angle;
		this.animationSpeed = animationSpeed;
		this.collideable = collideable;
		this.playable = playable;
		this.speed = speed;

		this.animationFrame = 0;
		this.targetX = x;
		this.targetY = y;
		this.bias = 0;
		this.biasUp = true;
	}

	translate(x, y) {
		this.x += x;
		this.y += y;
	}

	tick(level) {
		if (this.speed != 0) {
			let dist = getDistance(this.x, this.y, this.targetX, this.targetY);
			if (dist > 0.5) {
				let weights = level.getCollideable(this, this.bias, this.bias, 2, 2);

				let a = this.targetY - this.y;
				let b = this.targetX - this.x;
				let theta = Math.atan2(a, b);
				let closeToDiag = Math.abs(Math.sin(2 * theta)) / 3 + 1;
				theta *= 180 / Math.PI;
				if (theta < 0) theta = 360 + theta;
				let ind = theta / 45;
				let remainder = ind - (ind << 0);
				let rounded = ind << 0;
				weights[rounded] += 1.5 * (1 - remainder);
				weights[(rounded + 1) % 8] += 1.5 * remainder;

				let weightX = weights[0] + weights[1]/2 + weights[7]/2 - weights[3]/2 - weights[4] - weights[5]/2;
				let weightY = weights[1]/2 + weights[2] + weights[3]/2 - weights[5]/2 - weights[6] - weights[7]/2;

				let sum = Math.abs(weightX) + Math.abs(weightY);

				let moveX = this.speed * closeToDiag * (weightX / sum);
				let moveY = this.speed * closeToDiag * (weightY / sum);

				level.translateObject(this, moveX, moveY);

				this.bias += this.biasUp ? 0.005 : -0.005;

				if (Math.abs(this.bias) >= 0.5) {
					this.biasUp = !this.biasUp;
				}
			}
		}
	}

	toString() {
		return 'o ' + this.sprite[0] + ' ' + this.sprite[1].toString() + ' ' + this.sprite[2].toString() + ' ' + this.sprite[3].toString() + ' ' + this.sprite[4].toString()
					+ ' ' + this.sprite[5].toString() + ' ' + this.animationSpeed.toString() + ' ' + this.x.toString() + ' ' + this.y.toString() + ' ' + this.angle.toString()
					+ ' ' + this.collideable.toString() + ' ' + this.playable.toString() + ' ' + this.speed.toString();
	}
}

class Camera {
	constructor(x, y, angle, aspectRatio, zoomLevel) {
		this.x = x;
		this.y = y;
		this.angle = angle;
		this.aspectRatio = aspectRatio;
		this.zoomLevel = zoomLevel;
	}

	translate(x, y) {
		this.x += x;
		this.y += y;
	}

	rotate(angle) {
		this.angle += angle;
	}

	zoom(zoomLevel, zoomOriginX, zoomOriginY) {
		// its not perfect but whatever
		let zoomDelta = zoomLevel * 0.05;
		this.translate(-(this.x + zoomOriginX) * zoomDelta, -(this.y + zoomOriginY) * zoomDelta);
		this.zoomLevel -= zoomDelta;
	}
}

class Level {
	constructor(color, tileSize, objects, sprites) {
		this.color = color;
		this.tileSize = tileSize;
		this.sprites = sprites;

		this.map = {};
		this.playable = [];
		for (var i=0; i<objects.length; i++) {
			let object = objects[i];
			this.putInMap(object);
			if (object.playable) {
				this.playable.push(object);
			}
		}
	}

	tick() {
		let tickOrder = [];
		for (var i in this.map) {
			for (var j in this.map[i]) {
				for (var k=this.map[i][j].length-1; k>=0; k--) {
					if (this.map[i][j][k] instanceof GameObject) {
						tickOrder.push(this.map[i][j][k]);
					}
				}
			}
		}

		for (var i=0; i<tickOrder.length; i++) {
			tickOrder[i].tick(this);
		}
	}

	addObject(obj) {
		if (obj instanceof Tile) {
			if (this.map[obj.x] && this.map[obj.x][obj.y]) {
				for (var i=0; i<this.map[obj.x][obj.y].length; i++) {
					if (this.map[obj.x][obj.y][i] instanceof Tile) {
						this.map[obj.x][obj.y].splice(i, 1);
						break;
					}
				}
				this.map[obj.x][obj.y].unshift(obj);
			} else {
				this.putInMap(obj);
			}
		} else {
			this.putInMap(obj);

			if (obj.playable) {
				this.playable.push(obj);
			}
		}
	}

	getXYTile(x, y) {
		if (this.map[x] && this.map[x][y]) {
			for (var i=0; i<this.map[x][y].length; i++) {
				if (this.map[x][y][i] instanceof Tile) {
					return this.map[x][y][i];
				}
			}
		}

		return null;
	}

	translateObject(obj, x, y) {
		let currX = obj.x << 0;
		let currY = obj.y << 0;
		obj.translate(x, y);
		if (obj.x << 0 != currX || obj.y << 0 != currY) {
			remove(this.map[currX][currY], obj);
			this.putInMap(obj);
			this.checkXYForDeletion(currX, currY);
		}
	}

	removeFromMap(obj) {
		remove(this.map[obj.x << 0][obj.y << 0], obj);
		this.checkXYForDeletion(obj.x << 0, obj.y << 0);

		if (obj.playable) {
			remove(this.playable, obj);
		}
	}

	checkXYForDeletion(x, y) {
		if (this.map[x]) {
			if (this.map[x][y] && Object.values(this.map[x][y]).length == 0) {
				delete this.map[x][y];
			}

			if (Object.values(this.map[x]).length == 0) {
				delete this.map[x];
			}
		}
	}

	putInMap(obj) {
		let x = obj.x << 0;
		let y = obj.y << 0;
		if (!this.map[x]) {
			this.map[x] = {};
		}

		if (this.map[x][y]) {
			this.map[x][y].push(obj);
		} else {
			this.map[x][y] = [obj];
		}
	}

	getCollideable(obj, biasX, biasY, radiusX, radiusY) {
		let weights = [0, 0, 0, 0, 0, 0, 0, 0];
		let startX = obj.x + biasX - radiusX << 0;
		let endX = obj.x + biasX + radiusX << 0;
		let startY = obj.y + biasY - radiusY << 0;
		let endY = obj.y + biasY + radiusY << 0;
		for (var i=startX; i<=endX; i++) {
			for (var j=startY; j<=endY; j++) {
				if (this.map[i] && this.map[i][j]) {
					for (var k=0; k<this.map[i][j].length; k++) {
						let tempObj = this.map[i][j][k];
						if (tempObj.collideable && tempObj != obj) {
							let ind = getAngle(obj.x, obj.y, tempObj.x, tempObj.y) / 45;
							let remainder = ind - (ind << 0);
							let rounded = ind << 0;
							let distVal = 1 / getDistance(obj.x, obj.y, tempObj.x, tempObj.y);
							weights[rounded] -= distVal * (1 - remainder);
							weights[(rounded + 1) % 8] -= distVal * remainder;
							break;
						}
					}
				}
			}
		}

		return weights;
	}

	toString() {
		let levelString = 'color ' + this.color['r'] + ' ' + this.color['g'] + ' ' + this.color['b'] + ' ' + this.color['a'] + '\n';
		levelString += 'tileSize ' + this.tileSize;
		for (var i in this.map) {
			for (var j in this.map[i]) {
				for (var k=0; k<this.map[i][j].length; k++) {
					levelString += '\n' + this.map[i][j][k].toString();
				}
			}
		}

		return levelString;
	}
}

class UIButton {
	constructor(x, y, width, height, img, text, onClick) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.img = img;
		this.text = text;
		this.onClick = onClick;
	}
}

class Screen {
	constructor(canvas, context, x, y, width, height, level, camera, ui) {
		this.canvas = canvas;
		this.context = context;
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.level = level;
		this.camera = camera;
		this.ui = ui;

		this.playableSelected = 0;
	}

	resize(newWidth, newHeight, pageWidth, pageHeight) {
		if (this.canvas.width != Math.ceil(newWidth * pageWidth) || this.canvas.height != Math.ceil(newHeight * pageHeight)) {
			this.canvas.width = Math.ceil(newWidth * pageWidth);
			this.canvas.height = Math.ceil(newHeight * pageHeight);
			this.context = canvas.getContext('2d');
			this.effects = new ArrayBuffer(this.canvas.width * this.canvas.height * 4);
			this.camera.aspectRatio = this.canvas.width/this.canvas.height;
		}
		this.width = newWidth;
		this.height = newHeight;
	}

	checkForResize() {
		if (this.canvas.width != Math.ceil(this.width * window.innerWidth) || this.canvas.height != Math.ceil(this.height * window.innerHeight)) {
			this.canvas.width = Math.ceil(this.width * window.innerWidth);
			this.canvas.height = Math.ceil(this.height * window.innerHeight);
			this.context = this.canvas.getContext('2d');
			this.effects = new ArrayBuffer(this.canvas.width * this.canvas.height * 4);
			this.camera.aspectRatio = this.canvas.width/this.canvas.height;
		}
	}
}

class Game {
	constructor(screens, inputs) {
		this.screens = screens ? screens : [];
		this.inputs = inputs ? inputs : {};
	}
}

function loadSprite(sprite, tileSize) {
	if (!document.getElementById(sprite)) {
		let splitPeriod = sprite.split('.');
		let splitUnderscore = splitPeriod[splitPeriod.length-2].split('_');
		let sizeX = parseInt(splitUnderscore[splitUnderscore.length-2]);
		let sizeY = parseInt(splitUnderscore[splitUnderscore.length-1]);

		return new Promise(function(resolve, reject) {
			let xhr = new XMLHttpRequest();
			xhr.open('GET', 'sprites/' + sprite);
			xhr.onreadystatechange = function() {
				if (this.readyState === XMLHttpRequest.DONE) {
					let img = new Image();
					img.onload = function() {
						let canvas = document.createElement('canvas');
						canvas.classList.add('spriteCanvas');
						canvas.id = sprite;
						canvas.width = sizeX * tileSize;
						canvas.height = sizeY * tileSize;
						document.head.appendChild(canvas);

						let context = canvas.getContext('2d');
						context.imageSmoothingEnabled = false;
						context.drawImage(img, 0, 0, sizeX * tileSize, sizeY * tileSize);
						resolve([sprite, canvas]);
					}
					img.src = 'sprites/' + sprite;
				}
			}
			xhr.send();
		});
	}
}

function loadLevel(level, func) {
	return new Promise(function (resolve, reject) {
		let xhr = new XMLHttpRequest();
		xhr.open('GET', 'levels/' + level);
		xhr.onreadystatechange = function() {
			if (this.readyState === XMLHttpRequest.DONE) {
				let levelColor;
				let tileSize;
				let sprite;
				let objects = [];
				let promises = {};
				let levelText = this.responseText.split('\n');
				for (var i=0; i<levelText.length; i++) {
					let line = levelText[i].split(' ');
					switch (line[0]) {
						case 'color':
							levelColor = {'r': parseInt(line[1]), 'g': parseInt(line[2]), 'b': parseInt(line[3]), 'a': parseInt(line[4])};
							break;
						case 'tileSize':
							tileSize = parseInt(line[1]);
							break;
						case 't':
							sprite = document.getElementById(line[1]);
							if (!sprite) {
								if (!promises[line[1]]) {
									promises[line[1]] = (loadSprite(line[1], tileSize));
								}
							} else if (!sprites[line[1]]) {
								sprites[line[1]] = sprite;
							}
							// t sprite spriteX spriteY spriteWidth spriteHeight frames animationSpeed x y angle
							objects.push(new Tile(parseInt(line[8]), parseInt(line[9]), [line[1], parseInt(line[2]), parseInt(line[3]), parseInt(line[4]), parseInt(line[5]), parseInt(line[6])],
													parseInt(line[10]), parseFloat(line[7])));
							break;
						case 'o':
							sprite = document.getElementById(line[1]);
							if (!sprite) {
								if (!promises[line[1]]) {
									promises[line[1]] = (loadSprite(line[1], tileSize));
								}
							} else if (!sprites[line[1]]) {
								sprites[line[1]] = sprite;
							}
							// o sprite spriteX spriteY spriteWidth spriteHeight frames animationSpeed x y angle collideable playable speed
							objects.push(new GameObject(parseInt(line[8]), parseInt(line[9]), [line[1], parseInt(line[2]), parseInt(line[3]), parseInt(line[4]), parseInt(line[5]), parseInt(line[6])],
													parseInt(line[10]), parseFloat(line[7]), line[11] == 'true', line[12] == 'true', parseFloat(line[13])));
							break;
					}
				}

				Promise.all(Object.values(promises)).then(function(imageDati) {
					let sprites = {};
					for (var i in imageDati) {
						sprites[imageDati[i][0]] = imageDati[i][1];
					}

					resolve(new Level(levelColor, tileSize, objects, sprites));
				});
			}
		}
		xhr.send();
	}).then(function(values) {
		if (func) {func(values);}
	}, function() {
		throw ('Error loading level \"levels/' + level);
	});
}

function renderScreen(screen) {
	screen.checkForResize();

	let canvasWidth = screen.canvas.width;
	let canvasHeight = screen.canvas.height;
	let context = screen.context;
	let camera = screen.camera;
	let level = screen.level;
	let tileSize = level.tileSize * camera.zoomLevel;

	context.fillStyle = 'rgba(' + level.color['r'] + ', ' +
									level.color['g'] + ', ' +
									level.color['b'] + ', ' +
									level.color['a'] + ')';
	context.fillRect(0, 0, canvasWidth, canvasHeight);

	let tilesToRender = [];
	let objectsToRender = [];

	let minXPos = camera.x << 0;
	let maxXPos = camera.x + canvasWidth/tileSize << 0;
	let minYPos = camera.y << 0;
	let maxYPos = camera.y + canvasHeight/tileSize << 0;
	for (var i=minYPos; i<=maxYPos; i++) {
		for (var j=minXPos; j<=maxXPos; j++) {
			if (level.map[j] && level.map[j][i]) {
				for (var k=0; k<level.map[j][i].length; k++) {
					let obj = level.map[j][i][k];
					if (obj instanceof Tile) {
						tilesToRender.push(obj);
					} else if (obj instanceof GameObject) {
						objectsToRender.push(obj);
					}
				}
			}
		}
	}

	let allToRender = tilesToRender.concat(objectsToRender);
	let len = allToRender.length;
	for (var i=0; i<len; i++) {
		let obj = allToRender[i];
		let objSpriteData = obj.sprite;
		let sprite = level.sprites[objSpriteData[0]];

		if (sprite) {
			let xPos = (obj.x - camera.x) * tileSize;
			let yPos = (obj.y - camera.y) * tileSize;

			let frameSizeX = objSpriteData[3] * level.tileSize;
			let frameSizeY = objSpriteData[4] * level.tileSize;

			let animationFrames = objSpriteData[5];

			let saved = false;
			if (obj.angle != 0) {
				saved = true;
				context.save();
				context.translate(xPos + tileSize/2, yPos + tileSize/2);
				context.rotate(obj.angle * Math.PI/180);
				xPos = -tileSize/2;
				yPos = -tileSize/2;
			}

			if (obj?.opacity != 1) {
				saved = true;
				context.save();
				context.globalAlpha = obj.opacity;
			}

			if (obj.targetX != undefined && obj.targetX < obj.x) {
				saved = true;
				context.translate(2 * xPos + sprite.width, 0);
				context.scale(-1, 1);
			}

			context.drawImage(sprite, ((obj.animationFrame << 0) * objSpriteData[3] + objSpriteData[1]) * level.tileSize, objSpriteData[2] * level.tileSize, frameSizeX, frameSizeY,
								xPos, yPos, frameSizeX * camera.zoomLevel, frameSizeY * camera.zoomLevel);

			obj.animationFrame = (obj.animationFrame + obj.animationSpeed) % animationFrames;

			if (saved) {
				context.restore();
			}
		}
	}

	for (var i=0; i<screen.ui.length; i++) {
		let button = screen.ui[i];

		context.fillStyle = 'rgba(255, 255, 255, 1)';
		context.lineWidth = 3;
		context.beginPath();
		context.rect(button.x, button.y, button.width, button.height);
		context.stroke();
		context.fill();
		context.closePath();

		if (button.img) {
			let xPos = button.x;
			let yPos = button.y;

			if (button.angle && button.angle != 0) {
				context.save();
				context.translate(button.x + button.width/2, button.y + button.height/2);
				context.rotate(button.angle * Math.PI/180);
				xPos = -button.width/2;
				yPos = -button.height/2;
			}

			if (button.spriteX === undefined) {
				context.drawImage(button.img, xPos, yPos, button.width, button.height);
			} else {
				context.drawImage(button.img, button.spriteX * tileSize, button.spriteY * tileSize, button.spriteWidth * tileSize, button.spriteWidth * tileSize,
									 xPos, yPos, button.width, button.height);
			}

			if (button.angle && button.angle != 0) {
				context.restore();
			}
		}

		context.fillStyle = 'rgba(0, 0, 0, 1)';
		context.fillText(button.text, button.x, button.y + 8);
	}
}

function gameLoop(game) {
	tick(game);
	for (var i=0; i<game.screens.length; i++) {
		game.screens[i].level.tick();
		renderScreen(game.screens[i]);
	}
	render(game);
	window.requestAnimationFrame(function() {gameLoop(game)});
}

function start(game) {
	window.requestAnimationFrame(function() {gameLoop(game);});
}

function launchExample() {
	let game = new Game();
	game.lastMouseX = 0;
	game.lastMouseY = 0;
	addInputs(game.inputs);
	preventContextMenu();

	loadLevel('example.lvl', function(level) {
		let canvas = document.createElement('canvas');
		canvas.classList.add('screenCanvas');
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		document.body.appendChild(canvas);
		let context = canvas.getContext('2d');
		context.imageSmoothingEnabled = false;
		context.mozImageSmoothingEnabled = false;
		context.webkitImageSmoothingEnabled = false;

		game.screens.push(new Screen(canvas, context, 0, 0, 1, 1, level, new Camera(0, 0, 0, canvas.width/canvas.height, 1), []));
		addMouseWheelListener(function(sign) {game.screens[0].camera.zoom(sign, game.screens[0].camera.x + (canvas.width/level.tileSize)/2, game.screens[0].camera.y + (canvas.height/level.tileSize)/2);});

		addMouseDownListener(function(which, x, y) {
			if (which == 3) {
				game.screens[0].level.playable[game.screens[0].playableSelected].targetX = x / (level.tileSize * game.screens[0].camera.zoomLevel) + game.screens[0].camera.x << 0;
				game.screens[0].level.playable[game.screens[0].playableSelected].targetY = y / (level.tileSize * game.screens[0].camera.zoomLevel) + game.screens[0].camera.y << 0;
				game.lastMouseX = x;
				game.lastMouseY = y;
			}
		});

		addMouseMoveListener(function(x, y) {
			if (game.inputs['mouse3']) {
				game.lastMouseX = x;
				game.lastMouseY = y;
			}
		});

		start(game);
	});
}