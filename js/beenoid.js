/**
 * Holds all game objects.
 */
var Beenoid = {};

/**
 * Global variables and settings 
 */

Beenoid.LINECOUNT = 9;

Beenoid.FIRST_COLOR = '#000';
Beenoid.SECOND_COLOR = '#ffb612';

Beenoid.DEFAULT_MOVEMENT_INTERVAL = 8;

/**
* Calculates variable settings
*/


Beenoid.calculateSettings = function(){

	Beenoid.CONTAINER_WIDTH = getViewportSize().w; // 1024 
	Beenoid.CONTAINER_HEIGHT = getViewportSize().h; // 680

	Beenoid.SCALING_COEFFICIENT_X = 0.8;
	Beenoid.SCALING_COEFFICIENT_Y =  ( Beenoid.CONTAINER_WIDTH > Beenoid.CONTAINER_HEIGHT ) ? 1 : Beenoid.CONTAINER_HEIGHT / Beenoid.CONTAINER_WIDTH; 

	Beenoid.BRICK_WIDTH = Math.round(Beenoid.CONTAINER_WIDTH * 0.0615234375 * Beenoid.SCALING_COEFFICIENT_X * Beenoid.SCALING_COEFFICIENT_Y) //63
	Beenoid.BRICK_HEIGHT = Math.round(Beenoid.BRICK_WIDTH * 0.5) //32

	Beenoid.BRICK_SEPARATOR = Math.round( Beenoid.BRICK_WIDTH * 0.16 * Beenoid.SCALING_COEFFICIENT_X) //10
	Beenoid.BRICK_SEPARATOR_VERTICAL = Math.round(Beenoid.BRICK_HEIGHT * 0.22) //7

	Beenoid.MAT_WIDTH = Math.round(Beenoid.CONTAINER_WIDTH * 0.1181640625 * Beenoid.SCALING_COEFFICIENT_X * Beenoid.SCALING_COEFFICIENT_Y ) //121
	Beenoid.MAT_HEIGHT = Math.round(Beenoid.MAT_WIDTH * 0.1322314049586776859504132231405) //16

	Beenoid.BALL_WIDTH = Math.round( Beenoid.CONTAINER_WIDTH * 0.06640625 * Beenoid.SCALING_COEFFICIENT_X * Beenoid.SCALING_COEFFICIENT_Y) //68
	Beenoid.BALL_HEIGHT = Math.round( Beenoid.CONTAINER_WIDTH * 0.06640625 * Beenoid.SCALING_COEFFICIENT_X * Beenoid.SCALING_COEFFICIENT_Y)  //68

	Beenoid.CONTAINER_TOP_PADDING = Math.round(Beenoid.CONTAINER_WIDTH * 0.166015625 * ( ( Beenoid.CONTAINER_WIDTH / Beenoid.CONTAINER_HEIGHT < 1) ? 2.5 : 1 ) )  //170 
	Beenoid.CONTAINER_BOTTOM_PADDING = Math.round(Beenoid.CONTAINER_WIDTH * 0.00882352941176470588235294117647 * Beenoid.SCALING_COEFFICIENT_X) // 6
};

/**
 * Returns HTML element by id
 * @param {string} id
 */
function el(id) {
	return document.getElementById(id);
}

/**
* Returns viewport size
* @returns {object}
*/

function getViewportSize(w) {
    // Use the specified window or the current window if no argument
    w = w || window;  

    // This works for all browsers except IE8 and before
    if (w.innerWidth != null) return {w: w.innerWidth, h:w.innerHeight};

    // For IE (or any browser) in Standards mode
    var d = w.document;
    if (document.compatMode == "CSS1Compat")        return { w: d.documentElement.clientWidth,
                 h: d.documentElement.clientHeight };

    // For browsers in Quirks mode
    return { w: d.body.clientWidth, h: d.body.clientWidth };
}


