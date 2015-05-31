/* 
Generic array shuffling, insertion and tile search code to be used
 */
Array.prototype.shuffle = function () {
    var input = this;

    for (var ii = input.length - 1; ii >= 0; ii--) {

        var randomIndex = Math.floor(Math.random() * (ii + 1));
        var itemAtIndex = input[randomIndex];

        input[randomIndex] = input[ii];
        input[ii] = itemAtIndex;
    }
    return input;
}; 

Array.prototype.insert = function (index, item) {
    this.slice(index, 0, item);
};

Array.prototype.tileSearch = function (target) {
    for (var xx = 0; xx < this.length; xx++) {
        if (this[xx].equals(target)) {
            return xx;
        }
    }
    return -1;
};

Array.prototype.remove = function(index) {
    this.splice(index,1);
};

/* 
A tile just stores the color and value of a tile.
    color: color of tile, int in range [0,3]
    value: numerical value of tile, int in range [1,13]
    
    -toString: returns a string representation of a tile
*/
function Tile(color, value) {
    this.color = color;
    this.value = value;
}

Tile.colorToStr = function (num) {
    switch (num) {
        case 0:
            return "R";
        case 1:
            return "B";
        case 2:
            return "G";
        case 3:
            return "Y";
        case 4:
            return "FAKE JOKER";
        default:
            return "INVALID COLOR";
    }
};

Tile.strToColor = function (str) {
    switch (str) {
        case "R":
            return 0;
        case "B":
            return 1;
        case "G":
            return 2;
        case "Y":
            return 3;
        case "FAKE JOKER":
            return 4;
        default:
            return -1;
    }
};

Tile.prototype.toString = function () {
    return "[" + this.value + ", " + Tile.colorToStr(this.color) + "]";
};

Tile.prototype.equals = function (other) {
    return (other.value === this.value && other.color === this.color);
};

/* 
A deck stores the deck of tiles of a game. 
    unused: array of tiles that are not yet in gameplay
    used: array of tiles that are drawn to the game
    indicator: the indicator tile(one below the joker)
    joker: the bonus tile that can work in any group
    
    -constructor: fills the unused array with all the tiles in the game and shuffles it.
    -draw: takes the next tile from unused and adds it to used, returns it.
    -tilesRemaining: returns the number of remaining unused tiles.
    -addToBottom: takes a tile as input, adds it to the bottom of the unused tiles.
    -drawHand: constructs a hand array by taking the 14(or 15 if the passed in bool is true) next unused tiles. Adds tiles to used and returns the hand array.
*/
var Deck = function () {
    this.unused = [];
    for (ij = 0; ij < 52; ij++) {
        var color = Math.floor(ij / 13);
        var value = ij % 13 + 1;
        var thisTile = new Tile(color, value);
        this.unused[ij] = thisTile;
        this.unused[ij + 52] = thisTile;
    }
    this.unused[104] = new Tile(4, -1);
    this.unused[105] = new Tile(4, -1);
    this.unused.shuffle();
    this.used = [];
};

Deck.prototype.draw = function () {
    if (this.unused.length === 0) {
        alert("deck empty");
    } else {
        var tile = this.unused.pop();
        this.used.push(tile);
        return tile;
    }
};

Deck.prototype.tilesRemaining = function () {
    return this.unused.length;
};

Deck.prototype.addToBottom = function (tile) {
    this.unused.insert(0, tile);
};

Deck.prototype.drawHand = function (isFirst) {
    var hand = [];
    for (ji = 0; ji < 14; ji++) {
        hand[ji] = this.draw();
    }
    if (isFirst) {
        hand[14] = this.draw();
    }
    return hand;
};

