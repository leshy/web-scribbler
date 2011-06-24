
/**
 * Module dependencies.
 */


var mongoserver = "localhost"
var mongoport = 27017
var mongodbname = "scribbler"
var name = "scribbler"

var express = require('express');
var app = module.exports = express.createServer();
var hashlib = require('hashlib');
var sys = require('sys');
var mongo = require('mongodb');
var BSON = mongo.BSONPure

var scribbler = require('./scribbler.js')

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
    console.log("connected to mongodb server at " + db.connections[0].host + ":" + db.connections[0].port );

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


app.post('/ajax/generatemulti', function(req, res) {


    db.collection("scribbler", function(err,collection) {
	collection.findOne({'ids': { "$exists" : true } }, function(err, ids) {


	    for (graphid in req.body.bases) {
		collection.findOne({'_id': new BSON.ObjectID (req.body._id)}, function (err,doc))
	    }

	    { graphid: value, graphid: value }	    
	    scribbler.multisentance
	    
	})
    })
})

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
});

app.post('/ajax/writesource', function(req, res){
    if (!req.body.data) { return }
    if (!req.body.name) { return }
    db.collection("sources", function(err,collection) {   
	var graph  = scribbler.buildgraph(req.body.data)
	console.log (graph)
	data = { "name" : req.body.name, "data" : req.body.data, "size" : req.body.data.length, "graph" : graph }

	if (req.body._id) {
	    collection.update({'_id': new BSON.ObjectID (req.body._id)}, data, function(err, doc) {res.send(jsonmsg("ok",1))})
	} else {
	    collection.insert(data, function(err, doc) {res.send(jsonmsg("ok",1))})
	}
    })
});

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


if (!module.parent) {
  app.listen(6661);
  console.log("Express server listening on port %d", app.address().port);
}

