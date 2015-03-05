function is(w,m){if(m.substr(0,1) == "#"){if(m.substr(1,m.length-1) == w.target.id){return true;}else{return false;}}else if(m.substr(0,1) == "."){fl=w.target.classList.length;for (var i = 0; i < fl; i++){if(w.target.classList[i] == m.substr(1,m.length-1)){return true;break;}else if(i==w.target.classList.length){return false;}};}}
function closest(w,m) {tar=w.target;while (tar.tagName != "HTML") {if(m.substr(0,1) == "#"){if(m.substr(1,m.length-1) == tar.id){return tar;}}else if(m.substr(0,1) == "."){fl=tar.classList.length;for (var i = 0; i < fl; i++){if(tar.classList[i] == m.substr(1,m.length-1)){return tar;break;}};}tar = tar.parentNode;}return null;}
function isclosest(w,m) {tar=w.target;while (tar.tagName != "HTML") {if(m.substr(0,1) == "#"){if(m.substr(1,m.length-1) == tar.id){return true;}}else if(m.substr(0,1) == "."){fl=tar.classList.length;for (var i = 0; i < fl; i++){if(tar.classList[i] == m.substr(1,m.length-1)){return true;break;}};}tar = tar.parentNode;}return false;}
function getID(w){return document.getElementById(w);}
function getClass(w){return document.getElementsByClassName(w);}
function show(e){e.style.display='block'};function hide(e){e.style.display='none'};ajax=[];

function execute(command, callback){
    if(typeof callback != "undefined"){
        exec(command, function(error, stdout, stderr){ callback(stdout); });
    }else{
        exec(command, function(error, stdout, stderr){});
    }
};

//Node import
var fs=require('fs-extra');
var path = require('path');
var gui = require('nw.gui');
var exec = require('child_process').exec;
var os = require('os');
var http = require('http');

var app={};
app.userdir=(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE)+"/";

app.main_w=gui.Window.get(0);
app.maximized=false;
app.main_w.on('maximize',function(){app.maximized=true;})
app.main_w.on('unmaximize',function(){app.maximized=false;})
app.workdir='';
app.package={};

app.buildpackages=JSON.parse(fs.readFileSync("builder/versions.json"));

keyh={};
keyh.shift=false;
keyh.ctrl=false;
keyh.altk=false;

build={};
build.version="";
build.nwjsbinpath="";
build.appdatapath="";
build.runing=false;
build.pids=[];

_console={};
_console.dom=null;
_console.msgc=0;
_console.errc=0;

