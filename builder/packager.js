var fs = require('fs');
var path = require('path');
var JSZip = require("jszip");
packager={};
packager.package=function(pathf,callback){
	var ignore = [];
	fileignorepath=path.join(pathf,'.buildignore');
	if(fs.existsSync(fileignorepath)){
		ignore=fs.readFileSync(fileignorepath,{
			encoding:'utf8'
		}).split('\n');
		for (var i = 0; i < ignore.length; i++) {
			ignore[i]=path.join(pathf,ignore[i])
		};
	}
	packager.getFiles(pathf,ignore,function(err,results){
		if(err){
			return callback(err,null);
		}
		console.log(results)
		var struct = {
			'/':new JSZip()
		};
		for (var i = 0; i < results.length; i++) {
			fpath=results[i].replace(pathf,'');
			pathx=path.parse(fpath);
			sect_path=pathx.dir.split('/');
			for (var ix = 0; ix < sect_path.length; ix++) {
				topath=sect_path.slice(0,ix+1).join('/');
				topath=(topath == '' || topath == '/')? '/':topath+'/';
				topathl=sect_path.slice(0,ix).join('/');
				topathl=(topathl == '' || topathl == '/')? '/':topathl+'/';
				if(typeof struct[topath] == 'undefined'){
					struct[topath] = struct[topathl].folder(path.basename(topath));
				}
			};
			var data = fs.readFileSync(results[i]);
			struct[path.normalize(pathx.dir+'/')].file(pathx.base, data, {binary:true});
		};
		var zipbuffer = struct['/'].generate({
	    	compression: 'DEFLATE',
	    	type: 'nodebuffer'
	    });
		callback(null,zipbuffer);
	})
}
packager.getFiles = function(dir, ignore, done) {
	var ignore = ignore||[];
	ignore.push(path.join(dir,'.buildignore'));
	var results = [];
	fs.readdir(dir, function(err, list) {
		if (err) return done(err);
		var i = 0;
		(function next() {
			var file = list[i++];
			if (!file) return done(null, results);
			file = path.join(dir,file);
			fs.stat(file, function(err, stat) {
				if (stat && stat.isDirectory()) {
					if(!comaprePaths(ignore,file)){
						packager.getFiles(file, ignore, function(err, res) {
							results = results.concat(res);
							next();
						});
					}else{
						next();
					}
				} else {
					if(!comaprePaths(ignore,file)){
						results.push(file);
					}
					next();
				}
			});
		})();
	});
};
function comaprePaths(ignore,pathx){
	if(ignore.indexOf(pathx) >= 0){
		return true;
	}else{
		if(ignore.indexOf(path.join(pathx,'/')) >= 0){
			return true;
		}
	}
	return false;
}
module.exports=packager;