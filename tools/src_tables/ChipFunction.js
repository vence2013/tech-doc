/****************************************************************************** 
 * 文件名称 ： ChipDocument.js
 * 功能说明 ： 
 * 
 * 创建日期 ： 2019/5/28
 * 创建者   ： wuxb
 * 修改历史 ： 
 *  2019/5/28    - 创建文件。
 *****************************************************************************/ 

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('ChipFunction', {
        content: {
            type: DataTypes.BLOB, 
            allowNull: false, 
        },
        bitslist: {
            type: DataTypes.STRING,
        },
    }, {
        charset: 'utf8',
        collate: 'utf8_general_ci'        
    });
}