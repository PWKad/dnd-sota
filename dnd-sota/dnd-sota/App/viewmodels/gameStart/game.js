define(['services/session', 'services/datacontext', 'plugins/router', 'services/messager.queue'], function (session, datacontext, router, messageQueue) {

	var player = ko.observable();
	var map = ko.observable();
	var gameInput = ko.observable();
	var isOpening = ko.observable();
	var isSearching = ko.observable();
	var isBuyingHP = ko.observable();
	var isBuyingMagic = ko.observable();
	var isWielding = ko.observable();
	var isLoading = ko.observable();
	var isFighting = ko.observable();
	var mapHeight = ko.observable(10);
	var mapWidth = ko.observable(10);
	var enemy = ko.observable();
	var instructions = [
		'U,D,L,R - MOVE',
		'2 - OPEN DOOR',
		'3 - SEARCH (TRAPS, DOORS)',
		'4 - SWITCH WEAPON',
		'5 - FIGHT',
		'7 - SAVE GAME',
		'8 - USE MAGIC',
		'9 - BUY MAGIC',
		'10 - LOAD DUNGEON',
		'11 - BUY HP',
		'0 - PASS;'
	];
	// Set the game message equal to the current message in the message queue
	var gameMessage = ko.computed(messageQueue.currentMessage;
	var focusGameInput = ko.observable(false);

	var centeredMap = ko.computed(function () {
		var thisMap = {};
		if (player() && map()) {
			var playerPosition = player().position();
			var mapTop = playerPosition.y() + Math.ceil(mapHeight()/2);
			var mapLeft = playerPosition.x() - Math.ceil(mapWidth()/2);
			var mapBottom = mapTop - mapHeight();
			var mapRight = mapLeft + mapWidth();
		    var rowSort = function (l, r) { return (l.x() == r.x()) ? (l.x() > r.x() ? 1 : -1) : (l.x() > r.x() ? 1 : -1) };
	    	thisMap.rows = ko.computed(function () {
	    		var theseTiles = map().tiles();
	    		var rowsArray = [];
	    		var finalRows = [];
	    		ko.utils.arrayForEach(theseTiles, function (tile) {
	    			// If the tiles Y is greater than or equal to map left and the rows array doesn't have this row coord yet,
	    			if (tile.y() >= mapBottom && tile.y() <= mapTop && rowsArray.indexOf(tile.y()) === -1) {
	    				// Add it
	    				rowsArray.push(tile.y());
	    			}
	    		});
	    		// For each row,
	    		ko.utils.arrayForEach(rowsArray, function (row) {
	    			// return each tile in the row
	    			var draftRow = ko.utils.arrayFilter(theseTiles, function (tile) {
	    				return (tile.x() >= mapLeft && tile.x() <= mapRight && row === tile.y());
	    			}).sort(rowSort);
	    			finalRows.push(draftRow);
	    		});
	    		return finalRows;
	    	}).extend({ throttle: 25 });
		} else {
			thisMap.rows = ko.observableArray([]);
		}
    	return thisMap;
	});

	function activate() {
		player(session.currentPlayer());
		if (!player()) {			
			return router.navigate('');
		}
		createPlayerOnMap();
		createEnemy();
	}

	var compositionComplete = function () {
		focusGameInput(true);
	};

	var game = {
		activate: activate,
		compositionComplete: compositionComplete,
		enterCommand: enterCommand,
		focusGameInput: focusGameInput,
		gameInput: gameInput,
		instructions: instructions,
		gameMessage: gameMessage,
		map: map,
		player: player,
		centeredMap: centeredMap
	};
	return game;

	function enterCommand() {
		if (gameInput()) {
			var thisInput = gameInput().toLowerCase();
			if (isWielding()) {
				var thisInt = parseInt(thisInput);
				if (!isNaN(thisInt)) {
					var thisWeapon = player().weapons()[thisInt - 1];
					if (thisWeapon) {
						player().weapon(thisWeapon);
						messageQueue.addMessage('YOU HAVE EQUIPPED A ' + thisWeapon.name(), false);
					} else {
						messageQueue.addMessage('SORRY YOU DONT HAVE THAT WEAPON', false);
					}
					gameInput(null);
					isWielding(false);
				}
			}
			else if (!map() || isLoading()) {
				datacontext.getMap(map, thisInput);
				if (!map()) {
					alert('MAP NOT FOUND!');
				}
				createPlayerOnMap();
				createEnemy();
				gameInput(null);
				isLoading(false);
			}
			else if (thisInput === 'right' || thisInput === 'r') {
				if (isOpening()) {
					openDoorDirection('r');
					return true;
				}
				gameInput(null);
				moveRight();
			}
			else if (thisInput === 'left' || thisInput === 'l') {
				if (isOpening()) {
					openDoorDirection('l');
					return true;
				}
				gameInput(null);
				moveLeft();
			}
			else if (thisInput === 'up' || thisInput === 'u') {
				if (isOpening()) {
					openDoorDirection('u');
					return true;
				}
				gameInput(null);
				moveUp();
			}
			else if (thisInput === 'down' || thisInput === 'd') {
				if (isOpening()) {
					openDoorDirection('d');
					return true;
				}
				gameInput(null);
				moveDown();
			}
			else if (thisInput === '2' || thisInput === 'open') {
				gameInput(null);
				openDoor();
			} 
			else if (thisInput === '3' || thisInput === 'search') {
				gameInput(null);
				search();
			}
			else if (thisInput === '4' || thisInput === 'wield') {
				gameInput(null);
				wield();
			}
			else if (thisInput === '5' || thisInput === 'fight') {
				gameInput(null);
				fight();
			}
			else if (thisInput === '7' || thisInput === 'save') {
				gameInput(null);
				save();
			}
			else if (thisInput === '8' || thisInput === 'cast') {
				gameInput(null);
				useMagic();
			}
			else if (thisInput === '9' || thisInput === 'buy magic') {
				gameInput(null);
				buyMagic();
			}
			else if (thisInput === '10' || thisInput === 'load') {
				gameInput(null);
				loadDungeon(thisInput);
			}
			else if (thisInput === '11' || thisInput === 'buy hp') {
				gameInput(null);
				buyHP();
			}
			else if (thisInput === '0' || thisInput === 'pass') {
				gameInput(null);
				pass();
			}
			else {
				messageQueue.addMessage('COME ON', false);
				gameInput(null);
			}			
		}
	}

	function createPlayerOnMap() {
		if (map()) {
			var startPosition = datacontext.findPlayerStart(map().id());
			if (!startPosition) {
				alert('NO PLAYER START POSITION FOUND ON THIS MAP!');
			} else {			
				datacontext.createPlayerPosition(player(), startPosition.x(), startPosition.y());
				if (player()) {
					var currentPosition = player().position();
					var thisTile = datacontext.getTileByCoord(null, currentPosition.x(), currentPosition.y(), map().id());
					if (thisTile) {
						thisTile.image('U');
						thisTile.occupied(true);
					}
				}		
			}
		}
	}

	function moveUp() {
		var currentPosition = player().position();
		movePlayer(currentPosition.x(), currentPosition.y() - 1);
	}

	function moveDown() {
		var currentPosition = player().position();
		movePlayer(currentPosition.x(), currentPosition.y() + 1);
	}

	function moveRight() {
		var currentPosition = player().position();
		movePlayer(currentPosition.x() + 1, currentPosition.y());
	}

	function openDoor() {
		// Ask which door to open
		messageQueue.addMessage('DOOR LEFT RIGHT UP OR DOWN', true);
		isOpening(true);
	}

	function openDoorDirection(dir) {
		var thisPlayerPosition = player().position();
		if (dir === 'd') {
			checkOpenDoor(thisPlayerPosition.x(), thisPlayerPosition.y() + 1);
		} else if (dir === 'u') {
			checkOpenDoor(thisPlayerPosition.x(), thisPlayerPosition.y() - 1);
		} else if (dir === 'l') {
			checkOpenDoor(thisPlayerPosition.x() - 1, thisPlayerPosition.y());
		} else if (dir === 'r') {
			checkOpenDoor(thisPlayerPosition.x() + 1, thisPlayerPosition.y());
		}
	}

	function checkOpenDoor(newX, newY) {
		if (player()) {
			var currentPosition = player().position();
			var newTile = datacontext.getTileByCoord(null, newX, newY, map().id());
			// Check for obstruction
			if (newTile) {
				if (checkIfDoor(newTile)) {
					clearTile(newTile);
					isOpening(false);
					gameInput(null);
				} else {
					messageQueue.addMessage('THERE ISNT A DOOR THERE...', false);
				}
			}
		}		
	}

	function checkIfDoor(tile) {
		if (tile.item() && tile.item().name() === 'DOOR') {
			return true;
		} else {
			return false;
		}
	}

	function save() {
		datacontext.saveMapsAndTiles();
	}

	function search() {
		// Ask which door to open
		messageQueue.addMessage('SEARCH.........SEARCH.........SEARCH.........', false);
		isSearching(true);
	}

	function useMagic() {
		// Ask which door to open
		gameMessage("MAGIC");
		if (player().weapon()) {
			messageQueue.addMessage('YOU CANT USE MAGIC WITH WEAPON IN HAND', false);
		} else {
			messageQueue.addMessage('YOU CANT USE MAGIC WITH WEAPON IN HAND', false);
		}
	}

	function buyMagic() {
		// Ask which door to open
		if (player().classType().name() === 'FIGHTER') {
			messageQueue.addMessage('YOU CANT BUY ANY', false);
		} else {
			// else ask it what to buy or something
			messageQueue.addMessage('BUY WHICH', false);
			isBuyingMagic(true);
		}
	}

	function buyHP() {
		// Ask how much HP
		messageQueue.addMessage('HOW MANY 200 GP. EACH', false);
		isBuyingHP(true);
	}

	function fight() {
		var thisWeapon = player().weapon();
		// Ask what to fight
		if (thisWeapon) {
			messageQueue.addMessage("YOUR WEAPON IS " + thisWeapon.name(), false);
			var enemyTile = findEnemy();
			var playerTile = findPlayer();
			var dist = getDistanceBetweenTiles(playerTile, enemyTile);
			if (dist > thisWeapon.range()) {
				messageQueue.addMessage("ENEMY IS TOO FAR AWAY", false);
			} else {
				isFighting(true);
				// set isFighting to true which makes monster chase you and attack
				if (thisWeapon.range() > 1) {
					// If using bow
					if (thisWeapon.name() === 'BOW') {
						// Check for arrows
						var arrows = ko.utils.arrayFirst(player().items(), function (item) {
							return item.name() === 'ARROWS';
						});
						if (arrows && arrows.quantity() > 0) {
							// Attack with range
							attackLoop(thisWeapon);
							arrows.quantity(arrows.quantity() - 1);
						} else {
							messageQueue.addMessage("YOU DONT HAVE ANY ARROWS", false);
						}
					} else {
						// It's not a bow, throw it!
						attackLoop(thisWeapon);
						player().weapons.remove(attackLoop);
						player().weapon(null);
					}
					// If weapon has range > 1 throw it and it hits ground
				} else {
					attackLoop(thisWeapon);
					// Attack melee
				}
			}
		} else {
			messageQueue.addMessage("YOU DONT HAVE A WEAPON IN HAND", false);
		}
	}

	function attackLoop(thisWeapon) {
		var enemyName = enemy().name();
		gameMessage(enemyName);
		messageQueue.addMessage("HP = " + enemy().hitPoints(), false);
		messageQueue.addMessage("SWING ", false);
		var hitChance = makeRandom(1,2);
		hitChance = hitChance == 1 ? true : false;
		if (hitChance) {
			// Hit the enemy
			messageQueue.addMessage("HIT ENEMY ", false);
			enemy().hitPoints(enemy().hitPoints() - thisWeapon.damage());
			if (enemy().hitPoints() < 1) {
				// Enemy is dead
				messageQueue.addMessage("KILLED " + enemy().name(), false);
				// Give the player the gold from this monster
				var goldReward = enemy().value();
				player().gold(player().gold() + goldReward);
				messageQueue.addMessage("GOT " + goldReward + " GOLD FROM ENEMY", false);
				isFighting(false);
				//Go get another enemy
				killEnemy();
				createEnemy();
			}
		} else {
			// Missed						
			messageQueue.addMessage("MISSED TOTALY", false);
		}
	}

	function makeRandom(min, max) {
	  return Math.round(Math.random() * (max - min) + min);
	}

	function createEnemy() {
		if (map()) {
			enemy(datacontext.createComplexType('TileEnemy', { name: 'GOBLIN', hitPoints: 10, damage: 1 }));
			var enemyPosition = datacontext.findEnemy(map().id());
			// If enemyPosition is empty there are no more monsters
			if (enemyPosition) {				
				datacontext.createEnemyPosition(enemy(), enemyPosition.x(), enemyPosition.y());
				if (enemy()) {
					var currentPosition = enemy().position();
					var thisTile = datacontext.getTileByCoord(null, currentPosition.x(), currentPosition.y(), map().id());
					if (thisTile) {
						thisTile.image('E');
						thisTile.occupied(true);
	        			thisTile.enemy(enemy());
					}
				}	
			} else {
				messageQueue.addMessage("YOU HAVE CLEARED THE DUNGEON OF MONSTERS", false);
			}
		}		
	}

	function getDistanceBetweenTiles(tile1, tile2) {
		var xdist = Math.abs(tile1.x() - tile2.x());
		var ydist = Math.abs(tile1.y() - tile2.y());
		var returnDist = xdist > ydist ? xdist : ydist
		return returnDist;
	}

	function findPlayer() {		
		var thisTile;
		if (player()) {
			var currentPosition = player().position();
			thisTile = datacontext.getTileByCoord(null, currentPosition.x(), currentPosition.y(), map().id());
		}
		return thisTile;
	}

	function findEnemy() {
		if (enemy()) {
			var currentPosition = enemy().position();
			var thisTile = datacontext.getTileByCoord(null, currentPosition.x(), currentPosition.y(), map().id());
			return thisTile;
		}
		return null;
	}

	function loadDungeon() {
		isLoading(true);
		messageQueue.addMessage("ENTER DUNGEON #", true);
	}

	function wield() {
		// Ask which weapon to hold
		messageQueue.addMessage("WHICH WEAPON WILL YOU HOLD, NUM OF WEAPON", true);
		isWielding(true);
	}

	function moveLeft() {
		var currentPosition = player().position();
		movePlayer(currentPosition.x() - 1, currentPosition.y());
	}

	function movePlayer(newX, newY) {
		if (player()) {
			var currentPosition = player().position();
			var oldTile = datacontext.getTileByCoord(null, currentPosition.x(), currentPosition.y(), map().id());
			var newTile = datacontext.getTileByCoord(null, newX, newY, map().id());
			// Check for obstruction
			if (newTile) {
				if (!checkIfOccupied(newTile)) {
					clearTile(oldTile);
					checkForItem(newTile);
					occupyTile(newTile);
				}
			}
		}
	}

	function checkForItem(tile) {
		if (tile.item() && tile.item().name()) {
			var thisItem = tile.item();
			messageQueue.addMessage('FOUND A ' + thisItem.name() + ' ITEM!', true);
			tile.item().id(null);
			tile.item().name(null);
			tile.item().value(null);
			if (thisItem.value()) {
				player().gold(player().gold() + thisItem.value());
			}
		} else {
			gameMessage('ENTER COMMAND');
		}
	}

	function checkIfOccupied (tile) {
		return tile.occupied();
	}

	function clearTile (tile) {
		tile.occupied(false);
		tile.image(" ");
		if (tile.item()) {
			tile.item().id(null);
			tile.item().name(null);
			tile.item().value(null);			
		}		
		if (tile.enemy() && tile.enemy().id()) {
			tile.enemy().id(null);
			tile.enemy().name(null);
			tile.enemy().hitPoints(null);
			// Remove his position as well
			tile.enemy().position().x(null);
			tile.enemy().position().y(null);
		}
	}

	function killEnemy () {
		// Remove TileEnemy from game
		var thisEnemyTile = findEnemy();
		clearTile(thisEnemyTile);
	}

	function occupyTile (tile) {
		tile.occupied(true);
		tile.image("U");
		player().position().x(tile.x());
		player().position().y(tile.y());
	}
});