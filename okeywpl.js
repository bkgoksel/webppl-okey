var HAND_LENGTH = 7;
var startState = {
    hand: [{val: 0, col: 0},
           {val: 0, col: 0},
           {val: 0, col: 0}],
    piles: [[], []],
    inOthersHand: [],
    knownInMyHand: [],
    unknownLocation: []
};

var actionERP = function(state) {
    return Enumerate(function() {
        if(externOkey.win(state)) {
            return "WIN";
        } else {
            var goalSample = sample(goalPriorERP(state));
            var actionSample = sample(actionPriorERP(state, goalSample));
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
            var newState = externOkey.applyAction(state, action);
            var othersState = sample(inferredStateERP(newState));
            var othersAction = sample(actionERP(othersState));
            return sample(outcomeWithOtherERP(newState, othersAction));
        }
    })
};

var outcomeWithOtherERP = function(state, action) {
    return Enumerate(function() {
        if(action == "WIN") {
            return state;
        } else {
            var newState = externOkey.applyAction(state, action);
            var newAction = sample(actionERP(newState));
            return sample(outcomeWithMainERP(newState, newAction));
        }
    });
};

var inferredStateERP = function(state) {
    return Enumerate( function() {
        var otherPlayerState = {};
        otherPlayerState.hand = sample(handERP(state.inOthersHand, state.unknownLocation, HAND_LENGTH - state.inOthersHand));
        otherPlayerState.piles = state.piles;
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
}

var actionPriorERP = function(state) {
    
}

var goalPriorERP = function(state) {
    
}

var applyActionERP = function(state, action) {
    //ERP part is figuring out the withdrawn tile.
}
//EXTERNAL PART

var externOkey = {};

externOkey.prototype.applyAction = function(state, action) {
    
}

var transition = function(state, action, player) {
    if(action.drawnTile == "center") {
        state.players[player].hand.push(state.unused.pop());
    } else {
        state.players[player].hand.push(state.piles[prevPlayer(player)].pop());
    }
    state.players[player].hand.splice(state.players[player].hand.indexOf(action.discardedTile),1);
    state.piles[player].push(action.discardedTile);
};

var win = function(state, player) {
    return (validHand(state, state.players[player].hand)) ? true : false;    
};

var tryGroup = function (group, newTile) {
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
        if (group0col === newTile.color && (newTile.value % 13) + 1 === group0val) {
            group.insert(0,origTile);
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
};

var validHand = function (state, hand) {
    if (hand.length === 0) {
        return true;
    }
    var handC4opy = hand.slice(0);
    var firstCard = handCopy.pop();
    var firstGroup = [firstCard];
    for (var i = 0; i < handCopy.length; i++) {
        var groupCopy = firstGroup.slice(0);
        groupCopy = tryGroup(groupCopy, handCopy[i]);
        if (groupCopy.length > 0) {
            var nextHandCopy = handCopy.slice(0);
            nextHandCopy.remove(i);
            if (validGrouping(groupCopy, nextHandCopy)) {
                return true;
            }
        }
    }
    return false;
};

var validGrouping = function (curGroup, otherTiles) {
    if (curGroup.length > 2 && validHand(otherTiles)) {
        return true;
    }
    for (var i = 0; i < otherTiles.length; i++) {
        var groupCopy = curGroup.slice(0);
        groupCopy = tryGroup(groupCopy, otherTiles[i]);
        if (groupCopy.length > 0) {
            var restCopy = otherTiles.slice(0);
            restCopy.remove(i);
            if (validGrouping(groupCopy, restCopy)) {
                return true;
            }
        }
    }
    return false;
};