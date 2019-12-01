#!/bin/bash

VAR_cfgdir="config"
VAR_target="pc"
VAR_mode='install'
VAR_project="tech-doc"

osinfo=$(uname -a|grep -o '[0-9a-zA-Z_]*\sGNU/Linux$')
if [ ${osinfo:0:3} == 'arm' ]; then
    VAR_target="rpi"
fi

# 脚本退出， 如果有参数，则输出显示
exit_msg() {
    if [ $# -gt 0 ]; then
        echo $1
    fi
    exit
}


# 解析命令行参数
# -d, 调试(debug)
# -u, 卸载(uninstall)，删除已安装的容器，已安装的文件
ARGS=`getopt -o "hdu" -n "install.sh" -- "$@"`
eval set -- "${ARGS}"
while true; do
    case "${1}" in
        -h)
            shift
            echo "usage: ./install.sh -h -d -u"
            echo "默认(不带任何参数)为安装该系统， 将检查依赖软件(docker, docker-compose，及docker镜像)， 重新创建容器，并启动网页服务器。"
            echo "-h, 显示当前帮助信息； -d, 进行调试安装：进入终端，不启动网页服务器； -u, 卸载系统，删除容器及相关文件"
            exit
            ;;
        -d)
            shift
            VAR_mode="debug"
            echo "当前运行在调试模式!"            
            ;;
        -u)
            shift
            VAR_mode="uninstall"
            docker-compose -p ${VAR_project} down
            rm -fv .env docker-compose.yml
            echo "卸载完成!"
            exit
            ;;
        --)
            shift;
            break;
            ;;
    esac
done


# #############################################################################
# 软件依赖检查
# 1. 系统软件： docker-ce, docker-compose(至少支持v2)
# 2. docker容器： mysql:5.5, node:9.11
#
# 参考： [Shell脚本实现简单分割字符串](https://blog.csdn.net/gb4215287/article/details/78090821)
# #############################################################################

# Docker
VerDocker=$(docker -v 2>&1)
VerDockerSub=$(echo $VerDocker | sed 's/[^0-9]*\([0-9\.]*\).*/\1/' | cut -d \. -f 1)
if [[ ${VerDocker:0:6} != "Docker" ]] || [[ ${VerDockerSub} -lt 17 ]]; then
    exit_msg "错误：请安装版本>18.x的Docker！"
fi

# DockerCompose
VerDC=$(docker-compose -v 2>&1)
VerDCx=$(echo $VerDC | sed 's/[^0-9]*\([0-9\.]*\).*/\1/')
VerDCMajor=`echo ${VerDCx}|cut -d \. -f 1`
VerDCMinor=`echo ${VerDCx}|cut -d \. -f 2`
if [[ ${VerDC:0:14} != "docker-compose" ]] || [[ ${VerDCMajor} -lt 1 ]] || [[ ${VerDCMinor} -lt 12 ]]; then
    exit_msg "错误：请安装版本>1.12.x的Docker-compose!"
fi
echo -e "当前系统已安装：\n\t"${VerDocker}"\n\t"${VerDC} 

# Docker Images
ImageMysql="mysql:5.5"
ImageNode='node:9.11'
ImageCheckMysql=$(docker images --format "{{.Repository}}:{{.Tag}}"|grep -o "${ImageMysql}")
if [ -z "${ImageCheckMysql}" ]; then 
    docker pull ${ImageMysql}
fi
ImageCheckNode=$(docker images --format "{{.Repository}}:{{.Tag}}"|grep -o "${ImageNode}")
if [ -z "${ImageCheckNode}" ]; then 
    docker pull ${ImageNode}
fi


# #############################################################################
# 系统安装过程
# #############################################################################

# 使用默认env更新/.env
cp -fv ${VAR_cfgdir}/env .env
datadir_cfgitem=$(cat .env | grep "ROOTFS_DATA=" | sed 's/\xd//')
datadir=${datadir_cfgitem:12}
if [ ! -d "${datadir}" ]; then 
    exit_msg "数据目录："${datadir}"无效，请确认该目录是否正确！"
fi

if [ ! -d "${datadir}/upload" ]; then
    mkdir -pv ${datadir}/upload
fi

echo -e "数据目录在宿主机中的路径是："${datadir}", 文件上传路径："${datadir}"/upload。"

# dummy.js > index.js
# 在未安装npm软件包前， 必须要index.js存在，容器才能正常启动；但apps.js无法使用(相应的
# 软件包未安装)， 所以只使用dummy.js占位。
cp -fv dummy.js index.js

# 提取docker-compose.yml
if [ "${VAR_target}" == "pc" ]; then
    cp -fv ${VAR_cfgdir}/docker-compose_pc.yml docker-compose.yml
else
    cp -fv ${VAR_cfgdir}/docker-compose_rpi.yml docker-compose.yml
fi

# 重建容器
docker-compose -p ${VAR_project} down
docker-compose -p ${VAR_project} up -d

sysname_cfgitem=$(cat .env | grep "SYSNAME=" | sed 's/\xd//')
sysname=${sysname_cfgitem:8}
# 安装npm包
docker exec ${sysname} /usr/local/bin/npm install

# 更新应用
if [ "${VAR_mode}" == "install" ]; then
    cp -fv apps.js index.js
    # 修正editor.md在浏览器上按键无法使用的情况。
    docker exec ${sysname} /bin/sed -i 's#return eventType;#return mouseEventType;#g' node_modules/editor.md/editormd.js
fi

# 重启数据容器，是为了让脚本执行时，数据库容器已可用。 
docker restart mysql 
# 重启网页容器是必要的， 因为之前启动是 npm 软件包可能还没有安装， 因此应用没有正确运行。
docker restart ${sysname}

exit_msg "系统安装完成！"