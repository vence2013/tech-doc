const fs    = require('fs');
const path  = require('path');
const https = require('https'); 

const glob      = require('glob'); 
const compose   = require('koa-compose');
const Sequelize = require('sequelize');

const Koa     = require('koa'); // koa网页服务器框架
const Body    = require('koa-body'); // 表单数据接收
const Views   = require('koa-views'); // 前端显示模板引擎
const Errors  = require('koa-error'); // 错误处理
const Logger  = require('koa-logger'); // 终端日志显示
const Session = require('koa-session'); // Session
const StaticServer = require('koa-static-server'); // 静态文件服务
// 加载配置文件
const config = require('dotenv').config({ path: '.env' }).parsed;
const certs = {
    key : fs.readFileSync('cert/server-key.pem'),
    ca  : fs.readFileSync('cert/ca-cert.pem'),
    cert: fs.readFileSync('cert/server-cert.pem')
}


// keys: cookie的签名
var app = new Koa({ keys: ['cookie sign random: 802566 338402 994741 227937 868228']});

app
.use(Session({ 
    key: 'koa:sess', maxAge: 3600000/* cookie过期时间， 毫秒*/, overwrite: true, rolling: true, 
    httpOnly: true/* 只有服务器端可以获取cookie */, signed: true/* 签名 */, renew: false
}, app))
.use(StaticServer({ rootDir: 'node_modules', rootPath: '/node_modules' }))
.use(StaticServer({ rootDir: 'view', rootPath: '/view' }))
.use(StaticServer({ rootDir: '/data/upload',      rootPath: '/upload' }))
.use(Body({ multipart: true, formidable: { maxFileSize: 1024*1024*1024 } /* 单个文件小于1GB */ }))
.use(Views(__dirname, { map: {html: 'underscore'} }))
.use(Errors({ engine: 'underscore', template: 'view/errors.html' }))
.use(Logger(logFormat))
.use(dbConnect())
.use(loadWebsites());


https.createServer(certs, app.callback()).listen(443);
console.log('The Server is starting!');


/* 加载子网站 */
function loadWebsites()
{
    var modeldirs   = [], 
        routedirs   = [ path.join(__dirname, 'route') ],
        controldirs = [ path.join(__dirname, 'control') ];        

    var webdir = path.join(__dirname, 'websites');

    glob.sync(webdir+"/*/").map(async (dir)=>{            
        // 加载静态资源(view/ *)
        if (fs.existsSync(path.join(dir, 'view'))) {
            var dirObj = path.parse(dir);
            app.use(StaticServer({ rootDir: path.join(dir, 'view'), rootPath: '/'+dirObj.base+'/view' }))
        }
        // 搜集model, route, control的目录
        if (fs.existsSync(path.join(dir,'model')))   { modeldirs.push(path.join(dir,'model')); }
        if (fs.existsSync(path.join(dir,'route')))   { routedirs.push(path.join(dir,'route')); }
        if (fs.existsSync(path.join(dir,'control'))) { controldirs.push(path.join(dir,'control')); }
    });

    /* 加载数据模型(model/ *)， 分为2步执行：
     * 1. 加载所有子网站的数据模型， 除了表示模型关系的Relations.js的所有文件。
     * 2. 加载所有子网站的模型关系
     */
    var models = [];
    app.context.models = models;
    sequelize = app.context.sequelize;
    // 导入数据模型
    for (var i=0; i<modeldirs.length; i++) {
        fs.readdirSync(modeldirs[i])
        .filter((x)=>{ return x!='Relations.js'; })
        .forEach(async (e, idx)=>{
            let file = path.join(modeldirs[i], e);
            let fileObj = path.parse(file);
            if (fs.statSync(file).isFile()) { models[ fileObj.name ] = await sequelize.import(file); }
        })
    }
    // 导入数据模型的关系
    for (var i=0; i<modeldirs.length; i++) {
        let file = modeldirs[i]+'/Relations.js';
        if (fs.existsSync(file)) { require(file).link(models, sequelize); }
    }
    // 同步到数据库
    sequelize.sync({logging: false}); 

    /* 加载控制文件(control/ *)
     * 包括根目录的控制文件和子网站的控制文件
     */
    var controls = [];
    app.context.controls = controls;
    // 导入控制文件
    for (var i=0; i<controldirs.length; i++) {
        glob.sync(controldirs[i]+"/*.js").map((file)=>{
            var fileObj = path.parse(file);
            var dirlist = fileObj.dir.split('/');

            var key = (dirlist.length==3) ? fileObj.name : dirlist.slice(-2)[0]+'/'+fileObj.name;
            controls[ key ] = require(file);
        });
    }

    /* 加载路由(route/ *)
     */
    var routers = [];
    // 导入路由文件
    for (var i=0; i<routedirs.length; i++) {
        glob.sync(routedirs[i]+"/*.js").map((file)=>{
            var urlPrefix = '';

            var fileObj = path.parse(file);
            var dirlist = fileObj.dir.split('/');
            var webname = dirlist.slice(-2)[0];
            if (fileObj.name=='index') {
                urlPrefix = (dirlist.length==3) ? '' : '/'+webname;
            } else {
                urlPrefix = (dirlist.length==3) ? '/'+fileObj.name : ('/'+webname+'/'+fileObj.name);
            }
            var router = require(file);
            router.prefix(urlPrefix);

            routers.push(router.routes());
            routers.push(router.allowedMethods());
        });
    }

    return compose(routers);
}

/* 连接数据库 */
function dbConnect()
{
    // 数据库连接
    var sequelize = new Sequelize(config.SYSNAME, config.SYSNAME, config.MYSQL_ROOT_PASSWORD, 
        { host: config.MYSQL_HOST, dialect: 'mysql', pool: { max: 5, min: 0, acquire: 30000, idle: 10000 } }
    );
    app.context.sequelize = sequelize;

    // 数据库连接测试
    sequelize.authenticate()
    .then(async () => {
        console.log('^_^ Connection has been established successfully.');
    })
    .catch(err => {
        console.error('^~^ Unable to connect to the database:', err);
    }); 

    return async function(ctx, next) { await next(); }
}

/* 重新格式化日志 */
function logFormat(str, args)
{
    args.shift();    
    switch (args.length)
    {
        case 2:
            console.log("%s %s", args[0], args[1]);   
            break;
        case 5:
            console.log("%s %s\t(%s %s %s)", args[0], args[1], args[2], args[3], args[4]);    
    }
}