/**
* Deletes an object completely, leaving no references
*/
function deleteObject(obj){
	for(prop in obj){
		delete obj[prop];
	};
}

/**
* Copies all object properties to another object  (not by reference)
*/
function copyObjectProperties(from, to){
	for(prop in from){
		to[prop] = from[prop];
	};
};


/**
 * Classes
 */


/**
 * Base for all objects
 * @constructor
 * @param {object}
 */
Beenoid.GameItem = function(params){

	// default params for making prototype chaining
	this.defaultParams = {
		x:  0,
		y:  0,
		w:  0,
		h:  0,
		id: '',
	};

	params = params || this.defaultParams;

	// General properties
	this.id = params.id;

	this.coords = {
		x: (params) ?  params.x : 0,
		y: (params) ?  params.y : 0
	};

	this.size = {
		w: params.w,
		h: params.h
	};

	this.toHTML = function(where){
		var elem = document.createElement('div');
		elem.className = params.classname;
		elem.id = params.id;

		elem.style.left = this.coords.x + 'px';
		elem.style.top = this.coords.y + 'px';

		elem.style.width = this.size.w + 'px';
		elem.style.height = this.size.h + 'px';

		// for Ball - background instead of size
		elem.style.backgroundSize = this.size.w + 'px ' + this.size.h + 'px';

		where.appendChild(elem);

		return elem;
	};

	// methods

	//for bricks only - to remove them from game
	this.remove = function(){

		//remove from Bricks Array 
		var brickIndex = Beenoid.Objects.Bricks.indexOf(this);
		Beenoid.Objects.Bricks.splice(brickIndex, 1);

		// remove from DOM
		el(this.id).parentNode.removeChild(el(this.id));
	};
}


/**
 * Creates Mat object
 * @constructor
 * @param {object}
 */
Beenoid.Mat = function(params) {

	// movement along the X-axis only (for Mat and Ball lying on Mat)
	this.moveHorizontally = function(x, adjastment){

		adjastment = adjastment || 0; // any adjustment necessary to add to object's position
		this.coords.x = x + adjastment;

		el(this.id).style.left = this.coords.x + 'px';
	};
};

Beenoid.Mat.prototype = new Beenoid.GameItem({
	classname: 'beenoid-mat',
	x: Math.round(Math.random()*(Beenoid.CONTAINER_WIDTH - Beenoid.MAT_WIDTH) ),
	y: Beenoid.CONTAINER_HEIGHT - Beenoid.MAT_HEIGHT - Beenoid.CONTAINER_BOTTOM_PADDING,
	w: Beenoid.MAT_WIDTH,
	h: Beenoid.MAT_HEIGHT,
	id: 'mat'
});



/**
 * Creates Mat object
 * @constructor
 */
