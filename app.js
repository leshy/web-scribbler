
/**
 * Module dependencies.
 */


var mongoserver = "localhost"
var mongoport = 27017
var mongodbname = "scribbler" + process.argv[2]
var name = "scribbler " + process.argv[3]

var express = require('express');
var app = module.exports = express.createServer();
var hashlib = require('hashlib');
var sys = require('sys');
var mongo = require('mongodb');
var BSON = mongo.BSONPure

var scribbler = require('./scribbler.js')


console.log("Hi, I'm " + name + " and I'm using db num " + process.argv[2])
// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/static'));
});


// mongodb 

var db = new mongo.Db(mongodbname,new mongo.Server(mongoserver,mongoport, {}), {});

db.open( function (err) {
    if (err) {
	console.log("mongodb connection failed: " + err.stack );	
	return
    }
    console.log("connected to mongodb server")

});


// functions

function jsonmsg(message,responsecode) {
    return {'message': message, 'responsecode': responsecode}
}


// Routes

app.post ('*', function (req, res, next) {
    console.log (" - " + req.method + " " + req.url + " " )
    next()
})


app.get ('*', function (req, res, next) {
    console.log (" - " + req.method + " " + req.url + " " )
    next()
})


app.get('/', function(req, res){
	res.render('index', { title: name })
});

app.post('/ajax/upgrade', function(req, res) {
    db.collection("sources", function(err,collection) {   
	collection.findOne({'_id': new BSON.ObjectID (req.body._id) }, function(err, doc) {
	    var data = ""
	    for (x=0;x<10;x++) {
		data = data + scribbler.sentance(doc.graph) + "<br>"
	    }
	    res.send(data)
	})
    })
})


app.post('/ajax/generate', function(req, res) {
    console.log('generate req received')
    loadids(function(ids) {
	db.collection("sources", function(err,collection) {   
	    collection.findOne({'_id': new BSON.ObjectID (req.body._id) }, function(err, doc) {
		var data = ""
		for (var x=0;x<10;x++) {
		    //console.log(data)
		    data = data + scribbler.sentance(ids,doc.graph) + "<br>"
		}
		res.send(data)
	    })
	})
    })
})




function buildrequest(collection,sourcelist,valuelist,request,callback) {

    if (sourcelist.length == 0) { callback( request ); return }
    sourceid = sourcelist.pop()
    sourcevalue = valuelist.pop()

    collection.findOne({'_id': new BSON.ObjectID (sourceid) }, function(err, source) {
	request.push({graph: source.graph, value: sourcevalue})
	buildrequest(collection,sourcelist,valuelist,request,callback)
    })
}

app.post('/ajax/globalgenerate', function(req, res) {
    var data = JSON.parse(req.body.req)
    var sourcelist = []
    var valuelist = []

    for (var entry in data) {
	sourcelist.push(entry)
	valuelist.push(data[entry])
    }

    db.collection("sources", function(err,collection) {   
	buildrequest(collection,sourcelist,valuelist,[],function(request) { 
//	    console.log("GOT REQUEST",request)
	    var ok = false
	    request.forEach(function(entry) {
		if (entry.value > 0) { ok = true }
	    })

	    if (!ok) { res.send("all bases are turned off, play with sliders."); return }

	    loadids(function(ids) {
		r = ""
		for (var x=0;x<10;x++) {
		    r += scribbler.multisentance(request,ids)  + "<br>"
		}
		res.send(r)
	    })
	})
    })
})


app.get('/ajax/sources', function(req, res){
    getsources(function(sources) {
	res.send(sources.map(function(source) {delete source.data; return source}))
    })
});

app.post('/ajax/source', function(req, res){
    db.collection("sources", function(err,collection) {   
	collection.findOne({'_id': new BSON.ObjectID (req.body._id)}, function(err, doc) {
	    data = {}
	    data.data = doc.data
	    data.name = doc.name
	    data.size = doc.size
	    res.send(data)
	})
    })
})


