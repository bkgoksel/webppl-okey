var _ = require('underscore');
var tileNumRange = 4;
var nColors = 4;

var generateAllTiles = function() {
    return _.flatten(_.map(_.range(tileNumRange), function(num) {return _.map(_.range(nColors), function(col){return {value: num, color: col};});}));
};

var stringize = function(tile) {
    return "Tile: value= " + tile.value + ", color = " + tile.color + ".";
}

console.log(_.map(generateAllTiles(), function(tile) { return stringize(tile);}));