Beenoid.Ball = function() {

	/**
	 * Checks whether the Ball touches another object and determine the direction from which the Ball came 
	 * @returns {object} || {boolean}
	 */
	this.touches = function(obj){

		if(  ( 
				(this.coords.x + this.size.w >= obj.coords.x /*1*/
				&& this.coords.x + this.size.w <= obj.coords.x + obj.size.w /*2*/
				)

				||

				(this.coords.x <= obj.coords.x + obj.size.w /*1.1*/
				&& this.coords.x + this.size.w >= obj.coords.x + obj.size.w  /*2.1*/
				) 
			 )

			&& this.coords.y + this.size.h >= obj.coords.y /*3*/
			&& this.coords.y <= obj.coords.y + obj.size.h /*4*/){ 

				if (this.coords.x + this.size.w === obj.coords.x)  return 'left';
				if (this.coords.x + this.size.w === obj.coords.x + obj.size.w) return 'right';
				if (this.coords.y + this.size.h === obj.coords.y) return 'top';
				if (this.coords.y <= obj.coords.y + obj.size.h) return'bottom';

				return true;
		}

		return false;
	};


	/**
	 * Checks whether the Ball lies on Mat (or any object)
	 * @returns {boolean}
	 */
	this.liesOn = function(obj){
		if( ( this.coords.y + this.size.h === obj.coords.y )
			&& (this.coords.x + this.size.w >= obj.coords.x )
			 && (this.coords.x + this.size.w)  <= (obj.coords.x + obj.size.w)
			) { 
			return true;
		};

		return false;
	};

	/**
	 * Movement along the X-axis only (for Mat and Ball lying on Mat)
	 * @param {number} x-coordinate
	 * @param {number} x-axis adjustment necessary to add to object's position
	 */
	this.moveHorizontally = function(x, adjastment){

		adjastment = adjastment || 0; 
		this.coords.x = x + adjastment;

		el(this.id).style.left = Math.round(this.coords.x) + 'px';
	};


	/**
	 * General movement 
	 * @param {object} x and y values to add to current coordinates
	 */
	this.move = function(movementParams){
		
		//changing coords

		this.coords.x = this.coords.x + movementParams.x; 
		this.coords.y = this.coords.y + movementParams.y;

		el(this.id).style.left = this.coords.x + 'px';
		el(this.id).style.top = this.coords.y + 'px';

		//check walls, mat touching 
		var movesFrom =  this.getMovementDirection({x: this.lastFlightMode[0].x,
							y: this.lastFlightMode[0].y});


		if(this.coords.x === 0){ // left wall
			 
			 this.reverseDirection( this.getMovementDirection( this.lastFlightMode[0]), 'right');

		} else if (this.coords.x + this.size.w === Beenoid.CONTAINER_WIDTH) { //right wall

			 this.reverseDirection( this.getMovementDirection( this.lastFlightMode[0]), 'left');

		} else if(this.coords.y === 0 ) { // top wall

			 this.reverseDirection( this.getMovementDirection( this.lastFlightMode[0]), 'bottom');

		}  else if (this.coords.y + this.size.h === Beenoid.CONTAINER_HEIGHT){ // bottom wall - you lose and the game restarts

				Beenoid.clear();
				Beenoid.init();

		} else if(
				(this.coords.y + this.size.h === Beenoid.Objects.Mat.coords.y )
				&& (this.coords.x + this.size.w >= Beenoid.Objects.Mat.coords.x - 1 )
			 	&& (this.coords.x )  <= (Beenoid.Objects.Mat.coords.x + Beenoid.Objects.Mat.size.w)
			){ // touches Mat

				if(this.coords.x >= Beenoid.Objects.Mat.coords.x + Beenoid.Objects.Mat.size.w - Beenoid.BALL_WIDTH * 0.55){ // left
					this.fly.changeDirection(this.getMovementCoords('NW'), Beenoid.DEFAULT_MOVEMENT_INTERVAL);

				} else if(this.coords.x + this.size.w >= Beenoid.Objects.Mat.coords.x - 1
						&& this.coords.x + this.size.w <= Beenoid.Objects.Mat.coords.x + Beenoid.BALL_WIDTH * 0.55
					){
					this.fly.changeDirection(this.getMovementCoords('NE'), Beenoid.DEFAULT_MOVEMENT_INTERVAL);

				} else { // default
					this.reverseDirection( this.getMovementDirection( this.lastFlightMode[0]), 'top');
				}
		};


		// check if the Ball touches any of the Bricks
		
		if(Beenoid.Objects.Bricks.length){ // if there are Bricks, remove the ones the Ball touched

			for (var i = Beenoid.Objects.Bricks.length - 1; i >= 0; i--) {

				var currentBrick = Beenoid.Objects.Bricks[i];

				if(this.touches(currentBrick)){
					currentBrick.remove();
					this.reverseDirection( this.getMovementDirection( this.lastFlightMode[0]), this.touches(currentBrick));
				}
			};

		} else { // or you win the game and it restarts
			Beenoid.clear();
			Beenoid.init();
		};
	
	};


	/**
	 * Determines which direction the Ball moves
	 * @param {object} coordinates
	 * @returns {string} direction in form of 'NE', 'SW' etc.
	 */
	this.getMovementDirection = function(coords){

		var sum = coords.x + coords.y;

		if(sum === -2)
			return 'NE';
		if(sum === 2)
			return 'SW';

		if(coords.x > coords.y)
			return 'NW';

		return 'SE';
	};


	/**
	 * Get the coords for certain movement direction
	 * @param {string} direction like 'SW'
	 * @returns {object} coordinartes
	 */
	this.getMovementCoords = function(direction){
		return this.movementDirections[direction];
	};


	/**
	 * Changes object direction when hitting another object 
	 * @param {string} direction like 'SW'
	 * @param {string} which side the object is moving from, like 'left'
	 */
	this.reverseDirection = function(direction, movesFrom){

		switch(direction) {
			case 'NE':
			(movesFrom === 'right') ? this.fly.changeDirection( this.getMovementCoords('NW'), Beenoid.DEFAULT_MOVEMENT_INTERVAL) : this.fly.changeDirection( this.getMovementCoords('SE'), Beenoid.DEFAULT_MOVEMENT_INTERVAL);	
			break;	

			case 'NW':
			(movesFrom === 'left') ? this.fly.changeDirection( this.getMovementCoords('NE'), Beenoid.DEFAULT_MOVEMENT_INTERVAL) : this.fly.changeDirection( this.getMovementCoords('SW'), Beenoid.DEFAULT_MOVEMENT_INTERVAL);
			break;	

			case 'SW':
			(movesFrom === 'left') ? this.fly.changeDirection( this.getMovementCoords('SE'), Beenoid.DEFAULT_MOVEMENT_INTERVAL) : this.fly.changeDirection( this.getMovementCoords('NW'), Beenoid.DEFAULT_MOVEMENT_INTERVAL);	
			break;	

			case 'SE':
			(movesFrom === 'right') ? this.fly.changeDirection( this.getMovementCoords('SW'), Beenoid.DEFAULT_MOVEMENT_INTERVAL) : this.fly.changeDirection( this.getMovementCoords('NE'), Beenoid.DEFAULT_MOVEMENT_INTERVAL);	
			break;	
		}
	};


	/**
	 * Coordinates for all movement directions
	 */
	this.movementDirections = {
		SW: {x: 1, y: 1},
		SE: {x: -1, y: 1},
		NW: {x: 1, y: -1},
		NE: {x: -1, y: -1}
	};


	/**
	 * Holds current movement setInterval function
	 */
	this.flightMode;

	/**
	 * Saves latest flight mode settings to resume when paused
	 */
	this.lastFlightMode = [{x: -1, y: -1}, Beenoid.DEFAULT_MOVEMENT_INTERVAL];


	/**
	 * Ball movement 
	 * @param {object} movement params like  [{x: -1, y: -1}, interval]
	 */
	this.fly= function(savedMovementParams){

		var obj = this;

		function createInterval(funcParams, interv){

			clearInterval(obj.flightMode);

			obj.lastFlightMode = [funcParams, interv];

			obj.flightMode = setInterval(function() {
				movementFunc(funcParams) 
			}, interv);
		};

		//for outside access
		this.fly.changeDirection = createInterval; 

		// movement change
		var movementFunc = function(movementParams) {

			obj.move(movementParams || savedMovementParams);
		};

		//initial movement
		obj.flightMode = setInterval(function() {movementFunc(obj.lastFlightMode[0]) }, obj.lastFlightMode[1]);
	};


	/**
	 * Stops the Ball movement
	 */
	this.stopMovement =  function(){
		if(this.flightMode)
			clearInterval(this.flightMode);
	};
		
}

