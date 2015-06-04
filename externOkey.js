var _ = require('underscore');
var tileNumRange = 4;
var nColors = 4;
/*
console.log(startState);
var action1 = {draw: "pile", discard: 2};
var othersHand = [{value: 1, color: 1}, {value: 3, color: 2}, {value: 2, color: 1}, {value: 3, color: 3}];
var nextState = applyOthersAction(startState, action1, othersHand);
console.log(nextState);
*/

function arrInsert(arr, index, item) {
    arr.splice(index, 0, item);
    return arr;
}

function tileSearch(arr, target) {
    for (var xx = 0; xx < arr.length; xx++) {
        if (sameTile(arr[xx], target)) {
            return xx;
        }
    }
    return -1;
}

function arrRemove(arr, index) {
    arr.splice(index,1);
    return arr;
}


function sameTile(tile1, tile2) {
    return (tile1.value === tile2.value && tile1.color === tile2.color);
}


function applyOthersAction(state, action, othersHand) {
    var newState = {};
    if(action.draw === "pile") {
        // If the other player draws from the pile, remove that tile from the pile
        var drawnTile = state.myDiscardPile.pop();
        // Now we know that the other player has this tile.
        state.inOthersHand.push(drawnTile);
    }
    newState.myDiscardPile = state.myDiscardPile;
    newState.hand = state.hand;
    newState.knownInMyHand = state.knownInMyHand;
    var discardedTile = othersHand[action.discard];
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

function buildUnknowns(state) {
    var unks = generateAllTiles();
    var arrs = [state.hand, state.myDrawPile, state.myDiscardPile, state.inOthersHand];
    for(var arrInd = 0; arrInd < arrs.length; arrInd++) {
        for(var i=0; i < arrs[arrInd].length; i++) {
            unks = arrRemove(unks, tileSearch(unks, arrs[arrInd][i]));
        }
    }
    return _.difference(generateAllTiles(), state.hand, state.myDrawPile, state.myDiscardPile, state.inOthersHand);
}


function win(state) {
    return validHand(state.hand);    
}

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

function generateAllTiles() {
    var allTiles = _.flatten(_.map(_.range(tileNumRange), function(num) { return _.map(_.range(nColors), function(col){return {value: num, color: col};});}));
    return allTiles.concat(allTiles);
}

function generateStartState() {
    var state1 = {
        hand: [{value: 0, color: 0},
               {value: 1, color: 0},
               {value: 2, color: 0},
               {value: 2, color: 0}],
        myDrawPile: [{value: 3, color: 0}],
        myDiscardPile: [{value: 0, color: 2}],
        inOthersHand: [{value: 1, color: 1},
                       {value: 2, color: 1},
                       {value: 3, color: 2}],
        knownInMyHand: [{value: 0, color: 0},
                        {value: 0, color: 1}],
        unknownLocation: []
    };
    state1.unknownLocation = buildUnknowns(state1);
    
    return state1;
}

module.exports = {
    generateStartState: generateStartState,
    applyOthersAction: applyOthersAction,
    buildUnknowns: buildUnknowns,
    win: win,
    tileSearch: tileSearch
}; 