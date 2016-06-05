var fs = require("fs");
var fse=require('fs-extra');
var path = require('path');
var stream = require( "stream" );
var util = require( "util" );

var packager = require('./packager.js');

builder={};
builder.build=function(pathf,binpath,targetpath,callback){
	build(pathf,binpath,targetpath,callback)
}
function build(pathf,binpath,targetpath,callback){
	packager.package(pathf,function(err,buffer){
		//fs.writeFileSync(path.join(targetpath,'app.nw'), buffer,{encoding: 'binary'});
		if(!fs.existsSync(targetpath)){
			fs.mkdirSync(targetpath);
		}
		mergeFiles(
			path.normalize(binpath),
			buffer,
			path.join(targetpath,'app'),
			callback
		)
	})
}
function mergeFiles(bin,zip,ouput,callback){
	var outStream = fs.createWriteStream(ouput, {
		flags: "w",
		encoding: null,
		mode: 0775
	});
	outStream.on("finish",callback);

	var inStream = fs.createReadStream(bin, {
		flags: "r",
		encoding: null,
		fd: null,
		mode: 0666,
		bufferSize: 64*1024
	});
	inStream.on("end", function(){
		if(typeof zip == 'string'){
			var inStreamx = fs.createReadStream(zip, {
				flags: "r",
				encoding: null,
				fd: null,
				mode: 0666,
				bufferSize: 64*1024
			});
			inStreamx.on("end",function(){})
			inStreamx.pipe(outStream, { end: true });
		}else{
			new BufferStream(zip,function(){}).pipe(outStream, { end: true });
		}
		//outStream.write("\n\n");
	});
	//outStream.write("\n\n");
	inStream.pipe(outStream, { end: false });
}

function BufferStream(source,end) {
	if ( ! Buffer.isBuffer( source ) ) {
		throw( new Error( "Source must be a buffer." ) );
	}
	stream.Readable.call( this );
	this._source = source;
	this._offset = 0;
	this._length = source.length;
	this.on( "end", function(){
		this._destroy
		if(typeof end == 'function'){
			end();
		}
	} );
}
 
util.inherits( BufferStream, stream.Readable );
BufferStream.prototype._destroy = function() {
	this._source = null;
	this._offset = null;
	this._length = null;
};

BufferStream.prototype._read = function( size ) {
	if ( this._offset < this._length ) {
		this.push( this._source.slice( this._offset, ( this._offset + size ) ) );
		this._offset += size;
	}
	if ( this._offset >= this._length ) {
		this.push( null );
	}
};


module.exports=builder;
/*
builder.build(
	'/home/rurigk/node/gameeditor/',
	'/home/rurigk/node/nwjsbuilder/builder/bin/nwjs-v0.12.1-linux-ia32/nw',
	'/home/rurigk/node/build/tempbin/'
)*/