/* 
Player holds the information for a player in a game
    name: the name of the player
    isAI: whether the player is AI or not (defaults to false)
    AIType: what kind of AI the player will have (defaults to null)
    hand: the current hand of the player
    gameIndex: the index of this player in the current game.
    
    -constructor: takes in a name, bool, and AIType, sets those accordingly. Zero initializes everything
    -setHand: sets the hand of the player to the given array of tiles.
    -setGameIndex: sets the gameIndex of the player to the given int.
    -drawTile: adds the given tile to the player's hand.
    -discard: removes the given tile from the player's hand.
    -getHand: returns the player's hand as an array of tiles.
    -getHandString: returns the player's hand as a string.
    -getName: returns player's name.
    -isDone: not implemented yet, will return whether the player has a complete hand
    -chooseAndDraw: makes the player choose which tile to draw given the current game and actually draws it. (modifies the player hand and the game state)
    -chooseAndDiscard: makes the player choose which tile to discard given the current game and actually discards it. (modifies the player hand and game state)
*/
var Player = function (name, isAI, AIType) {
    this.name = name;
    if (isAI === undefined) {
        this.isAI = false;
    }
    if (AIType === undefined) {
        this.AIType = null;
    }
    this.hand = [];
    this.score = 0;
    this.gameIndex = 0;
};

Player.prototype.setHand = function (hand) {
    this.hand = hand;
};

Player.prototype.setGameIndex = function (index) {
    this.gameIndex = index;
};

Player.prototype.drawTile = function (tile) {
    this.hand.push(tile);
};

Player.prototype.discard = function (tile) {
    var index = this.hand.tileSearch(tile);
    if (index === -1) {
        alert("Can't discard: tile not in hand");
    } else {
        this.hand.slice(index, 1);
    }
};

Player.prototype.getHand = function () {
    return this.hand;
};

Player.prototype.getHandString = function () {
    var retStr = "{ ";
    for (jj = 0; jj < this.hand.length; jj++) {
        retStr += this.hand[jj].toString() + " ";
    }
    return retStr + "}";
};

Player.prototype.getName = function () {
    return this.name;
};

Player.prototype.isDone = function () {
    return false;
    // TODO: Insert hand checking code for wins
};

/*
IS THIS NECESSARY?
Player.prototype.isAI = function () {
    return this.isAI;
}
*/

Player.prototype.chooseAndDraw = function (game) {
    var visibleTiles = game.getVisibleTiles();
    var lastPile = game.getPile((this.gameIndex + 3) % 4);
    var optionTile = lastPile.length > 0 ? lastPile[lastPile.length - 1] : null;
    var chosenTile;
    if (!this.isAI) {
        var choice;
        while (choice !== "Y" && choice !== "N") {
            choice = prompt("Your hand is:" + this.getHandString() + " and your option is " + optionTile.toString() + ". Draw this tile? (Y\\N)", "Y");
            if (choice === "Y") {
                game.drawFromPile(this.gameIndex);
            } else if (choice === "N") {
                game.drawFromMiddle(this.gameIndex);
            }
        }
    } else {
        //AI CHOOSE PICK
    }
};

Player.prototype.chooseAndDiscard = function (game) {
    if (!this.isAI) {
        var tile;
        do {
            var tileVal = parseInt(prompt("Your hand is: " + this.getHandString() + " what do you want to discard? (Type  its val (-1 for fake joker))"), 10);
            var tileColor = Tile.strToColor(prompt("Its color? (R, G, B, Y, FAKE JOKER)"));
            tile = new Tile(tileColor, tileVal);
        } while (this.hand.tileSearch(tile) === -1);
        game.throwFromHand(this.gameIndex, tile);
    } else {
        //AI CHOOSE THROW AWAY
    }
};

/*
GUI connects the game with the HTML page and shows the game info. Currently it shows all the player names, hands and topmost cards in piles.
    nameDisps: the DOM objects that will show the player names
    handDisps: the DOM objects that will show the player hands
    pDisps: the DOM objects that will show the topmost tiles in piles
    indDisp: the DOM object that will display the indicator tile
    
    -constructor, finds and stores the relevant DOM objects, if a game is given, updates the display to that game
    -update, given a game, updates the text to reflect on the current hands and pile situation.
*/