Beenoid.Ball.prototype = new Beenoid.GameItem({
	classname: 'beenoid-ball',
	x: 0, // x-ccord will be changed after the Mat is created
	y:  Math.round(Beenoid.CONTAINER_HEIGHT - Beenoid.MAT_HEIGHT - Beenoid.BALL_HEIGHT - Beenoid.CONTAINER_BOTTOM_PADDING),
	w: Beenoid.BALL_WIDTH,
	h: Beenoid.BALL_HEIGHT,
	id: 'ball'
});


/**
 * Game process
 */


/**
 * Array to hold  game objects (Bricks, Ball and Mat)
 */
Beenoid.Objects = {};


/**
 * GAme status (play/pause)
 */
Beenoid.Status = 'paused';


/**
 * Creates Brick objects and places them on screen
 */
Beenoid.drawBricks = function(){

	this.Objects.Bricks = [];

	var bricks = document.createDocumentFragment(), // array to hold brick divs
		brickCount = 0; //bricks per line

	for (var i = 1; i <= Beenoid.LINECOUNT; i++) {

		// rombik (changing bricks per line)
		(i <= Math.round( Beenoid.LINECOUNT/2) ) ? brickCount++ : brickCount--;

		for (var j = brickCount-1; j >= 0; j--) {

			//calculate coords for the Brick object

			// x coords
			var lineWidth = (this.BRICK_WIDTH + this.BRICK_SEPARATOR) * brickCount, 
				lineIndent = Math.floor ( (this.CONTAINER_WIDTH / 2) - lineWidth / 2), 
				brickLeftIndent = lineIndent + (this.BRICK_WIDTH + this.BRICK_SEPARATOR) * j; 

			// y coords
			var lineHeight = (this.BRICK_HEIGHT + this.BRICK_SEPARATOR_VERTICAL), 
				brickTopIndent = lineHeight * i + this.CONTAINER_TOP_PADDING; 

			// create Brick object
			var brick = new this.GameItem({
				classname: (i % 2) ? 'beenoid-brick beenoid-black-brick' : 'beenoid-brick beenoid-yellow-brick',
				id: i + 'brick' + j,
				x: brickLeftIndent,
				y: brickTopIndent,
				w: Beenoid.BRICK_WIDTH,
				h: Beenoid.BRICK_HEIGHT
			});

			// add it to Bricks array
			this.Objects.Bricks.push(brick);

			// convert to HTML div and add to screen
			brick.toHTML(bricks)
		};

	};

	el('beenoid').appendChild(bricks);
};


