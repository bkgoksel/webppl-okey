var HANDLENGTH = 7;
var startState = {
    players: [{
        hand: [
            {val: 1, col: 0},
            {val: 2, col: 0},
            {val: 5, col: 0},
            {val: 5, col: 1},
            {val: 4, col: 1},
            {val: 4, col: 3},
            {val: 6, col: 2},
            {val: 4, col: 2}
            ],
        name: "Kerem",
        tileProbs: []
    }, {
        hand: [
            {val: 3, col: 0},
            {val: 6, col: 1},
            {val: 3, col: 1},
            {val: 3, col: 2},
            {val: 1, col: 3},
            {val: 5, col: 2},
            {val: 2, col: 1}
            ],
        name: "Bogac",
        tileProbs: []
    }
    ],
    piles: [[],[]],
    unused: [
        {val: 1, col: 1},
        {val: 1, col: 2},
        {val: 2, col: 2},
        {val: 2, col: 3},
        {val: 3, col: 3},
        {val: 4, col: 0},
        {val: 5, col: 3},
        {val: 6, col: 0},
        {val: 6, col: 3}
        ],
    used: [],
    discarded: []
};

var actionERP = function(state, player) {
    Enumerate(function() {
        if(win(state, player)) {
            return "WIN";
        } else {
            var goalSample = sample(goalPriorERP(state, player));
            var actionSample = sample(actionPriorERP(state, player, goalSample));
            var outcomeSample = sample(outcomeERP(state, player, actionSample));
            factor(win(outcomeSample, player) ? 0 : -10);
            return actionSample;
        }
    });
};

var outcomeERP = function(state, player, actionSample) {
    Enumerate(function() {
        if(win(state, plyer)) {
            return state;
        } else {
            var nextPlayer = otherPlayer(player);
            var nextState = transition(state, player, actionSample);
            var nextAction = sample(actionERP(nextState, nextPlayer));
            var finalOutcome = sample(outcomeERP(nextState, nextPlayer, nextAction));
            return finalOutcome;
        }
    });
};

var transition = function(state, player, action) {
    
};

//EXTERNAL PART
var prevPlayer = function(player) {
    return (player + 1) % 2;
};

var transition = function(state, action, player) {
    if(action.drawnTile == "center") {
        state.players[player].hand.push(state.unused.pop());
    } else {
        state.players[player].hand.push(state.piles[prevPlayer(player)].pop());
    }
    state.players[player].hand.splice(state.players[player].hand.indexOf(action.discardedTile),1);
    state.piles[player].push(action.discardedTile);
    //UPDATE THE PROBABILITIES
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