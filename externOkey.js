/*
 * externOkey is the JS module that the WebPPL okey AI uses for deterministic computations
 
 */

var _ = require('underscore');
var tileNumRange = 4;
var nColors = 4;

/*
 * arrInsert inserts item at the index index of the array arr and returns a copy of the new
 * inserted array.
 */
function arrInsert(arr, index, item) {
    arr.splice(index, 0, item);
    return arr;
}

/* tileSearch searches the target tile in the array and returns the index of its first occurence
 * returns -1 if the tile target cannot be found in arr. Only works for tiles
 */
function tileSearch(arr, target) {
    for (var xx = 0; xx < arr.length; xx++) {
        if (sameTile(arr[xx], target)) {
            return xx;
        }
    }
    return -1;
}

/*
 * arrRemove takes an array arr and an index index, removes the element at that index and returns
 * an array that doesn't have that element.
 */
function arrRemove(arr, index) {
    arr.splice(index,1);
    return arr;
}

/*
 * sameTile takes in two tile objects and returns true if they have the same number and color.
 */
function sameTile(tile1, tile2) {
    return (tile1.value === tile2.value && tile1.color === tile2.color);
}

/*
 * applyOthersAction takes in a partial game state representing the current player's information
 * and the action the other player will take and the hand of the other player, and returns an updated
 * partial game state that represents the current player's information after that specific action is
 * taken.
 */
function applyOthersAction(state, action, othersHand) {
    var newState = {};
    if(action[0] === "pile") {
        // If the other player draws from the pile, remove that tile from the pile
        var drawnTile = state.myDiscardPile.pop();
        // Now we know that the other player has this tile.
        state.inOthersHand.push(drawnTile);
    }
    newState.myDiscardPile = state.myDiscardPile;
    newState.hand = state.hand.slice();
    newState.knownInMyHand = state.knownInMyHand;
    var discardedTile = othersHand[action[1]];
    state.myDrawPile.push(discardedTile);
    newState.myDrawPile = state.myDrawPile;
    if(tileSearch(state.inOthersHand, discardedTile) !== -1) {
        state.inOthersHand = arrRemove(state.inOthersHand, tileSearch(state.inOthersHand, discardedTile));
    } else {
        state.unknownLocation = arrRemove(state.unknownLocation, tileSearch(state.unknownLocation, discardedTile));
    }
    newState.inOthersHand = state.inOthersHand;
    newState.unknownLocation = state.unknownLocation;
    return newState;
}

/*
 * applyMyAction takes in a partial game state representing a player's information and the action they will take
 * as well as the index that they will draw from on the deck. Returns an updated partial game state after the player
 * takes the given action.
 */
function applyMyAction(state, action, drawIndex) {
        var newState = {};
        var drawnTile = {};
        var newHand = [];
        var newKnown = state.knownInMyHand.slice();
        if(action[0] === "pile") {
            drawnTile = state.myDrawPile.slice().pop();
            var newPile = state.myDrawPile.slice();
            newState.myDrawPile = newPile;
            newState.unknownLocation = state.unknownLocation.slice();
            newKnown.push(drawnTile);
        } else {
            drawnTile = state.unknownLocation[drawIndex];
            var newUnk = state.unknownLocation.slice();
            newUnk.splice(drawIndex, 1);
            newState.unknownLocation = newUnk;
            newState.myDrawPile = state.myDrawPile.slice();
        }
        newHand = state.hand.concat([drawnTile]);
        var discardedTile = newHand[action[1]];
        newHand = arrRemove(newHand, action[1]);
        newState.hand = newHand.slice();
        var newDiscardPile = state.myDiscardPile.slice();
        newDiscardPile.push(discardedTile);
        newState.myDiscardPile = newDiscardPile;
        if(tileSearch(newKnown, discardedTile) !== -1) {
            newKnown.splice(tileSearch(newKnown, discardedTile), 1);
        }
        newState.knownInMyHand = newKnown;
        newState.inOthersHand = state.inOthersHand.slice();
        return newState;        
    }

/*
 * buildUnknowns takes in a partial game state representing a player's information and
 * returns an array that contains all the tiles whose locations the player doesn't know
 */
function buildUnknowns(state) {
    var unks = generateAllTiles();
    var arrs = [state.hand, state.myDrawPile, state.myDiscardPile, state.inOthersHand];
    for(var arrInd = 0; arrInd < arrs.length; arrInd++) {
        for(var i=0; i < arrs[arrInd].length; i++) {
            unks = arrRemove(unks, tileSearch(unks, arrs[arrInd][i]));
        }
    }
    return unks;
}