window.addEventListener("load",function(){
    getID('pak-nwjsarch').innerHTML=os.arch();
    getID('pak-nwjsplatform').innerHTML=os.platform();
    _console.dom=getID('console');
    app.finput=getID('folder');
    dlprog=getID('dlprog');
    lockapp=getID('lockapp');
    msgc=getID('stdoutcount');
    errc=getID('stderrcount');
    app.finput.addEventListener('change',function(){
        app.workdir=path.dirname(app.finput.value);
        app.package=JSON.parse(fs.readFileSync(app.finput.value,{encoding:'utf8'}));
        app.finput.value='';
        updateFields();
        updateState();
    })
    app.vinput=getID('nwversion');
    showVersionsSelect();
    app.vinput.addEventListener('change',function(){
        build.version=app.buildpackages.versions[parseInt(app.vinput.value)];
        updateState();
    })
    window.addEventListener("click",function(e){
        if(is(e,'.closewindow')){
            window.close();
        }
        if(is(e,'.maxwindow')){
            if(!app.maximized){
                app.main_w.maximize();
            }else{
                app.maximized=false;
                app.main_w.unmaximize();
            }
        }
        if(is(e,'.minwindow')){
            app.main_w.minimize();
        }
        if(is(e,'.openfolder')){
            app.finput.click();
        }
        if(is(e,'#build') && e.target.getAttribute('disabled') != 'disabled'){
            buildApp();
        }
        if(is(e,'#runproject') && e.target.getAttribute('disabled') != 'disabled'){
            runApp();
        }
        if(is(e,'#clearconsole')){
            _console.dom.innerHTML="";
            _console.msgc=0;
            _console.errc=0;
            getID('stdoutcount').innerHTML="0 Messages";
            getID('stderrcount').innerHTML="0 Errors";
        }
    });

    window.addEventListener('keydown', function(e){
        if(e.keyIdentifier === 'F5'){window.location.reload();}
        if(e.keyCode == 16){keyh.shift=true;}
        if(e.keyCode == 17){keyh.ctrl=true;}
        if(e.keyCode == 18){keyh.altk=true;}
    });
    window.addEventListener('keyup', function(e){
        if(e.keyCode == 16){keyh.shift=false;}
        if(e.keyCode == 17){keyh.ctrl=false;}
        if(e.keyCode == 18){keyh.altk=false;}
    });
});
function runApp(v,pkg){
    dirbin=path.basename(genDL(build.version,os.type(),os.arch(),true));
    build.runing=true;
    updateState();
    cxmd="builder/bin/"+dirbin+"/nw '"+app.workdir+"/' "+getID('params').value;
    _console.dom.innerHTML+="<span style='color: #2082ac;'>=======<br>Run app<br>=======<br><br>"+cxmd+"</span><br><br>";
    child=exec(cxmd);
    build.pids.push(child.pid);
    child.on('exit',function(){
        _console.dom.innerHTML+="<span style='color: #2082ac;'>==============<br>Exit with code:"+child.exitCode+"<br>==============</span><br>";
        build.runing=false;
        updateState();
        build.pids.splice(build.pids.indexOf(this.pid),1)
    })
    child.stdout.on('data',function(data){
        consoleAddMsg(data);
    })
    child.stderr.on('data',function(data){
        consoleAddErr(data);
    })
}
function buildApp(){
    build.runing=true;
    updateState();
    if(app.workdir == ''){return false;}
    consoleAddMsg("<span style='color: #2082ac;'>=======<br>Build start<br>=======<br><br></span>");
    consoleAddMsg("Copying project files<br>");
    if(!fs.existsSync(app.workdir+'/.build')){
        fs.mkdirSync(app.workdir+'/.build');
        copyFiles();
    }else{
        fs.removeSync(app.workdir+'/.build');
        fs.mkdirSync(app.workdir+'/.build');
        copyFiles();
    }
}
//CopyFiles and zip in nw file
function copyFiles(){
    namef=path.dirname(app.package.main);
    fs.copySync(app.workdir+'/package.json',app.workdir+'/.build/package.json');
    fs.copy(app.workdir+'/'+namef, app.workdir+'/.build/'+namef, function(err) {
        if(err){
            consoleAddErr("Error when copying files<br>");
            consoleAddErr(err+"<br>");
            return false;
        }
        if(fs.existsSync(app.workdir+'/node_modules')){
            consoleAddMsg("Copying npm modules<br>");
            fs.copy(app.workdir+'/node_modules', app.workdir+'/.build/node_modules', function(err) {
                if(err){
                    consoleAddErr("Error when copying npm modules<br>");
                    consoleAddErr(err+"<br>");
                    return false;
                }
                consoleAddMsg("Packaging files to data.nw<br>");
                exec('cd "'+app.workdir+'/.build" && zip -r "'+app.workdir+'/data.nw" *', function(error, stdout, stderr){
                    mergeFiles();
                });
            })
        }else{
            consoleAddMsg("Packaging files to data.nw<br>");
            exec('cd "'+app.workdir+'/.build" && zip -r "'+app.workdir+'/data.nw" *', function(error, stdout, stderr){
                mergeFiles();
            });
        }
    })
}
//Merge files nw and data.nw to app
function mergeFiles(){
    consoleAddMsg("Merge binary file with data.nw<br>");
    dirbin=path.basename(genDL(build.version,os.type(),os.arch(),true));
    if(!fs.existsSync(app.workdir+"/build/")){
        fs.mkdirSync(app.workdir+"/build/");
    }
    cxmd="cat 'builder/bin/"+dirbin+"/nw' '"+app.workdir+"/data.nw' > '"+app.workdir+"/build/app' && chmod +x '"+app.workdir+"/build/app' ";
    ex=exec(cxmd, function(error, stdout, stderr){
        if(error){consoleAddErr(error+"<br>");return false;}
        if(stderr){consoleAddErr(stderr+"<br>");return false;}
        fs.copySync("builder/bin/"+dirbin,app.workdir+'/build/');
        consoleAddMsg("Removing unnecessary files<br>");
        fs.removeSync(app.workdir+'/.build/');
        fs.removeSync(app.workdir+'/build/nw');
        fs.removeSync(app.workdir+'/data.nw');
        consoleAddMsg("<span style='color: #2082ac;'>=======<br>Build complete<br>=======<br><br></span>");
        build.runing=false;
        updateState();
    });
}
//Update info in DOM
function updateFields(){
    getID('pak-appname').innerHTML=app.package.name;
    getID('pak-appdesc').innerHTML=app.package.description;
    getID('pak-appversion').innerHTML=app.package.version;
    getID('pak-projectpath').innerHTML=app.workdir;
    getID('pak-targetdir').innerHTML=app.workdir+'/build/';
    getID('params').value=(typeof app.package.params != "undefined")? app.package.params:"";
}
function updateState(){
    dirbin=path.basename(genDL(build.version,os.type(),os.arch(),true));
    getID('pak-nwjsversion').innerHTML=build.version;
    getID('pak-nwpath').innerHTML=(dirbin != false)? process.cwd()+'builder/bin/'+dirbin:"";
    if((!build.runing || app.package["single-instance"] == false) && build.version != "" && app.workdir != "" && fs.existsSync('builder/bin/'+dirbin)){
        getID('runproject').setAttribute('disabled','false');
        getID('build').setAttribute('disabled','false');
    }else{
        getID('runproject').setAttribute('disabled','disabled');
        getID('build').setAttribute('disabled','disabled');
    }
    if(!build.runing){
        getID('nwversion').disabled=false;
    }else{
        getID('nwversion').disabled=true;
    }
    if(!fs.existsSync('builder/bin/'+dirbin) && !isNaN(app.vinput.value)){
        //launch download to version
        v=app.buildpackages.versions[app.vinput.value];
        dl=genDL(v,os.type(),os.arch());
        lockapp.style.display="block";
        getID('nwversion-dl').innerHTML=build.version;
        download(dl,'builder/bin/'+path.basename(dl),function(err){
            //Download end
            lockapp.style.display="none";
            dlprog.style.width="0%";
            if(err){
                return ;
            }
            exec('cd builder/bin/ && '+unpk_command(os.type())+' "'+path.basename(dl)+'"',function(err,stderr,stdout){
                if(err){console.log(err);}
                if(stderr){console.log(stderr);}
                if(stdout){console.log(stdout);}
                showVersionsSelect();
                fs.removeSync("builder/bin/"+path.basename(dl));
            });
        },function(prog){
            //Download progress
            dlprog.style.width=prog+"%";
        });
    }
}
//show versions available
function showVersionsSelect(){
    app.vinput.innerHTML="";
    app.vinput.innerHTML+="<option disabled selected>Select a version</option>";
    for(i=app.buildpackages.versions.length-1 ;i >= 0; i--){
        dirbin=path.basename(genDL(app.buildpackages.versions[i],os.type(),os.arch(),true));
        if(fs.existsSync('builder/bin/'+dirbin)){
            colorbgst="style='background-color: #a5ffa1;'";
        }else{
            colorbgst="style='background-color: #ffa3a3;'";
        }
        app.vinput.innerHTML+="<option "+colorbgst+" value='"+i+"'>"+app.buildpackages.versions[i]+"</option>";
    }
}

