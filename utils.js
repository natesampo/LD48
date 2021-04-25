function contains(list, item) {
	for (var i=0; i<list.length; i++) {
		if (list[i] == item) {
			return true;
		}
	}

	return false;
}

function remove(list, item) {
	for (var i=0; i<list.length; i++) {
		if (list[i] == item) {
			list.splice(i, 1);
			break;
		}
	}
}

function getIndex(list, item) {
	for (var i=0; i<list.length; i++) {
		if (list[i] == item) {
			return i;
		}
	}

	return -1;
}

function copyArray(list) {
	let copy = [];
	for (var i=0; i<list.length; i++) {
		copy.push(list[i]);
	}

	return copy;
}

function getDistance(x1, y1, x2, y2) {
	let a = x2 - x1;
	let b = y2 - y1;
	return Math.sqrt(a * a + b * b);
}

function getAngle(x1, y1, x2, y2) {
	let a = y2 - y1;
	let b = x2 - x1;
	let theta = Math.atan2(a, b);
	theta *= 180 / Math.PI;
	if (theta < 0) theta = 360 + theta;
	return theta;
}

function snapToEightPoints(x1, y1, x2, y2) {
	let angle = getAngle(x1, y1, x2, y2);
	return Math.round(angle / 45);
}