app.post('/ajax/regenerate', function(req, res){
    regenerate_ids()
    res.send(jsonmsg("ok",1))
})

app.post('/ajax/writesource', function(req, res){
    if (!req.body.data) { return }
    if (!req.body.name) { return }
    

  //  loadids(function(ids) { 
//	var ret  = scribbler.buildgraph(req.body.data,ids)
//	var graph = ret[0]
//	var ids = ret[1]
//	console.log ("IDS:",ids)
//	console.log ("GRAPH:",graph)

//	saveids(ids)

	db.collection("sources", function(err,collection) {   
	    data = { "name" : req.body.name, "data" : req.body.data, "size" : req.body.data.length, "graph" : false }


	    if (req.body._id) {
		collection.update({'_id': new BSON.ObjectID (req.body._id)}, data, function(err, doc) {res.send(jsonmsg("ok",1))})
	    } else {
		collection.insert(data, function(err, doc) {res.send(jsonmsg("ok",1))})
	    }


	    regenerate_ids()

	})
//    })


});


function loadids(callback) {
    db.collection("ids",function(err,collection) {   
	collection.findOne({'blab': true }, function(err, ids) {
	    //console.log("IDS",ids.ids.length)
	    if (!ids) { callback([]) } else { callback(ids.ids) }
	})
    })
}

function saveids(ids,callback) {
    db.collection("ids",function(err,collection) {   
	loadids(function(lids) {
	    data = {blab: true, ids: ids}
	    if (lids.length > 0)  {
		console.log("UPDATING EXISTING IDS")
		//console.log(ids)
		collection.update({blab: true},data, function(err, doc) {})
	    } else {
		console.log("CREATING ID DB")
		collection.insert(data, function(err, doc) {})
	    }
	})
    })
}



function _regenerate(sources,ids,collection,callback) {

    if (sources.length == 0) { callback(ids) ;return }
    source = sources.pop()
    console.log("working on" , source.name,source._id)
    var ret = scribbler.buildgraph(source.data,ids)
    var newentry = { graph: ret[0], heh: 'test', name: source.name, data: source.data }
    collection.update({'name': source.name}, newentry,function(err,bla) {_regenerate(sources,ids,collection,callback) })

}

function regenerate_ids() {
    db.collection("sources", function(err,collection) {   
	collection.find({},function(err,cursor) {
	    cursor.toArray(function(error,sources) {  
		_regenerate(sources,[],collection,function(ids) { saveids(ids) } )
	    })
	})	
    })
}





app.post('/ajax/delsource', function(req,res) {
    db.collection("sources", function(err,collection) {   
	collection.remove({'_id': new BSON.ObjectID (req.body._id)}, function(err, doc) {res.send(jsonmsg("ok",1))})
    })
})

function getsources (callback) {
    db.collection("sources", function(err,collection) {   
	collection.find({}, {_id:1,name:1,size:1},function(err,cursor) {
	    cursor.toArray(function(error,docs) {  callback(docs) })
	})	
    })
}


function export(callback) {
    var data = []
    var explanations = []
    console.log("expoting data...")
    loadids(function(ids) {
	var graphnum = 2
	console.log("building word id db...")
	for (var i in ids) {
	    ainsert(explanations,explodeword(ids[i]),data.length)
	    explanations[data.length] = explanations[data.length] +  " - word start " + i 
	    data.push.apply(data,exportword(ids[i]))
	    for (var x = 0; x < graphnum; x++) {
		explanations[data.length] = "graphlink " + x
		data.push.apply(data,['0x00','0x00'])
	    }
	}

	console.log("done.")
	console.log("building graph data...")
	
	exportgraphs(data,explanations,ids,function(graphs) {
	    console.log("done.")
    	    console.log("merging...")
	    data.push.apply(graphs)
	    graph = null
	    callback(data,explanations)
	})
    })
}

// word10 24


function ainsert (array1,array2,pos)  {
    if (!pos) {
	array1.push.apply(array1,array2)
	return array1
    } 
    array2.forEach(function(x) {
	
	array1[pos] = x
	pos++;

    })

}


