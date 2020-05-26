exports.link = async (models)=>{
    // 文档 - 标签
    models['Document'].belongsToMany(models['Tag'], {through: 'DocumentTag'});
    models['Tag'].belongsToMany(models['Document'], {through: 'DocumentTag'});
}