//Download function with progress
function download(url,dest,callback,onprog){
    var file = fs.createWriteStream(dest);
    var request = http.get(url, function (response) {
        var len = parseInt(response.headers['content-length'], 10);
        var cur = 0;
        response.pipe(file);
        response.on("data", function(chunk) {
            cur += chunk.length;
            if(onprog){
                onprog((100.0 * cur / len).toFixed(2));
            }
        });
        file.on('finish', function () {
            file.close(callback); // close() is async, call callback after close completes.
        });
        file.on('error', function (err) {
            fs.unlink(dest); // Delete the file async. (But we don't check the result)
            if (callback)
                callback(err.message);
        });
    });
}
function genDL(v,p,a,offext){
    sv=app.buildpackages.versions.indexOf(v) > app.buildpackages.versions.indexOf("v0.11.6");
    if(sv){namep="nwjs";}else{namep="node-webkit";}
    lc=p.toLowerCase();
    if(lc=="linux"){pl="linux-"+a;ext=".tar.gz";}
    if(lc=="darwin"){pl="osx-"+a;ext=".zip";}
    if(lc=="win" && lc=="Windows_NT"){pl="win-"+a;ext=".zip";}
    if(offext){return "http://dl.nwjs.io/"+v+"/"+namep+"-"+v+"-"+pl;}
    return "http://dl.nwjs.io/"+v+"/"+namep+"-"+v+"-"+pl+ext;
}
function unpk_command(p){
    lc=p.toLowerCase();
    if(lc=="linux" || lc=="darwin"){command="tar -zxf ";}
    if(lc=="darwin"){command="unzip ";}
    if(lc=="win" || lc=="Windows_NT"){command="";}
    return command;
}
function consoleAddMsg(data){
    data=data.replace(/\n/g,'<br>');
    _console.dom.innerHTML+="<span style='color: #555;'>"+data+"</span>";
    _console.msgc++;
    msgc.innerHTML=_console.msgc+" Messages";
}
function consoleAddErr(data){
    data=data.replace(/\n/g,'<br>');
    _console.dom.innerHTML+="<span style='color: #ff3a3a;'>"+data+"</span>";
    _console.errc++;
    errc.innerHTML=_console.errc+" Errors";
}