// Returns true if the current state is a winning state for its player
function win(state) {
    return validHand(state.hand);    
}

/* helper function for hand validity. If the given tile can be grouped with the given
 * group of tiles, returns a possible grouping. Otherwise returns an empty array.
 */
function tryGroup(group, newTile) {
    group = group.slice(0);
    var origTile = newTile;
    var group0val = group[0].value;
    var group0col = group[0].color;
    var groupFval = group[group.length - 1].value;
    var groupFcol = group[group.length - 1].color;
    var groupType = "color";
    if (group.length === 1) {
        groupType = "both";
    } else if (group0col === groupFcol) {
        groupType = "consec";
    }
    if(groupType === "consec" || groupType === "both") {
        if (group0col === newTile.color && (newTile.value % tileNumRange) + 1 === group0val) {
            group = arrInsert(group, 0, origTile);
            return group;
        } else if (groupFcol === newTile.color && newTile.value === (groupFval) + 1) {
            group.push(origTile);
            return group;
        }
    }
    if ((groupType === "color" || groupType === "both") && (group0col !== newTile.color && group0val === newTile.value)) {
        for(var i=0; i<group.length; i++) {
            if(group[i].color === newTile.color) {
                return [];
            }
        }
        group.push(origTile);
        return group;
    }
    return [];
}

/*
 * Returns true if the current hand is a valid hand(meaning all tiles can be grouped in groups of size >)
function validHand(hand) {
    if (hand.length === 0) {
        return true;
    }
    var handCopy = hand.slice(0);
    var firstCard = handCopy.pop();
    var firstGroup = [firstCard];
    for (var i = 0; i < handCopy.length; i++) {
        var groupCopy = firstGroup.slice(0);
        groupCopy = tryGroup(groupCopy, handCopy[i]);
        if (groupCopy.length > 0) {
            var nextHandCopy = handCopy.slice(0);
            nextHandCopy = arrRemove(nextHandCopy, i);
            if (validGrouping(groupCopy, nextHandCopy)) {
                return true;
            }
        }
    }
    return false;
}

/*
 * Returns true if all of the otherTiles can either be grouped on their own
 * or be added to the current group.
 */
function validGrouping(curGroup, otherTiles) {
    if (curGroup.length > 2 && validHand(otherTiles)) {
        return true;
    }
    for (var i = 0; i < otherTiles.length; i++) {
        var groupCopy = curGroup.slice(0);
        groupCopy = tryGroup(groupCopy, otherTiles[i]);
        if (groupCopy.length > 0) {
            var restCopy = otherTiles.slice(0);
            restCopy = arrRemove(restCopy, i);
            if (validGrouping(groupCopy, restCopy)) {
                return true;
            }
        }
    }
    return false;
}

/*
 * Builds the partial game state representing the other player's information
 * given the partial game state representing this player's information
 * and this player's guess of the other player's hand.* and this player's guess of the other player's hand.
 */
function buildOthersState(thisState, othersHand) {
    var otherPlayerState = {};
    otherPlayerState.hand = othersHand;
    otherPlayerState.myDrawPile = thisState.myDiscardPile;
    otherPlayerState.myDiscardPile = thisState.myDrawPile;
    otherPlayerState.inOthersHand = thisState.knownInMyHand;
    otherPlayerState.knownInMyHand = thisState.inOthersHand;
    otherPlayerState.unknownLocation = buildUnknowns(otherPlayerState);
    return otherPlayerState;
}

/*
 * Returns an array that contains every single tile in the game.
 */
function generateAllTiles() {
    var allTiles = _.flatten(_.map(_.range(tileNumRange), function(num) { return _.map(_.range(nColors), function(col){return {value: num, color: col};});}));
    return allTiles;
}

// Generates a start state
function generateStartState() {
    var state1 = {
        hand: [{value: 0, color: 0},
               {value: 1, color: 0},
               {value: 2, color: 0},
               {value: 3, color: 1}],
        myDrawPile: [{value: 3, color: 0}],
        myDiscardPile: [{value: 0, color: 2}],
        inOthersHand: [{value: 1, color: 1},
                       {value: 2, color: 1},
                       {value: 3, color: 2}],
        knownInMyHand: [{value: 0, color: 0},
                        {value: 1, color: 0}],
        unknownLocation: []
    };
    state1.unknownLocation = buildUnknowns(state1);
    
    return state1;
}

module.exports = {
    generateStartState: generateStartState,
    applyMyAction: applyMyAction,
    applyOthersAction: applyOthersAction,
    buildOthersState: buildOthersState,
    win: win,
    tileSearch: tileSearch
}; 