exports.link = async (models)=>{
    console.log('a', models);
    // 文档 - 标签
    models['Document'].belongsToMany(models['Tag'], {through: 'DocumentTag'});
    models['Tag'].belongsToMany(models['Document'], {through: 'DocumentTag'});
    // 文档 - 目录
    models['Document'].belongsToMany(models['Category'], {through: 'DocumentCategory'});
    models['Category'].belongsToMany(models['Document'], {through: 'DocumentCategory'});    
}