var GUI = function (game) {
    this.nameDisps = [];
    this.handDisps = [];
    this.pDisps = [];
    this.indDisp = document.getElementById("ind");
    for (ki = 0; ki < 4; ki++) {
        this.nameDisps[ki] = document.getElementById("name" + ki.toString());
        this.handDisps[ki] = document.getElementById("hand" + ki.toString());
        this.pDisps[ki] = document.getElementById("p" + ki.toString());
    }
    if (game) {
        this.indDisp.innerHTML = game.indicator.toString();
        for (kj = 0; kj < 4; kj++) {
            this.nameDisps[kj].innerHTML = game.getPlayer(kj).getName();
            this.handDisps[kj].innerHTML = game.getPlayer(kj).getHandString();
        }
    }
};

GUI.prototype.update = function (game) {
    for (kk = 0; kk < 4; kk++) {
        this.handDisps[kk].innerHTML = game.getPlayer(kk).getHandString();
        this.pDisps[kk].innerHTML = game.getPile(kk).length > 0 ? game.getPile(kk) : " ";
    }
};

/* Game holds the information for a running game
    deck: the deck used in this game
    indicator: the indicator tile for joker
    joker: the joker tile(which can work as any tile)
    players: array containing the players of the game
    piles: piles[i] is the pile of tiles discarded by players[i]
    curPlayer: the player who will play the next round
    
    -constructor: creates a new deck, picks the indicator and places it at the back of the deck, if passed bool is true, shuffles the players and places them in the game. Draws a hand for each player and readies the game to be started with players[0] as the starting player.
    -getPlayer: returns the player at the given index.
    -getCurPlayer: returns the game index of the current player.
    -getDeck: returns the current state of the deck
    -getJoker: returns the current joker tile
    -isJoker: returns true if the given tile is the joker tile
    -getIndicator: returns the current indicator tile
    -getPile: returns the pile with the given index
    -getVisibleTiles: returns all the tiles that are currently face up and visible to all the players
    -drawFromMiddle: draws the next tile from the unused tiles and adds it to the hand of the player with the given index
    -drawFromPile: draws the next tile from the previous discard pile for the given player and adds it to their hand.
    -throwFromHand: discards the given tile from the given player's hand and adds it to their discard pile.
    -playFirstRound: plays the first round(same as a standard round but starts with discarding)
    -playRound: plays a round(the current player draws a tile, and then discards a tile, then current player is incremented)
*/

var Game = function (players, shufflePlayers) {
    if (shufflePlayers === true) {
        players.shuffle();
    }
    this.players = [];
    this.piles = [];
    this.deck = new Deck();
    this.indicator = this.deck.draw();
    while (this.indicator.color === 4) { // Ensure indicator isn't a fake joker
        var newIndicator = this.deck.draw();
        this.deck.addToBottom(this.indicator);
        this.indicator = newIndicator;
    }
    this.deck.addToBottom(this.indicator);
    this.joker = new Tile(this.indicator.color, (this.indicator.value % 13) + 1);
    for (li = 0; li < 4; li++) {
        this.players[li] = players[li];
        this.players[li].setGameIndex(li);
        this.players[li].setHand(this.deck.drawHand(li === 0));
        this.piles[li] = [];
    }
    this.curPlayer = 0;
    this.display = new GUI(this);
};

Game.prototype.playFirstRound = function () {
    this.players[this.curPlayer].chooseAndDiscard(this);
    this.display.update(this);
    this.curPlayer = (this.curPlayer + 1) % 4;
};

Game.prototype.playRound = function () {
    this.display.update(this);
    this.players[this.curPlayer].chooseAndDraw(this);
    this.display.update(this);
    this.players[this.curPlayer].chooseAndDiscard(this);
    this.display.update(this);
    if (this.players[this.curPlayer].isDone()) {
        return true;
    }
    this.curPlayer = (this.curPlayer + 1) % 4;
    return false;
};

Game.prototype.play = function () {
    this.playFirstRound();
    for (i = 0; i < 1; i++) {
        if (this.playRound()) {
            break;
        }
    }
    alert("Winner is " + this.players[this.curPlayer].getName());
};

Game.prototype.getPlayer = function (index) {
    return this.players[index];
};

Game.prototype.getCurPlayer = function () {
    return this.curPlayer;
};

Game.prototype.getDeck = function () {
    return this.deck;
};

Game.prototype.getJoker = function () {
    return this.joker;
};

