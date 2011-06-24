function trim(data) {
    return data.replace(/^\s+|\s+$/g, '')
}

function extractwords(data) {
    var words = data.replace(/\./g, ' . ')
    words = words.replace(/\,/g, ' , ')
    words = ". " + words + " ."

    words = words.split(" ")
    words = words.map(trim)
    words = words.filter(function(word) { if ( word == "" ) { return false } return true })
    return words
}

function buildgraph(data,ids) {
    var graph = {}

    var data = extractwords(data)
    var lastword = null    
    while (true) {
	var word = data.pop()
	if (word == undefined) { return [graph,ids] }

	var id = wordid(word,ids)

	if (lastword != null) { addlink(id,lastword,graph) }

	lastword = id
    }
}

function addlink(id1,id2,graph) {
    if (!graph[id1]) {
	graph[id1] = {}
    }

    if (graph[id1][id2]) { 
	graph[id1][id2] ++;
    } else {
	graph[id1][id2] = 1
    }
}

function wordid(word,ids)  {

    for (id in ids) {
	if (ids[id] == word) { return parseInt(id) }
    }
    
    console.log(word)
    var newid = ids.length
    ids.push(word)
    return newid
}

function pickone(entry) {

    var range = 0

    for (x in entry) {
	range += entry[x];
    }

    var r=Math.floor(Math.random()*range)

    for (x in entry) {
	r -= entry[x];
	if (r < 0) { return x }
    }
}

function sentance(graph,ids) {
    var current = 0
    var sentance = ""
    while (true) {
	current = pickone(graph[current])
	sentance = sentance + " " + ids[current]
	if (current == 0) { return postprocess(sentance) }
}}

function apply_modifier(entry,modifier) {
    for (x in entry) { entry[x] *= modifier }
    return entry
}

function joingraphentry(entry1,entry2) {
    for (x in entry2) {
	if (entry1[x]) { entry1[x] += entry2[x] } else { entry1[x] = entry2[x] }
    }
    return entry1
}

// [ { graph: graph1, value: value1 }, {graph: graph2 , value: value2}, ... ]
function multisentance(graphlist,ids) {

    var current = 0
    var sentance = ""

// { 0 : { 1 : 7 }. { 2 : 2 }}

    while (true) {
	var entry = []
	for (i in graphlist) {
	    var graph = graphlist[i]
	    if (graph.graph[current]) {
		entry = joingraphentry(entry,apply_modifier(graph.graph[current],graph.value))
	    }
	}

	current = pickone(entry)
	sentance = sentance + " " + ids[current]
	if (current == 0) { return postprocess(sentance) }
}}

function postprocess(sentance) {
    sentance = sentance.replace(/ , /g, ', ')
    return sentance
}

module.exports.buildgraph = buildgraph
module.exports.sentance = sentance

data1 = "ivan ide u ducan."
data2 = "anja ide u skolu. anja ide u ludnicu."

var ids = [ ".","," ]
var graph1 = {}
var graph2 = {}

var ret = buildgraph(data1,ids)
ids = ret[1]
graph1 = ret[0]

var ret = buildgraph(data2,ids)
graph2 = ret[0]

//console.log(multisentance([{ graph: graph1, value: 3 }, {graph: graph2, value:1 } ],ids))

console.log(ids)
console.log(graph1)
console.log(graph2)