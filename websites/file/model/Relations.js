exports.link = async (models)=>{
    // 文件 - 目录
    models['File'].belongsToMany(models['Category'], {through: 'CategoryFile'});
    models['Category'].belongsToMany(models['File'], {through: 'CategoryFile'});    
}