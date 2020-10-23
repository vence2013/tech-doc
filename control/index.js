const fs = require("fs")
const child_process = require('child_process');

var Backup_runtime = {
    restore: {file:'', status:null},
    backup : {file:'', status:null},
};

exports.restore_upload = async (ctx, file) => {
    var filename = file.name.replace(/(^\s*)|(\s*$)/g, "");
    var filepath = '/data/'+filename;

    Backup_runtime.restore.file = filename;

    const reader = fs.createReadStream(file.path);
    const upStream = fs.createWriteStream(filepath);
    reader.pipe(upStream);
}

exports.restore = async (ctx) => {
    const cfg = require('dotenv').config({ path: '/web/.env' }).parsed;
    console.log('restore request!');
    Backup_runtime.restore.status = ['2/3. restoring!'];
    console.log('restore request 1!');
    child_process.execFileSync('tools/backup.sh', 
        ['restore', Backup_runtime.restore.file, cfg.MYSQL_HOST, cfg.MYSQL_ROOT_PASSWORD, cfg.SYSNAME]);
        console.log('restore request 2!');
    Backup_runtime.restore.status.push('3/3. restore success!');
}

exports.restore_status = (ctx) => {
    return Backup_runtime.restore.status;
}

exports.backup_status = () => {
    return Backup_runtime.backup.status;
}

exports.backup_file = async () => {
    var ret = null;
    var path = '/data';

    // 查找备份文件    
	var pa = fs.readdirSync(path);
	pa.forEach(function(ele,index){
		var info = fs.statSync(path+"/"+ele)	
		if(!info.isDirectory() && (/^backup.*\.tgz/.test(ele))){
            //console.log("file: "+ele, info);
            ret = {'name':ele, 'path':path+"/"+ele, 'size':info.size, 'mtime':info.mtime};
		}	
    })
    
    return ret;
}

exports.backup = async (filename)=>{
    const cfg = require('dotenv').config({ path: '/web/.env' }).parsed;

    Backup_runtime.backup.status = ['1/2. backuping!'];
    child_process.execFileSync('tools/backup.sh', 
    ['backup', filename, cfg.MYSQL_HOST, cfg.MYSQL_ROOT_PASSWORD, cfg.SYSNAME]);
    Backup_runtime.backup.status.push('2/2. backup success!');
}

exports.dummy = async()=>{
}