Game.prototype.isJoker = function (tile) {
    return tile === this.joker;
};

Game.prototype.getIndicator = function () {
    return this.indicator;
};

Game.prototype.getPile = function (index) {
    return this.piles[index];
};

Game.prototype.getVisibleTiles = function () {
    var visibleTiles = [];
    for (lj = 0; lj < this.piles.length; lj++) {
        if (this.piles[lj].length > 0) {
            visibleTiles.push(this.piles[lj][this.piles[lj].length - 1]);
        }
    }
    visibleTiles.push(this.indicator);
    return visibleTiles;
};

Game.prototype.drawFromMiddle = function (playerIndex) {
    if (this.deck.tilesRemaining() === 0) {
        alert("drawing from empty deck");
    } else {
        var tile = this.deck.unused.pop();
        this.deck.used.push(tile);
        this.players[playerIndex].drawTile(tile);
        alert("You just drew " + tile.toString());
    }
};

Game.prototype.drawFromPile = function (playerIndex) {
    var pile = this.piles[(playerIndex + 3) % 4];
    if (pile.length === 0) {
        alert("can't draw from this pile.");
    } else {
        var tile = this.piles[(playerIndex + 3) % 4].pop();
        this.players[playerIndex].drawTile(tile);
        alert("You just drew " + tile.toString());
    }
};

Game.prototype.throwFromHand = function (playerIndex, tile) {
    this.players[playerIndex].discard(tile);
    this.piles[playerIndex].push(tile);
    alert("you just threw " + tile.toString());
};


Game.prototype.tryGroup = function (group, newTile) {
    group = group.slice(0);
    var origTile = newTile;
    var group0val = group[0].value;
    var group0col = group[0].color;
    var groupFval = group[group.length - 1].value;
    var groupFcol = group[group.length - 1].color;
    if (group0val === -1) {
        group0val = (this.indicator.value % 13) + 1;
        group0col = this.indicator.color;
    }
    if (groupFval === -1) {
        groupFcol = this.indicator.color;
        groupFval = (this.indicator.value % 13) + 1;
    }
    if (newTile.value === -1) {
        newTile = new Tile(this.indicator.color, (this.indicator.value % 13) + 1);
    }
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

Game.prototype.validHand = function (hand) {
    if (hand.length === 0) {
        return true;
    }
    handCopy = hand.slice(0);
    var firstCard = handCopy.pop();
    while (firstCard.equals(this.joker)) {
        handCopy.insert(0, firstCard);
        firstCard = handCopy.pop();
    }
    var firstGroup = [firstCard];
    for (i = 0; i < handCopy.length; i++) {
        var groupCopy = firstGroup.slice(0);
        groupCopy = this.tryGroup(groupCopy, handCopy[i]);
        if (groupCopy.length > 0) {
            var nextHandCopy = handCopy.slice(0);
            nextHandCopy.remove(i);
            if (this.validGrouping(groupCopy, nextHandCopy)) {
                return true;
            }
        }
    }
    return false;
};

Game.prototype.validGrouping = function (curGroup, otherTiles) {
    if (curGroup.length > 2 && this.validHand(otherTiles)) {
        return true;
    }
    for (i = 0; i < otherTiles.length; i++) {
        var groupCopy = curGroup.slice(0);
        groupCopy = this.tryGroup(groupCopy, otherTiles[i]);
        if (groupCopy.length > 0) {
            var restCopy = otherTiles.slice(0);
            restCopy.remove(i);
            if (this.validGrouping(groupCopy, restCopy)) {
                return true;
            }
        }
    }
    return false;
};

/////////////////////////////////////////// END OF CLASS CODE///////////

var p1 = new Player("Kerem");
var p2 = new Player("Emine");
var p3 = new Player("Rafet");
var p4 = new Player("Sivekar");

var newGame = new Game([p1, p2, p3, p4], true); //shuffle players
//newGame.play();
var t1 = new Tile(Tile.strToColor("R"), 1);
var t2 = new Tile(Tile.strToColor("G"), 1);
var t3 = new Tile(Tile.strToColor("B"), 1);
var t4 = new Tile(Tile.strToColor("Y"), 1);
