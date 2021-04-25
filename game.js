function render(game) {
	
}

function tick(game) {
	let screen = game.screens[0];
	let level = screen.level;
	let levelCam = screen.camera;
	let tileSize = level.tileSize * levelCam.zoomLevel;
	levelCam.x = level.playable[screen.playableSelected].x - (screen.canvas.width / tileSize) / 2;
	levelCam.y = level.playable[screen.playableSelected].y - (screen.canvas.height / tileSize) / 2;

	if (game.inputs['mouse3']) {
		level.playable[screen.playableSelected].targetX = game.lastMouseX / (level.tileSize * levelCam.zoomLevel) + levelCam.x << 0;
		level.playable[screen.playableSelected].targetY = game.lastMouseY / (level.tileSize * levelCam.zoomLevel) + levelCam.y << 0;
	}
}

launchExample();