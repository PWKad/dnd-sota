﻿	define(['services/datacontext', 'services/map.creator'], function (datacontext, mapCreator) {

	var weapons = ko.observableArray([	
		datacontext.createEntity('Weapon', { id: 1, name: 'SWORD', damage: 5, value: 10, range: 1 } ),
		datacontext.createEntity('Weapon', { id: 2, name: '2-H-SWORD', damage: 5, value: 15, range: 1 } ),
		datacontext.createEntity('Weapon', { id: 3, name: 'DAGGER', damage: 3, value: 3, range: 3 } ),
		datacontext.createEntity('Weapon', { id: 4, name: 'MACE', damage: 6, value: 15, range: 1 } ),
		datacontext.createEntity('Weapon', { id: 5, name: 'SPEAR', damage: 7, value: 15, range: 5 } ),
		datacontext.createEntity('Weapon', { id: 6, name: 'BOW', damage: 3, value: 15, range: 5 } )
	]);

	var enemyTypes = ko.observableArray([	
		datacontext.createEntity('EnemyType', { id: 1, image: 'G', name: 'GOBLIN', level: 1, hitPoints: 13, damage: 5, value: 500, range: 1 } ),
		datacontext.createEntity('EnemyType', { id: 2, image: 'T', name: 'TROLL', level: 1, hitPoints: 15, damage: 5, value: 1000, range: 1 } ),
		datacontext.createEntity('EnemyType', { id: 3, image: 'S', name: 'SKELETON', level: 1, hitPoints: 22, damage: 5, value: 50, range: 1 } ),
		datacontext.createEntity('EnemyType', { id: 4, image: 'B', name: 'BALROG', level: 1, hitPoints: 18, damage: 5, value: 5000, range: 1 } ),
		datacontext.createEntity('EnemyType', { id: 5, image: 'J', name: 'OCHRE JELLY', level: 1, hitPoints: 11, damage: 5, value: 0, range: 1 } ),
		datacontext.createEntity('EnemyType', { id: 6, image: 'O', name: 'GREY OOZE', level: 1, hitPoints: 11, damage: 5, value: 0, range: 1 } ),
		datacontext.createEntity('EnemyType', { id: 7, image: 'N', name: 'GNOME', level: 1, hitPoints: 13, damage: 5, value: 100, range: 1 } ),
		datacontext.createEntity('EnemyType', { id: 8, image: 'K', name: 'KOBOLD', level: 1, hitPoints: 15, damage: 5, value: 500, range: 1 } ),
		datacontext.createEntity('EnemyType', { id: 9, image: 'M', name: 'MUMMY', level: 1, hitPoints: 16, damage: 5, value: 100, range: 1 } )
	]);

	var armors = ko.observableArray([
		datacontext.createEntity('Armor', { name: 'LEATHER MAIL', defense: 1, value: 15 } ),
		datacontext.createEntity('Armor', { name: 'CHAIN MAIL', defense: 1, value: 30 } ),
		datacontext.createEntity('Armor', { name: 'TLTE MAIL', defense: 1, value: 50 } )
	]);

	// var spells = ko.observableArray([
	// 	datacontext.createEntity('Spell', { name: 'KILL', damage: 1, value: 15, range: 1 } ),
	// 	datacontext.createEntity('Spell', { name: 'MAGIC MISSLE', damage: 1, value: 15, range: 1 } ),
	// 	datacontext.createEntity('Spell', { name: 'CURE LIGHT', damage: 0, value: 15, range: 1 } ),
	// 	datacontext.createEntity('Spell', { name: 'FIND TRAPS', damage: 0, value: 15, range: 1 } ),
	// 	datacontext.createEntity('Spell', { name: 'MAGIC MISSLE', damage: 1, value: 15, range: 1 } ),
	// 	datacontext.createEntity('Spell', { name: 'MAGIC MISSLE', damage: 1, value: 15, range: 1 } ),
	// 	datacontext.createEntity('Spell', { name: 'CURE LIGHT', damage: 0, value: 15, range: 1 } ),
	// 	datacontext.createEntity('Spell', { name: 'FIND SECRET DOORS', damage: 0, value: 15, range: 1 } ),
	// 	datacontext.createEntity('Spell', { name: 'PUSH', damage: 1, value: 15, range: 1 } )
	// ]);

	var tileTypes = ko.observableArray([
		datacontext.createEntity('TileType', { name: 'WALL', designerImage: '*', image: '*' } ),
		datacontext.createEntity('TileType', { name: 'EMPTY', designerImage: '.', image: ' '} ),
		datacontext.createEntity('TileType', { name: 'GOLD', designerImage: '$', image: '$'  } ),
		datacontext.createEntity('TileType', { name: 'ENEMY', designerImage: 'E', image: 'E'  } ),
		datacontext.createEntity('TileType', { name: 'DOOR', designerImage: 'D', image: 'D'  } ),
		datacontext.createEntity('TileType', { name: 'LINE END', designerImage: ',', image: ' '  } )
	]);

	var classTypes = ko.observableArray([	
		datacontext.createEntity('ClassType', { name: 'FIGHTER', startingGold: 8 } ),
		datacontext.createEntity('ClassType', { name: 'CLERIC', startingGold: 4 } ),
		datacontext.createEntity('ClassType', { name: 'WIZARD', startingGold: 6 } )
	]);

	var attributes = ko.observableArray([
		datacontext.createEntity('Attribute', { name: 'STRENGTH' } ),
		datacontext.createEntity('Attribute', { name: 'DEXTERITY' } ),
		datacontext.createEntity('Attribute', { name: 'CON' } ),
		datacontext.createEntity('Attribute', { name: 'CHAR' } ),
		datacontext.createEntity('Attribute', { name: 'WISDOM' } ),
		datacontext.createEntity('Attribute', { name: 'INTELLECT' } )
	]);

	var items = ko.observableArray([	
		datacontext.createEntity('Item', { id: 7, name: 'ROPE', value: 1, canBuy: true } ),
		datacontext.createEntity('Item', { id: 8, name: 'SPIKES', value: 1, canBuy: true } ),
		datacontext.createEntity('Item', { id: 9, name: 'FLASK OF OIL', value: 2, canBuy: true } ),
		datacontext.createEntity('Item', { id: 10, name: 'SILVER CROSS', value: 25, canBuy: true } ),
		datacontext.createEntity('Item', { id: 11, name: 'SPARE FOOD', value: 5, canBuy: true } ),
		datacontext.createEntity('Item', { id: 12, name: 'ARROWS', value: 15, quantity: 15, canBuy: true } ),
		datacontext.createEntity('Item', { id: 13, name: 'GOLD', value: 25, canBuy: false } ),
		datacontext.createEntity('Item', { id: 14, name: 'DOOR', value: 0, canBuy: false } )
	]);

	var goldItem = items()[6];

	var maps = ko.observableArray([	
		datacontext.createEntity('Map', { id: 1, name: 'DND1' } )
	]);

	var firstMap = {
		id: 5,
		name: "First map test",
		layout: "*******,*U    *,*     *,*** ***,*     *,*     *,*******"
	}

	var thirdMap = {
		id: 3,
		name: "Third",
		layout: "*******,*U    *,*    $*,*** ***,*     *,*    $*,*******"
	}

	var secondMap = {
		id: 2,
		name: "Second",
		layout: "**************,*U...........*,*......E....$*,**D***..******,D............*,*....E......$*,*..***********,*....****....*,*....****....*,*............*,**************"
	}

	var fourthMap = {
		id: 4,
		name: "Fourth map",
		layout: "***************................*************************,*.U...........*................*.......................*,*.............*................*.......................*,*........E....*................*.......................*,*.............*.........E......*.......................*,*.............*................*.......................*,*.............******************.......................*,*........................*$............................*,*............$...........*.............................*,****************.........*...........*****************D*,*..............*.........D...........*...............E.*,*..............*.........*...........*...E.............*,*.............ED.........*...........*.................*,*$$$...........*.........*.....E.....*.........E.......*,*$$$...........*.........*...........*.......$.........*,********************************************************,"
	}

	mapCreator.createMap(firstMap);
	mapCreator.createMap(secondMap);
	mapCreator.createMap(thirdMap);
	mapCreator.createMap(fourthMap);

	var models = {
		weapons: weapons,
		armors: armors,
		classTypes: classTypes,
		attributes: attributes,
		items: items,
		maps: maps,
		tileTypes: tileTypes,
		// spells: spells,
		enemyTypes: enemyTypes,
		mapCreator: mapCreator
	};
	return models;

});