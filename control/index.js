const fs = require("fs")
const child_process = require('child_process');

var Backup_runtime = {
    restore: {file:'', status:null},
    backup : {}
};

exports.restore_upload = async (ctx, file) => {
    var filename = file.name.replace(/(^\s*)|(\s*$)/g, "");
    var filepath = '/data/'+filename;

    Backup_runtime.restore.file = filename;

    const reader = fs.createReadStream(file.path);
    const upStream = fs.createWriteStream(filepath);
    reader.pipe(upStream);

    Backup_runtime.restore.status = ['1/3. upload success!'];
}

exports.restore = async (ctx) => {
    const cfg = require('dotenv').config({ path: '/web/.env' }).parsed;

    Backup_runtime.restore.status.push('2/3. restoring!');
    child_process.execFileSync('tools/backup.sh', 
        ['restore', Backup_runtime.restore.file, cfg.MYSQL_HOST, cfg.MYSQL_ROOT_PASSWORD, cfg.SYSNAME]);
    
    Backup_runtime.restore.status.push('3/3. restore success!');
}

exports.restore_status = (ctx) => {
    return Backup_runtime.restore.status;
}

var system_backup_message = '';


exports.get_backup_status = () => {
    return system_backup_message;
}

exports.backup = async (filename)=>{
    const cfg = require('dotenv').config({ path: '/web/.env' }).parsed;

    child_process.execFileSync('tools/backup.sh', [cfg.MYSQL_HOST, cfg.MYSQL_ROOT_PASSWORD, cfg.SYSNAME, filename]);

    system_backup_message = 'success';
}

exports.backup_file_info = async () => {
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

exports.dummy = async()=>{
    
}