/**
 * Initializes the game
 */
Beenoid.init = function () {

	if(!Beenoid.CONTAINER_WIDTH) Beenoid.calculateSettings();

	// set up canvas size according to viewport
	el('beenoid').style.width = this.CONTAINER_WIDTH + 'px';
	el('beenoid').style.height = this.CONTAINER_HEIGHT + 'px';

	//save the initial content
	this.BeenoidDivInintialContent = el('beenoid').innerHTML;

	// set up bricks
	this.drawBricks();

	// create the Mat object
	this.Objects.Mat = new this.Mat();

	// create Ball object
	this.Objects.Ball = new this.Ball();
	// place the Ball on Mat
	this.Objects.Ball.coords.x = Math.round(Beenoid.Objects.Mat.coords.x + (Beenoid.MAT_WIDTH/2 - Beenoid.BALL_WIDTH/2));
	//y-coord fix for restart - THINK OF A BETTER SOLUTION
	this.Objects.Ball.coords.y =  Math.round(Beenoid.CONTAINER_HEIGHT - Beenoid.MAT_HEIGHT - Beenoid.BALL_HEIGHT - Beenoid.CONTAINER_BOTTOM_PADDING);

	// add objects to game 
	this.Objects.Mat.toHTML(el('beenoid'));
	this.Objects.Ball.toHTML(el('beenoid'));

	//define Ball movement, play and pause on click
	var defineBallMovement = function(){
		(Beenoid.Status === 'paused') ? Beenoid.play() : Beenoid.pause();
	};

	window.onclick = defineBallMovement;
	window.ontouchstart = defineBallMovement;

	// define Mat movement
	var defineMatMovement = function(event){

		event = event || window.event;

		var xCoord = event.x || event.pageX || event.changedTouches[0].clientX;

		if(xCoord < Beenoid.CONTAINER_WIDTH - Beenoid.MAT_WIDTH) {

			if(Beenoid.Objects.Ball.liesOn(Beenoid.Objects.Mat)) { // if the Ball in currently on Mat. move it along
				Beenoid.Objects.Ball.moveHorizontally(xCoord, Math.round(Beenoid.MAT_WIDTH/2 - Beenoid.BALL_WIDTH/2));
			} 

			Beenoid.Objects.Mat.moveHorizontally(xCoord);
		};
	};

	//do it on move
	window.onmousemove = defineMatMovement;
	window.ontouchmove = function() {
		event.preventDefault();
		if (Beenoid.Status === 'paused') Beenoid.play(); //cancel touchstart pausing
		defineMatMovement();
	};

	//rescale on orientation change
	window.onorientationchange = function() {

		Beenoid.CONTAINER_WIDTH  = getViewportSize().w; // 1024 
		Beenoid.CONTAINER_HEIGHT = getViewportSize().h //- ( getViewportSize().h  - document.documentElement.scrollHeight); // 680

		Beenoid.restoreGame();
	};
	
	//rescale on window resize
	window.onresize = function() {

		Beenoid.CONTAINER_WIDTH  = getViewportSize().w; // 1024 
		Beenoid.CONTAINER_HEIGHT = getViewportSize().h + ( getViewportSize().h  - document.documentElement.scrollHeight); // 680

		Beenoid.restoreGame();
	};

		//rescale on window resize
	window.onload = function() {

		Beenoid.CONTAINER_WIDTH  = getViewportSize().w; // 1024 
		Beenoid.CONTAINER_HEIGHT = getViewportSize().h + ( getViewportSize().h  - document.documentElement.scrollHeight); // 680

		Beenoid.restoreGame();
	};

};


