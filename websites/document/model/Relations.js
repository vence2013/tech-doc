exports.link = async (models)=>{
    // 文档 - 标签
    models['Document'].belongsToMany(models['Tag'], {through: 'TagDocument'});
    models['Tag'].belongsToMany(models['Document'], {through: 'TagDocument'});
}