define(['services/session', 'services/datacontext', 'plugins/router', 'services/message.queue', 'services/game.objects'], function (session, datacontext, router, messageQueue, gameObjects) {

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
	var isCasting = ko.observable();
	var mapHeight = ko.observable(10);
	var mapWidth = ko.observable(10);
	var enemy = ko.observable();
	var needToHideMap = ko.observable(false);
	var isGameOver = ko.observable(false);
	var maps = ko.observableArray();
	var state = ko.observable(1);
	var classTypes = ko.computed(gameObjects.classTypes);
	var items = ko.computed(function () {
		var theseItems = [];
		theseItems = ko.utils.arrayFilter(gameObjects.items(), function (item) {
			return item.canBuy() === true;
		});
		return theseItems;
	});
	var weaponTypes = ko.computed(function () {
		var theseWeapons = gameObjects.weapons();
		theseWeapons = ko.utils.arrayFilter(theseWeapons, function (wep) {
			return wep.name() !== 'FISTS';
		});
		return theseWeapons;
	});
	var instructions = [
		new instruction('U', 'UP'),
		new instruction('D', 'DOWN'),
		new instruction('L', 'LEFT'),
		new instruction('R', 'RIGHT'),
		new instruction('2', 'OPEN DOOR'),
		new instruction('3', 'SEARCH'),
		new instruction('4', 'SWITCH WEAPON'),
		new instruction('5', 'FIGHT'),
		new instruction('6', 'LOOK'),
		new instruction('7', 'SAVE GAME'),
		new instruction('8', 'USE MAGIC'),
		new instruction('9', 'BUY MAGIC'),
		new instruction('10', 'LOAD DUNGEON'),
		new instruction('11', 'BUY HP'),
		new instruction('0', 'PASS')
	];

	function instruction(command, text) {
		var self = this;
		self.command = command;
		self.text = text;
	}

	var availableSpells = ko.computed(function () {
		var spellsList = gameObjects.spells();
		// Get a list of spells the player doesn't have
		var availablespellslist = ko.utils.arrayFilter(spellsList, function (spell) {
			return !spell.playerId();
		});
		return availablespellslist;
	});
	// Set the game message equal to the current message in the message queue
	var gameMessage = ko.computed(function () {
		var thisMessage = 'ENTER COMMAND';
		// If there is no map need a map number
		if (state() === 1) {
			thisMessage = 'CHOOSE GAME STYLE';
		} else if (state() === 2) {
			thisMessage = 'ENTER CHARACTER NAME';
		} else if (state() === 3) {
			thisMessage = 'CLASSIFICATION - WHICH DO YOU WANT TO BE';
		} else if (state() === 4) {
			thisMessage = 'BUYING WEAPONS - DONE WHEN FINISHED';
		} else if (state() === 5) {
			thisMessage = 'BUYING ITEMS - DONE WHEN FINISHED';
		} else if (state() === 6 && !map()) {
			thisMessage = 'ENTER DUNGEON # (4 IS AWESOME)';			
		} else {
			thisMessage = messageQueue.currentMessage() ? messageQueue.currentMessage().Message() : 'ENTER COMMAND';			
		}
		return thisMessage;
	});

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
			player(datacontext.createEntity('Character', {}));
			state(1);
			session.currentPlayer(player());
		}
		getMapsList();
	}

	var compositionComplete = function () {
		focusGameInput(true);
	};

	var game = {
		activate: activate,
		compositionComplete: compositionComplete,
		clickMap: clickMap,
		clickSpell: clickSpell,
		clickWeapon: clickWeapon,
		clickInstruction: clickInstruction,
		enterCommand: enterCommand,
		focusGameInput: focusGameInput,
		gameInput: gameInput,
		instructions: instructions,
		gameMessage: gameMessage,
		map: map,
		maps: maps,
		player: player,
		centeredMap: centeredMap,
		isGameOver: isGameOver,
		isCasting: isCasting,
		isWielding: isWielding,
		restartGame: restartGame,
		availableSpells: availableSpells,
		session: session,
		create: create,
		classTypes: classTypes,
		weaponTypes: weaponTypes,
		items: items,
		state: state,
		clickItem: clickItem
	};
	return game;

	function clickItem(sender) {
		if (state() === 1) {
			gameInput(sender);	
			enterCommand();
		} else if (state() === 2) {
			// Name entry, do nothing
		} else if (state() === 3) {
			var thisInput = sender;
			gameInput(thisInput);	
			enterCommand();
		} else if (state() === 4) {
			var thisInput = sender === 0 ? '0' : (ko.unwrap(sender) + 1).toString();
			gameInput(thisInput);
			enterCommand();
		} else if (state() === 5) {
			var thisInput = sender === 0 ? '0' :(ko.unwrap(sender) + 7).toString();
			gameInput(thisInput);
			enterCommand();
		}
	}

	function enterCommand() {
		if (gameInput()) {
			var thisInput = gameInput().toLowerCase();
			// If they hit 6 to show and it is on settings old,
			if (needToHideMap()) {
				session.settings().ShowMap(false);
				needToHideMap(false);
			}
			// Choosing old or new
			if (state() === 1) {
				// Check old or new
				if (thisInput === 'old') {
					// Set settings to old
					session.setSettingsOld();
					// Set state to 2
					state(2);
				} else if (thisInput === 'new') {
					// Set settings to old
					session.setSettingsNew();
					// Set state to 2
					state(2);
				}
			} else if (state() === 2) {
				create(thisInput);
			} else if (state() === 3) {
				// Choosing class
		        if (player()) {
		            var thisClass = ko.utils.arrayFirst(gameObjects.classTypes(), function (classobj) {
		                return classobj.name().toLowerCase() === thisInput.toLowerCase();
		            });
		            if (!thisClass) {
		            	className(null);
		            } else {
		            	player().classType(thisClass);
						datacontext.saveEntity(player());
						session.currentPlayer(player());
						state(4);
		            }
		        }
			} else if (state() === 4) {
				// Check if it is going to buy items instead now
				if (thisInput === '0' || thisInput === 'done') {
					// Add fists as a weapon
					var fists = ko.utils.arrayFirst(gameObjects.weapons(), function (wep) {
						return wep.name() === 'FISTS';
					});
					player().weapons.push(fists);
					player().weapon(fists);
					// Advance to purchase items
					state(5);
				}
				else {
					// Try to get the weapon by name first
		            var thisWeapon = ko.utils.arrayFirst(gameObjects.weapons(), function (weapon) {
		                return weapon.name().toLowerCase() === thisInput;
		            });
		            if (!thisWeapon) {
		            	// Try to get the weapon by id instead of name
		            	thisWeapon = ko.utils.arrayFirst(gameObjects.weapons(), function (weapon) {
			                return weapon.id() == thisInput;
			            });
			            if (!thisWeapon) {
			            	// Show no matching weapon message
			            }
		            }
		            if (thisWeapon) {
			            if (thisWeapon.value() > player().gold()) {
			            	// Show too expensive message
			        		alert('COSTS TOO MUCH TRY AGAIN!');
			        	} else {
			            	player().weapons.push(thisWeapon);
			            	player().gold(player().gold() - thisWeapon.value());
							datacontext.saveEntity(player());
			        	}	
		            }
				}
			} else if (state() === 5) {
				// Check if it is the exit code
				if (thisInput === '0' || thisInput === 'done') {				
	            	state(6);
				} else {
					// Try to get the weapon by name first
		            var thisItem = ko.utils.arrayFirst(items(), function (item) {
		                return item.name().toLowerCase() === thisInput;
		            });
		            if (!thisItem) {
		            	// Try to get the weapon by id instead of name
		            	thisItem = ko.utils.arrayFirst(items(), function (item) {
			                return item.id() == thisInput;
			            });
		            }
		            if (thisItem) {
			            if (thisItem.value() > player().gold()) {
			        		alert('COSTS TOO MUCH TRY AGAIN!');
			        	} else {
			            	player().items.push(thisItem);
			            	player().gold(player().gold() - thisItem.value());
							datacontext.saveEntity(player());
			        	}	            	
		            }					
				}
			} else if (state() === 6) {
				if (isWielding()) {
					var thisInt = parseInt(thisInput);
					if (!isNaN(thisInt)) {
						// If it is zero, remove the weapon
						if (thisInt === 0) {
							player().weapon(null);
						} else {
							var thisWeapon = player().weapons()[thisInt - 1];
							if (thisWeapon) {
								player().weapon(thisWeapon);
								messageQueue.addMessage('YOU HAVE EQUIPPED A ' + thisWeapon.name(), false);
							} else {
								messageQueue.addMessage('SORRY YOU DONT HAVE THAT WEAPON', false);
							}
						}
						gameInput(null);
						isWielding(false);
					}
				} 
				else if (isCasting()) {
					var thisInt = parseInt(thisInput);
					if (!isNaN(thisInt)) {
						var thisSpell = player().spells()[thisInt - 1];
						if (thisSpell) {
							player().spell(thisSpell);
							messageQueue.addMessage('YOU ARE CASTING ' + thisSpell.name(), false);
							castSpell();
						} else {
							messageQueue.addMessage('SORRY YOU DONT HAVE THAT SPELL', false);
						}
						gameInput(null);
					}
					isCasting(false);
				}
				else if (isBuyingMagic()) {
					var thisInt = parseInt(thisInput);
					if (!isNaN(thisInt)) {
						var thisSpell = ko.utils.arrayFirst(gameObjects.spells(), function (spell) {
							return spell.id() === thisInt;
						});
						if (thisSpell) {
							if (player().gold() > thisSpell.value()) {
								player().gold(player().gold() - thisSpell.value());
								player().spells.push(thisSpell);
								messageQueue.addMessage('YOU PURCHASED ' + thisSpell.name(), false);
							} else {
								messageQueue.addMessage('YOU CANT AFFORD ' + thisSpell.name(), false);
							}
						} else {
							messageQueue.addMessage('SORRY SPELL DOESNT EXIST', false);
						}
						gameInput(null);
					}
					isBuyingMagic(false);
				} 
				else if (isBuyingHP()) {
					var thisInt = parseInt(thisInput);
					if (!isNaN(thisInt) && thisInt > 0) {
						var thisCost = thisInt * 200;
						// If the player has enough gold,
						if (player().gold() > thisCost) {
							// Reduce the players gold and add HP
							player().gold(player().gold() - thisCost);
							player().hitPoints(player().hitPoints() + (thisInt * 5));
							messageQueue.addMessage('PURCHASED ' + thisInt + ' HP', false);
						} else {
							messageQueue.addMessage('YOU CANT AFFORD THAT ', false);
						}
					}
					gameInput(null);
					isBuyingHP(false);
				}
				else if (!map() || isLoading()) {
					datacontext.getMap(map, thisInput);
					if (!map()) {
						alert('MAP NOT FOUND!');
					}
					createPlayerOnMap();
					createEnemy();
					checkForArmor();
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
				else if (thisInput === '6' && session.settings().Old()) {
					gameInput(null);
					session.settings().ShowMap(true);
					needToHideMap(true);
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
				else if (thisInput === '20') {
					if (session.settings().ShowMap()) {
						session.setSettingsOld();
					} else {					
						session.setSettingsNew();
					}
					gameInput(null);
				}
				else {
					messageQueue.addMessage('COME ON', false);
					gameInput(null);
				}
				if (isFighting()) {
					// Have the monster attack the player
					monsterAttackPlayer();
					// Check if the player died
					checkIfPlayerIsAlive();
				}
				checkIfEnemyClose();
			}
			gameInput(null);
			focusGameInput(true);
		}
	}

	function create (name) {
		if (player() && name) {
			player().name(name.toUpperCase());
			if (name.toLowerCase() === 'shavs') {
				datacontext.saveEntity(player());
				state(3);
				player().strength(makeRandom(15, 15));
				player().dexterity(makeRandom(15, 15));
				player().constitution(makeRandom(15, 15));
				player().charisma(makeRandom(15, 15));
				player().wisdom(makeRandom(15, 15));
				player().intellect(makeRandom(15, 15));
				player().gold(makeRandom(15,15)*15);
				player().hitPoints(makeRandom(16, 16));
				return true;
			} else {
				datacontext.saveEntity(player());
				state(3);
				player().strength(makeRandom(1, 15));
				player().dexterity(makeRandom(1, 15));
				player().constitution(makeRandom(1, 15));
				player().charisma(makeRandom(1, 15));
				player().wisdom(makeRandom(1, 15));
				player().intellect(makeRandom(1, 15));
				player().gold(makeRandom(10,15)*15);
				// At least give em a chance for now
				player().hitPoints(makeRandom(2, 8) + 10);
			}
		}
	}

	function clickInstruction(sender) {
		if (sender && sender.command) {
			gameInput(sender.command);
			enterCommand();
		} else {
			console.log('No sender');
		}
	}

	function clickMap(sender) {
		var unwrappedSender = (ko.unwrap(sender)).toString();
		if (!!unwrappedSender) {
			gameInput(unwrappedSender);
			enterCommand();
		} else {
			console.log('No map sender');
		}
	}

	function clickSpell(sender) {
		var unwrappedSender = (ko.unwrap(sender) + 1).toString();
		if (!!unwrappedSender && isCasting()) {
			gameInput(unwrappedSender);
			enterCommand();
		} else {
			console.log('No spell sender');
		}
	}

	function clickWeapon(sender) {
		var unwrappedSender = (ko.unwrap(sender) + 1).toString();
		if (!!unwrappedSender && isWielding()) {
			gameInput(unwrappedSender);
			enterCommand();
		} else {
			console.log('No spell sender');
		}
	}

	function getMapsList() {
		datacontext.getMapsList(maps);
	}

	function pass() {
		return true;
	}

	function checkForArmor() {
		// If there is a player and he has items,
		if (player() && player().items()) {
			// Look for armor in his items
			var thisArmor = ko.utils.arrayFirst(player().items(), function (item) {
				return item.name().indexOf('MAIL') !== -1;
			});
			if (thisArmor) {
				player().item(thisArmor);
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
		if (isFighting()) {
			var enemyPosition = enemy().position();
			// Chase the player
			moveEnemy(enemyPosition.x(), enemyPosition.y() - 1);
		}
	}

	function moveDown() {
		var currentPosition = player().position();
		movePlayer(currentPosition.x(), currentPosition.y() + 1);
		if (isFighting()) {
			var enemyPosition = enemy().position();
			// Chase the player
			moveEnemy(enemyPosition.x(), enemyPosition.y() + 1);
		}
	}

	function moveRight() {
		var currentPosition = player().position();
		movePlayer(currentPosition.x() + 1, currentPosition.y());
		if (isFighting()) {
			var enemyPosition = enemy().position();
			// Chase the player
			moveEnemy(enemyPosition.x() + 1, enemyPosition.y());
		}
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
					isOpening(false);
					gameInput(null);
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
		//gameMessage("MAGIC");
		if (player().weapon() && player().weapon().name() !== 'FISTS') {
			messageQueue.addMessage('YOU CANT USE MAGIC WITH WEAPON IN HAND', false);
		} else if (player().classType().name().toLowerCase() === 'fighter') {
			messageQueue.addMessage('YOU CANT USE MAGIC YOUR NOT A MAGIC USER', false);
		} else {
			messageQueue.addMessage('WHICH SPELL?', false);
			isCasting(true);
		}
	}

	function castSpell() {
		var casted = true;
		var className = player().classType().name().toLowerCase().toLowerCase();
		if (className === 'cleric' || className ===  'wizard') {
			var thisSpell = player().spell();
			if (thisSpell.id() == 1) {
				// Cast kill
				casted = checkSpellRangeAndAttack(thisSpell);
			} else if (thisSpell.id()  == 2) {
				// Cast magic missle 2
				casted = checkSpellRangeAndAttack(thisSpell);
			} else if (thisSpell.id()  == 3) {
				// CAST cure light
				healLoop(thisSpell.damage());
			} else if (thisSpell.id()  == 4) {
				// CAST find traps
				messageQueue.addMessage('NO TRAPS FOUND!', false);
			} else if (thisSpell.id()  == 5) {
				// CAST magic missle 1
				casted = checkSpellRangeAndAttack(thisSpell);
			} else if (thisSpell.id()  == 6) {
				// CAST magic missle 3				
				casted = checkSpellRangeAndAttack(thisSpell);
			} else if (thisSpell.id()  == 7) {
				// CAST cure light
				healLoop(thisSpell.damage());
			} else if (thisSpell.id()  == 8) {
				// CAST find secret doors
				messageQueue.addMessage('NO SECRET DOORS FOUND!', false);
			} else if (thisSpell.id()  == 9) {
				// CAST push
				messageQueue.addMessage('WTF PUSH LOL...', false);
			}
			// If there is a spell remove it from the player
			if (thisSpell) {
				// Set spell to null
				player().spell(null);
				// If the spell was cast successfully,
				if (casted) {
					// Remove the spell since it is used already
					player().spells.remove(thisSpell);					
				}
			}
			// Player is no longer casting
			isCasting(false);
		}
	}

	function checkSpellRangeAndAttack(spell) {
		var enemyTile = findEnemy();
		var playerTile = findPlayer();
		var dist = getDistanceBetweenTiles(playerTile, enemyTile);
		if (dist > spell.range()) {
			messageQueue.addMessage("ENEMY IS TOO FAR AWAY FOR THIS SPELL", false);
			return false;
		} else {
			isFighting(true);
			attackLoop(spell, 'CASTING');
			return true;
		}
	}

	function healLoop (amountToHeal) {
		player().hitPoints(player().hitPoints() + amountToHeal);
		messageQueue.addMessage('HEALED.  NEW HP = ' + player().hitPoints(), false);
	}

	function buyMagic() {
		// Ask which door to open
		if (player().classType().name() === 'FIGHTER') {
			messageQueue.addMessage('YOU CANT BUY ANY', false);
		} else {
			// else ask it what to buy or something
			messageQueue.addMessage('BUY WHICH?', false);
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
			if (thisWeapon.name() === 'FISTS') {				
				messageQueue.addMessage("DO YOU REALIZE YOU ARE BARE HANDED!", false);
			} else {
				messageQueue.addMessage("YOUR WEAPON IS " + thisWeapon.name(), false);	
			}
			var enemyTile = findEnemy();
			var playerTile = findPlayer();
			if (playerTile && enemyTile) {
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
								attackLoop(thisWeapon, 'FIRED');
								arrows.quantity(arrows.quantity() - 1);
							} else {
								messageQueue.addMessage("YOU DONT HAVE ANY ARROWS", false);
							}
						} else {
							// It's not a bow, throw it!
							attackLoop(thisWeapon, 'THROWN');
							player().weapons.remove(thisWeapon);
							player().weapon(null);
						}
						// If weapon has range > 1 throw it and it hits ground
					} else {
						attackLoop(thisWeapon, 'SWING');
						// Attack melee
					}
				}				
			}
		} else {
			console.log('Problem');
		}
	}

	function attackLoop(thisWeapon, action) {
		var enemyName = enemy().name();
		messageQueue.addMessage(enemyName + ", HP = " + enemy().hitPoints() + ". " + action, false);
		var hitChance = makeRandom(1, 15);
		var hitSuccess = false;
		if (action === 'CASTING') {
			// It's magic, check if hitchance is less than intelligence
			hitSuccess = (hitChance < player().intellect());
		} else {
			// It's melee, check if hitchance is less than dexterity
			hitSuccess = (hitChance < player().dexterity());
		}
		if (hitSuccess) {
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
			// Find the next enemy spot
			var enemyPosition = datacontext.findEnemy(map().id());
			// If a tile is returned,
			if (enemyPosition) {
				// Get the enemy type
				var thisTilesEnemyType = enemyPosition.enemySpawnType();
				// Clear that tiles enemy type so it won't spawn again
				enemyPosition.enemySpawnType(null);
				enemyPosition.entityAspect.acceptChanges();
				// Create the enemy
				var thisEnemyType = ko.utils.arrayFirst(gameObjects.enemyTypes(), function (enemyType) {
					return enemyType.image() === thisTilesEnemyType;
				});
				if (thisEnemyType) {
					enemy(datacontext.createComplexType('TileEnemy', { name: thisEnemyType.name(), hitPoints: thisEnemyType.hitPoints(), damage: thisEnemyType.damage(), value: thisEnemyType.value(), image: thisEnemyType.image(), hitChanceMultiplier: thisEnemyType.hitChanceMultiplier() }));
					// If enemyPosition is empty there are no more monsters
					datacontext.createEnemyPosition(enemy(), enemyPosition.x(), enemyPosition.y());
					if (enemy()) {
						var currentPosition = enemy().position();
						var thisTile = datacontext.getTileByCoord(null, currentPosition.x(), currentPosition.y(), map().id());
						if (thisTile) {
							thisTile.image(enemy().image());
							thisTile.occupied(true);
		        			thisTile.enemy(enemy());
						}
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
		if (player().classType().name() === 'FIGHTER') {
		// Ask which weapon to hold
			messageQueue.addMessage("WHICH WEAPON WILL YOU HOLD, NUM OF WEAPON", true);
			isWielding(true);
		} else {
			messageQueue.addMessage("ONLY FIGHTERS CAN WIELD", true);
		}
	}

	function moveLeft() {
		var currentPosition = player().position();
		movePlayer(currentPosition.x() - 1, currentPosition.y());
		// If the player is fighting a monster
		if (isFighting()) {
			var enemyPosition = enemy().position();
			// Chase the player
			moveEnemy(enemyPosition.x() - 1, enemyPosition.y());
		}
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
					messageQueue.addMessage('YOU ARE AT (' + newTile.x() + ',' + newTile.y() + ')', false);
				}
			}
		}
	}

	function moveEnemy(newX, newY) {
		if (enemy()) {
			var playerTile = findPlayer();
			var enemyTile = findEnemy();
			if (getDistanceBetweenTiles(playerTile, enemyTile) > 1) {
				var currentPosition = enemy().position();
				var oldTile = datacontext.getTileByCoord(null, currentPosition.x(), currentPosition.y(), map().id());
				var newTile = datacontext.getTileByCoord(null, newX, newY, map().id());
				// Check for obstruction
				if (newTile) {
					if (!checkIfOccupied(newTile)) {
						// Move the tile enemy entity to the new tile
						var oldTileEnemy = oldTile.enemy();
						newTile.enemy(oldTileEnemy);
						clearTile(oldTile, true);
						enemyOccupyTile(newTile);
					}
				}
			}
		}
	}

	function checkForItem(tile) {
		if (tile.item() && tile.item().name()) {
			var thisItem = tile.item();
			messageQueue.addMessage('AH.......' + thisItem.name() + '.........', true);
			if (thisItem.name() === 'GOLD') {
				messageQueue.addMessage(thisItem.value() + ' PIECES', true);
			}
			if (thisItem.value()) {
				player().gold(player().gold() + thisItem.value());
			}
			tile.item().id(null);
			tile.item().name(null);
			tile.item().value(null);
		} else {
			// gameMessage('ENTER COMMAND');
		}
	}

	function checkIfOccupied (tile) {
		return tile.occupied();
	}

	function clearTile (tile, isEnemy) {
		tile.occupied(false);
		tile.image(" ");
		if (tile.item()) {
			tile.item().id(null);
			tile.item().name(null);
			tile.item().value(null);			
		}
		// If there is an enemy there and it is not the enemy clearing it,
		if (tile.enemy() && tile.enemy().id() && !isEnemy) {
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

	function enemyOccupyTile (tile) {
		tile.occupied(true);
		tile.image(enemy().image());
		enemy().position().x(tile.x());
		enemy().position().y(tile.y());
	}

	function checkIfEnemyClose() {	
		var enemyTile = findEnemy();
		var playerTile = findPlayer();
		if (playerTile && enemyTile) {			
			var dist = getDistanceBetweenTiles(playerTile, enemyTile);
			if (dist == 1) {
				messageQueue.addMessage(enemy().name() + ' WATCH IT', false);
				isFighting(true);
				// Do fight logic but with monster attack first
			}
		}
	}

	function monsterAttackPlayer() {
		// Check if the monster is close enough to attack
		if (checkIfMonsterIsInRange()) {
			// If so attack the player
			// Have the monster attack the player		
			var enemyName = enemy().name();
			var armorMultiplier = player().item() ? parseInt(player().item().defense()) : 0;
			var hitChance = makeRandom(1, (15 + enemy().hitChanceMultiplier()));
			var hitSuccess = false;
			// It's melee, check if hitchance is less than dexterity
			hitSuccess = (hitChance < (7 + armorMultiplier));
			if (hitSuccess) {
				// Hit the enemy
				messageQueue.addMessage(enemyName + ' SCORES A HIT', false);
				player().hitPoints(player().hitPoints() - enemy().damage());
			} else {
				// Missed
				messageQueue.addMessage("HE HIT YOU BUT NOT GOOD ENOUGH", false);
			}
		} else {
			// If not move him closer
			moveEnemyToPlayer();
		}		
	}

	function checkIfMonsterIsInRange() {
		var enemyTile = findEnemy();
		var playerTile = findPlayer();
		if (playerTile && enemyTile) {			
			var dist = getDistanceBetweenTiles(playerTile, enemyTile);
			if (dist != 1) {
				return false;
			} else {
				return true;
			}
		}
		return false;
	}

	function moveEnemyToPlayer() {		
		var enemyTile = findEnemy();
		var playerTile = findPlayer();
		if (enemyTile && playerTile) {
			var xdist = Math.abs(enemyTile.x() - playerTile.x());
			var ydist = Math.abs(enemyTile.y() - playerTile.y());
			var enemyPosition = enemy().position();
			if (xdist > ydist) {
				// Move in the x direction towards player
				xdist = enemyTile.x() - playerTile.x();
				if (xdist > 0) {
					// Move positive x
					moveEnemy(enemyPosition.x() - 1, enemyPosition.y());
				} else {
					// Move negative x
					moveEnemy(enemyPosition.x() + 1, enemyPosition.y());
				}
			} else {
				// Move in the y direction towards player
				ydist = enemyTile.y() - playerTile.y();
				if (ydist > 0) {
					// Move positive x
					moveEnemy(enemyPosition.x(), enemyPosition.y() - 1);
				} else {
					// Move negative x
					moveEnemy(enemyPosition.x(), enemyPosition.y() + 1);
				}
			}
		}
	}

	function checkIfPlayerIsAlive() {
		// Check if the player is still alive
		if (player().hitPoints() <= 0) {
			// Player has died
			messageQueue.addMessage("SORRY YOUR DEAD", false);
			var playerPosition = player().position();
			var oldTile = datacontext.getTileByCoord(null, playerPosition.x(), playerPosition.y(), map().id());
			clearTile(oldTile);
			gameOver();
			return false;
		} else if (player().hitPoints() <= 2) {
			messageQueue.addMessage("WATCH IT HP = " + player().hitPoints(), false);			
		}
		return true;
	}

	function gameOver() {
		isGameOver(true);
	}

	function restartGame() {
		// Restart the game
		location.reload();
	}
});