function exportgraphs(data,explanations,ids,callback) {
    
//    callback(data);return

    loadgraphs(function(graphs) {
	function wordlocfromid(id) {
	    return parseInt(id) * (10 + (2 * graphs.length)) + 1
	}

	console.log("GOT",graphs)
	
	var graphCounter = 0
	
	graphs.forEach(function(graph) {
	    graphdata = []

	    for (var wordid in graph) {
		console.log(wordid)
		var wordloc = wordlocfromid(wordid)

		var mypointerloc = wordloc + 10 + (2 * graphCounter)
		ainsert(data,exporthex(data.length,2),mypointerloc)
//		ainsert(data,['linkto' + graphCounter,'linkto' + graphCounter,'linkto' + graphCounter],mypointerloc)
	    
		var wordlinks = graph[wordid]

		for (var wordid in wordlinks) {
		    var weight = wordlinks[wordid]
		    explanations[data.length] = "index of word " + wordid + " (0x" + wordlocfromid(wordid).toString(16) + ")"
		    data.push.apply(data,exportid(wordid))
		    explanations[data.length] = "weight " + weight
		    data.push(exporthex(weight))
		}
		    data.push('0x00')
		    explanations.push ( "separator")
	    }
	    graphCounter++
	    
	})
	callback(data)
    })
}

function exportid(id) {
    id = parseInt(id)
//    console.log('word id: ' + id, ' - ', exporthex(id,2))
    return exporthex(id,2)
}

function loadgraphs(callback) {
    db.collection("sources", function(err,collection) {   
	collection.find({}, {graph:1},function(err,cursor) {
	    cursor.toArray(function(error,docs) {  
		data = []
		docs.forEach(function(entry) { data.push(entry.graph) })
		callback(data)
	    })
	})
    })
}


function explodeword(word) {
    var data = []
    for (var i in word) { if (i > 9) { break }; data.push(word[i]) }
    return data
}

function exportword(word) {
    var data = []
    for (var i in word) { if (i > 9) { break }; data.push(exportchar(word[i])) }
    for (var i = word.length; i < 10; i++) { data.push("0x00") }
    return data
}


function exporthex(hex,buffersize) {
    hex = parseInt(hex)
    hex = hex.toString(16)
    if (!buffersize) { buffersize = 1 }
    if (hex.length > buffersize) { console.log("BUFFER OVERFLOW"); return }
    add = (2 * buffersize) - hex.length

    for (var i = 0; i < add; i++ ) { hex = "0" + hex  }
  
  
//    if (hex.length > buffersize) { console.log("BUFFER OVERFLOW"); return }

    var data = []
    for (var i = buffersize - 1; i > -1; i--) {
	data[i] = "0x" + hex[i * 2] + hex[i * 2 + 1]
    }

    return data
}

function exportchar(c) {
    return ascii_value(c)
}


function ascii_value (c)
{
	// restrict input to a single character
	c = c . charAt (0);

	// loop through all possible ASCII values
	var i;
	for (i = 0; i < 256; ++ i)
	{
		// convert i into a 2-digit hex string
		var h = i . toString (16);
		if (h . length == 1)
			h = "0" + h;

		// insert a % character into the string
		h = "%" + h;

		// determine the character represented by the escape code
		h = unescape (h);

		// if the characters match, we've found the ASCII value
		if (h == c)
			break;
	}
    return "0x" + i.toString(16)
}





app.listen(parseInt(666 + process.argv[2]));
console.log("Express server listening on port %d", app.address().port);

if (true) {
setTimeout(function () {

    export(function(data,explanations) { 
	
	for (var i in data) { 
	    var entry = data[i]
	    if (explanations[i]) { entry += " - " + explanations[i] }
	    console.log(parseInt(i).toString(16) + "   " + entry)

	}


	for (var i in data) { 
	    var entry = data[i]
	    process.stdout.write(entry + ", ")

	}


    })

}, 1000)

}