/**
* Restores saved game (e.g. on orientationchange after scaling)
*/
Beenoid.restoreGame = function() {

	Beenoid.clear();
	
	//recalculate dimensions
	Beenoid.calculateSettings();

	Beenoid.Ball.prototype = new Beenoid.GameItem({
		classname: 'beenoid-ball',
		x: 0, // x-ccord will be changed after the Mat is created
		y:  Math.round(Beenoid.CONTAINER_HEIGHT - Beenoid.MAT_HEIGHT - Beenoid.BALL_HEIGHT - Beenoid.CONTAINER_BOTTOM_PADDING),
		w: Beenoid.BALL_WIDTH,
		h: Beenoid.BALL_HEIGHT,
		id: 'ball'
	});

	Beenoid.Mat.prototype = new Beenoid.GameItem({
		classname: 'beenoid-mat',
		x: Math.round(Math.random()*(Beenoid.CONTAINER_WIDTH - Beenoid.MAT_WIDTH) ),
		y: Beenoid.CONTAINER_HEIGHT - Beenoid.MAT_HEIGHT - Beenoid.CONTAINER_BOTTOM_PADDING,
		w: Beenoid.MAT_WIDTH,
		h: Beenoid.MAT_HEIGHT,
		id: 'mat'
	});

	Beenoid.init();
};


/**
 * Resets the game 
 */
Beenoid.clear = function(){

	clearInterval(this.Objects.Ball.flightMode);
	deleteObject(this.Objects)
	this.Status = 'paused';
	el('beenoid').innerHTML =  this.BeenoidDivInintialContent;
};


/**
 * Pauses the game 
 */
Beenoid.pause = function(){
	this.Status = 'paused';
	this.Objects.Ball.stopMovement();
};

/**
 * Resumes (or starts) the game 
 */
Beenoid.play = function(){
	this.Status = '';
	this.Objects.Ball.fly(this.Objects.Ball.lastFlightMode);
};