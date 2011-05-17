
function trim(data) {
    return data.replace(/^\s+|\s+$/g, '')
}


function extractwords(data) {
    var words = data.replace(/\./g, ' . ')
    words = words.replace(/\,/g, ' , ')

    data = data.replace('/  /g', ' ')

    words = ". " + words + " ."

    words = words.split(" ")
    words = words.map(trim)
    console.log("GOT",words)
    return words
}


function buildgraph(data) {
    var graph = { ids: { 1: ".", 2: "-"}, idslen: 2, links: {}}

    var data = extractwords(data)

    //data = data.reverse()

    var lastword = null    
    while (true) {
//	console.log("data: ", data)
	var word = data.pop()
	if (word == undefined) { return graph }

	console.log(" - ", word)
	var id = wordid(word,graph)

	if (lastword) { addlink(id,lastword,graph) }

	lastword = id
    }
}


function addlink(id1,id2,graph) {
    if (!graph.links[id1]) {
	graph.links[id1] = []
    }

    console.log("linking",graph.ids[id1] ,"->",graph.ids[id2])
    graph.links[id1].push(id2)

}

function wordid(word,graph)  {

    for (id in graph.ids) {
	if (graph.ids[id] == word) { return parseInt(id) }
    }
    
    console.log("new word",word)
    graph.idslen = graph.idslen + 1
    graph.ids[graph.idslen] = word
    return graph.idslen
    
}




function pickone(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function sentance(graph) {
    var current = 1
    var sentance = ""
    while (true) {
	current = pickone(graph.links[current])
	sentance = sentance + " " + graph.ids[current]
	console.log("JUMP: ",graph.ids[current])
	if (current == 1) { return postprocess(sentance) }
    }
}

function postprocess(sentance) {
    sentance = sentance.replace(/ , /g, ', ')
    sentance = sentance.replace(/ . /g, '. ')


//    sentance = sentance.replace(' . ', ' * END * ')
//    sentance = sentance.replace(' ,', ',')
    return sentance
}


module.exports.buildgraph = buildgraph
module.exports.sentance = sentance


//data = "ivan ide u ducan. anja ide u skolu"

//var graph = buildgraph(data)

//console.log(graph)

//console.log(sentance(graph))
//console.log(sentance(graph))
//console.log(sentance(graph))
//console.log(sentance(graph))