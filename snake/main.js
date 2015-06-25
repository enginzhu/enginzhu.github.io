const MAP_ROW = 50;
const MAP_COLUMN = 90;

const CELL_TYPE_WALKABLE = "walkable";
const CELL_TYPE_SNAKE_BODY = "snake";
const CELL_TYPE_FOOD = "food";


var snakeBody = new Array();
var direction = RIGHT;
var directionCacheBeforeNextFrame;

$(document).ready(function ()
{
	newGame();
});


const KEYCODE_2_DIRECTION = {
	37 : "left",
	38 : "up",
	39 : "right",
	40 : "down"
};

const DIRECTION_2_KEYCODE = {
	"left" : 37,
	"up" : 38,
	"right" : 39,
	"down" : 40
};

/**
 * 除非蛇仅有一个点
 * 否则不能反方向行进
 */
$(document).keydown(function (event)
{
	event.preventDefault();
	var keyCode = event.keyCode;
	if (snakeBody.length > 1)
	{
		var curDirectionKeyCode = DIRECTION_2_KEYCODE[direction];
		if (Math.abs(curDirectionKeyCode - keyCode) == 2)
		{
			return;	
		}
	}
	switch (keyCode)
	{
		case 37:
			directionCacheBeforeNextFrame = LEFT;
			break;
		case 38:
			directionCacheBeforeNextFrame = UP;
			break;
		case 39:
			 directionCacheBeforeNextFrame= RIGHT;
			break;
		case 40:
			directionCacheBeforeNextFrame = DOWN;
			break;
	}
});	

function newGame()
{
	initScene();
	initSnake();
	initFood();
	startFrameLoop();
}

function initScene()
{
	for (var i = 0; i < MAP_ROW; i++)
	{
		for (var j = 0; j < MAP_COLUMN; j++)
		{
			var cell = $("<div id='cell-" + i + "-" + j + "'></div>");
			cell.addClass("cell");
			setCellState(cell, CELL_TYPE_WALKABLE);
			cell.css({"top": i * 9, "left": j * 9});
			$(".gridContainer").append(cell);
		}
	}
}

function initSnake()
{
	var randomX = Math.floor(Math.random() * MAP_COLUMN);
	var randomY = Math.floor(Math.random() * MAP_ROW);
	var cell = $("#cell-" + randomY + "-" + randomX);
	setCellState(cell, CELL_TYPE_SNAKE_BODY);
	snakeBody.push(cell);

	if (randomX >= MAP_COLUMN / 2)
	{
		directionCacheBeforeNextFrame = LEFT;
	}
	else
	{
		directionCacheBeforeNextFrame = RIGHT;
	}
}


function initFood()
{
	var randomX = Math.floor(Math.random() * MAP_COLUMN);
	var randomY = Math.floor(Math.random() * MAP_ROW);
	var cell = $("#cell-" + randomY + "-" + randomX);
	if (cell.hasClass(CELL_TYPE_SNAKE_BODY))
	{
		initFood();
		return;
	}
	setCellState(cell, CELL_TYPE_FOOD);
}


const UP = "up";
const RIGHT = "right"
const DOWN = "down";
const LEFT = "left";

const UPDATE_FRAME_INTERVAL = 100;
var loopInterval;

function startFrameLoop()
{
	loopInterval = setInterval(frameLoop, UPDATE_FRAME_INTERVAL);
}


function frameLoop()
{
	direction = directionCacheBeforeNextFrame;
	var curHead = snakeBody[snakeBody.length - 1];
	var newHeadType = pushSnakeHead(curHead);
	if (newHeadType == null || newHeadType == CELL_TYPE_SNAKE_BODY)
	{
		gameOver();
		return;
	}
	else if (newHeadType == CELL_TYPE_FOOD)
	{
		initFood();
		return;
	}
	else if (newHeadType == CELL_TYPE_WALKABLE)
	{
		shiftSnakeTail();
	}
}


function shiftSnakeTail()
{
	var tail = snakeBody.shift();
	setCellState(tail, CELL_TYPE_WALKABLE);
	return tail;
}


/**
 * 
 */
function pushSnakeHead(prevHead)
{
	var id = prevHead.attr("id");
	var row = id.split("-")[1];
	var column = id.split("-")[2];
	var nextWayPoint = getNextWayPoint(row, column);
	if (null == nextWayPoint)	//越出边界
	{
		return null;
	}
	else if (nextWayPoint.hasClass(CELL_TYPE_SNAKE_BODY))	//蛇吃到自己
	{
		return CELL_TYPE_SNAKE_BODY;
	}
	else if (nextWayPoint.hasClass(CELL_TYPE_FOOD))	//蛇吃到食物
	{
		setCellState(nextWayPoint, CELL_TYPE_SNAKE_BODY);
		snakeBody.push(nextWayPoint);
		return CELL_TYPE_FOOD;
	}
	else if (nextWayPoint.hasClass(CELL_TYPE_WALKABLE))	//蛇正常行进
	{
		setCellState(nextWayPoint, CELL_TYPE_SNAKE_BODY);
		snakeBody.push(nextWayPoint);
		return CELL_TYPE_WALKABLE;
	}
}


function setCellState(cell, type)
{
	cell.removeClass(CELL_TYPE_WALKABLE);
	cell.removeClass(CELL_TYPE_SNAKE_BODY);
	cell.removeClass(CELL_TYPE_FOOD);
	cell.addClass(type);
}


function gameOver()
{
	clearInterval(loopInterval);
	alert("Game Over");
}


function getNextWayPoint(row, column)
{
	switch(direction)
	{
		case UP:
			row = parseInt(row) - 1;
			break;
		case RIGHT:
			column = parseInt(column) + 1;
			break;
		case DOWN:
			row = parseInt(row) + 1;
			break;
		case LEFT:
			column = parseInt(column) - 1;
			break;
	}
	if (row <0 || row >= MAP_ROW)
	{
		return null;
	}
	if (column < 0 || column >= MAP_COLUMN)
	{
		return null;
	}
	return $("#cell-" + row + "-" + column);
}
