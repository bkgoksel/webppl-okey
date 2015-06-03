var HAND_LENGTH = 7;
var ALL_TILES = [];

var startState = {
    hand: [{val: 0, col: 0},
           {val: 0, col: 0},
           {val: 0, col: 0}],
    myDrawPile: [],
    myDiscardPile: [],
    inOthersHand: [],
    knownInMyHand: [],
    unknownLocation: []
};

var actionERP = function(state) {
    return Enumerate(function() {
        if(externOkey.win(state)) {
            return "WIN";
        } else {
            var actionSample = sample(actionPriorERP(state));
            var outcomeSample = sample(outcomeWithMainERP(state, actionSample));
            factor(externOkey.win(outcomeSample) ? 0 : -10);
            return actionSample;
        }
    });
};

var outcomeWithMainERP = function(state, action) {
    return Enumerate(function() {
        if(action == "WIN") {
            return state;
        } else {
            var newState = sample(applyActionERP(state, action));
            var othersState = sample(inferredStateERP(newState));
            var othersAction = sample(actionERP(othersState));
            return sample(outcomeWithOtherERP(newState, othersAction, othersState.hand));
        }
    });
};

var outcomeWithOtherERP = function(state, action, othersHand) {
    return Enumerate(function() {
        if(action == "WIN") {
            return state;
        } else {
            var newState = externOkey.applyOthersAction(state, action, othersHand);
            var newAction = sample(actionERP(newState));
            return sample(outcomeWithMainERP(newState, newAction));
        }
    });
};

var inferredStateERP = function(state) {
    return Enumerate( function() {
        var otherPlayerState = {};
        otherPlayerState.hand = sample(handERP(state.inOthersHand, state.unknownLocation, HAND_LENGTH - state.inOthersHand));
        otherPlayerState.myDrawPile = state.myDiscardPile;
        otherPlayerState.myDiscardPile = state.myDrawPile;
        otherPlayerState.inOthersHand = state.knownInMyHand;
        otherPlayerState.knownInMyHand = state.inOthersHand;
        otherPlayerState.unknownLocation = externOkey.buildUnknowns(otherPlayerState);
        return otherPlayerState;
    });
};

var handERP = function(curHand, possibleTiles, numNeededTiles) {
    return Enumerate(function() {
        if(numNeededTiles === 0) {
            return curHand;
        } else {
            var nextTileIndex = randomInteger(possibleTiles.length);
            var nextTile = possibleTiles[nextTileIndex];
            var nextPossibleTiles = possibleTiles;
            nextPossibleTiles.splice(nextTileIndex,1);
            var nextHand = curHand;
            nextHand.push(nextTile);
            return sample(handERP(nextHand, nextPossibleTiles, HAND_LENGTH - nextHand.length));
        }
    });
};

var actionPriorERP = function(state) {
    return Enumerate(function() {
        var action = {};
        action.draw = flip() ? "center" : "pile";
        action.discard = randomInteger(HAND_LENGTH + 1) - 1;
        return action; 
    });
};

var applyActionERP = function(state, action) {
    return Enumerate(function() {
        var newState;
        var drawnTile;
        var newHand;
        if(action.draw === "pile") {
            // If I draw from the draw pile, the last element is no longer on the draw pile.
            drawnTile = state.myDrawPile.pop();
            var newPile = state.myDrawPile;
            newState.myDrawPile = newPile;
            // I didn't learn anything new about the location of tiles.
            newState.unknownLocation = state.unknownLocation;
            // My opponent now knows I have that tile in my hand.
            state.knownInMyHand.push(drawnTile);
        } else {
            // I guess I will uniformly draw one of the tiles whose locations I don't know
            var drawIndex = randomInteger(state.unknownLocation.length) - 1;
            drawnTile = state.unknownLocation[drawIndex];
            // From now on I know the location of that tile.
            state.unknownLocation.splice(drawIndex, 1);
            var newUnknown = state.unknownLocation;
            newState.unknownLocation = newUnknown;
            // The draw pile doesn't change as I didn't touch it.
            newState.myDrawPile = state.myDrawPile;
        }
        // We add the drawn tile to the hand.
        newHand = state.hand.concat([drawnTile]);
        // We choose the tile to discard
        var discardedTile = newHand[action.discard];
        newHand.splice(action.discard, 1);
        newState.hand = newHand;
        // We add that tile to the discard pile.
        state.myDiscardPile.push(discardedTile);
        newState.myDiscardPile = state.myDiscardPile;
        //If my opponent knew I had the tile I discarded, remove it from knownInMyHand
        if(state.knownInMyHand.indexOf(discardedTile) !== -1) {
            state.knownInMyHand.splice(state.knownInMyHand.indexOf(discardedTile), 1);
        }
        newState.knownInMyHand = state.knownInMyHand;
        newState.inOthersHand = state.inOthersHand;
        return newState;        
    });
};

print(actionERP(startState));