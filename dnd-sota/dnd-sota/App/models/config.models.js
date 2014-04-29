﻿define([],
	function () {

	    var DT = breeze.DataType;

	    // Expose the model module to the requiring modules
	    var model = {
	        initialize: initialize
	    };
	    return model;

	    // Initialize the entity models in the entity manager
	    function initialize(metadataStore) {

	        // Item
	        metadataStore.addEntityType({
	            shortName: "Item",
	            namespace: "DndSota",
	            autoGeneratedKeyType: breeze.AutoGeneratedKeyType.Identity,
	            dataProperties: {
	                id: { dataType: "Int64", isPartOfKey: true },
	                name: { dataType: "String" },
	                quantity: { dataType: "Int64" },
	                value: { dataType: "Int64" },
	                canBuy: { dataType: "Boolean" }
	            }
	        });

	        // Attribute
	        metadataStore.addEntityType({
	            shortName: "Attribute",
	            namespace: "DndSota",
	            autoGeneratedKeyType: breeze.AutoGeneratedKeyType.Identity,
	            dataProperties: {
	                id: { dataType: "Int64", isPartOfKey: true },
	                name: { dataType: "String" },
	                value: { dataType: "Int64" }
	            }
	        });

	        // Weapon
	        metadataStore.addEntityType({
	            shortName: "Weapon",
	            namespace: "DndSota",
	            autoGeneratedKeyType: breeze.AutoGeneratedKeyType.Identity,
	            dataProperties: {
	                id: { dataType: "Int64", isPartOfKey: true },
	                name: { dataType: "String" },
	                damage: { dataType: "Int64" },
	                value: { dataType: "Int64" },
	                playerId: { dataType: "Int64" }
	            },
	            navigationProperties: {
					player: {
						entityTypeName: "Character", isScalar: true,
						associationName: "Character_Weapons", foreignKeyNames: ["playerId"]
					}	            	
	            }
	        });

	        // Armor
	        metadataStore.addEntityType({
	            shortName: "Armor",
	            namespace: "DndSota",
	            autoGeneratedKeyType: breeze.AutoGeneratedKeyType.Identity,
	            dataProperties: {
	                id: { dataType: "Int64", isPartOfKey: true },
	                name: { dataType: "String" },
	                defense: { dataType: "Int64" },
	                value: { dataType: "Int64" }
	            }
	        });
	        
	        // ClassType
	        metadataStore.addEntityType({
	            shortName: "ClassType",
	            namespace: "DndSota",
	            autoGeneratedKeyType: breeze.AutoGeneratedKeyType.Identity,
	            dataProperties: {
	                id: { dataType: "Int64", isPartOfKey: true },
	                name: { dataType: "String" },
	                startingGold: { dataType: "Int64" }
	            }
	        });

	        // Map
	        metadataStore.addEntityType({
	            shortName: "Map",
	            namespace: "DndSota",
	            autoGeneratedKeyType: breeze.AutoGeneratedKeyType.Identity,
	            dataProperties: {
	                id: { dataType: "Int64", isPartOfKey: true },
	                name: { dataType: "String" }
	            },
	            navigationProperties: {
	            	tiles: {
						entityTypeName: "Tile", isScalar: false,
						associationName: "Map_Tiles"	            		
	            	}
	            }
	        });

	        // Tile
	        metadataStore.addEntityType({
	            shortName: "Tile",
	            namespace: "DndSota",
	            autoGeneratedKeyType: breeze.AutoGeneratedKeyType.Identity,
	            dataProperties: {
	                id: { dataType: "Int64", isPartOfKey: true },
	                name: { dataType: "String" },
	                mapId: { dataType: "Int64" },
	                occupied: { dataType: "Boolean" },
	                x: { dataType: "Int64" },
	                y: { dataType: "Int64" },
	                image: { dataType: "String" },
		            item: { complexTypeName: "TileItem:#DndSota", isScalar: true }
	            },
	            navigationProperties: {
	            	map: {
						entityTypeName: "Map", isScalar: true,
						associationName: "Map_Tiles", foreignKeyNames: ["mapId"]            		
	            	}
	            }
	        });

	        // Tile type
	        metadataStore.addEntityType({
	            shortName: "TileType",
	            namespace: "DndSota",
	            autoGeneratedKeyType: breeze.AutoGeneratedKeyType.Identity,
	            dataProperties: {
	                id: { dataType: "Int64", isPartOfKey: true },
	                name: { dataType: "String" },
	                image: { dataType: "String" },
	                designerImage: { dataType: "String" },
	            }
	        });

	        // Position complex type
	        metadataStore.addEntityType({
	            shortName: "Position",
	            namespace: "DndSota",
	            isComplexType: true,
	            dataProperties: {
	                x: { dataType: "Int64" },
	                y: { dataType: "Int64" }
	            }
	        });

	        // Tile item complex type
	        metadataStore.addEntityType({
	            shortName: "TileItem",
	            namespace: "DndSota",
	            isComplexType: true,
	            dataProperties: {
	            	id: { dataType: "Int64" },
	            	name: { dataType: "String" },
	            	value: { dataType: "Int64" }
	            }
	        });

	        // Character
	        metadataStore.addEntityType({
	            shortName: "Character",
	            namespace: "DndSota",
	            autoGeneratedKeyType: breeze.AutoGeneratedKeyType.Identity,
	            dataProperties: {
	                id: { dataType: "Int64", isPartOfKey: true },
	                name: { dataType: "String" },
	                gold: { dataType: "Int64" },
	                strength: { dataType: "Int64" },
	                dexterity: { dataType: "Int64" },
	                constitution: { dataType: "Int64" },
	                charisma: { dataType: "Int64" },
	                wisdom: { dataType: "Int64" },
	                intellect: { dataType: "Int64" },
	                hitPoints: { dataType: "Int64" },
	                classTypeId: { dataType: "Int64" },
	                weaponId: { dataType: "Int64" },
		            position: { complexTypeName: "Position:#DndSota", isScalar: true }
	            },
	            navigationProperties: {
					classType: {
						entityTypeName: "ClassType", isScalar: true,
						associationName: "Character_ClassType", foreignKeyNames: ["classTypeId"]
					},
					weapon: {
						entityTypeName: "Weapon", isScalar: true,
						associationName: "Character_Weapon", foreignKeyNames: ["weaponId"]
					},
					weapons: {
						entityTypeName: "Weapon", isScalar: false,
						associationName: "Character_Weapons"
					},					
					items: {
						entityTypeName: "Item", isScalar: false,
						associationName: "Character_Item"
					}
	            }
	        });

	        metadataStore.registerEntityTypeCtor(
				'Map', null, mapInitializer);

	        function mapInitializer(map) {
			    var rowSort = function (l, r) { return (l.x() == r.x()) ? (l.x() > r.x() ? 1 : -1) : (l.x() > r.x() ? 1 : -1) };
	        	map.rows = ko.computed(function () {
	        		var theseTiles = map.tiles();
	        		var rowsArray = [];
	        		var finalRows = [];
	        		ko.utils.arrayForEach(theseTiles, function (tile) {
	        			// If the rows array doesn't have this row coord yet,
	        			if (rowsArray.indexOf(tile.y()) === -1) {
	        				// Add it
	        				rowsArray.push(tile.y());
	        			}
	        		});
	        		// For each row,
	        		ko.utils.arrayForEach(rowsArray, function (row) {
	        			// return each tile in the row
	        			var draftRow = ko.utils.arrayFilter(theseTiles, function (tile) {
	        				return row === tile.y();
	        			}).sort(rowSort);
	        			finalRows.push(draftRow);
	        		});
	        		return finalRows;
	        	}).extend({ throttle: 25 });
	        }
	    }

	});