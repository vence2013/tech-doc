#!/bin/bash
# backup.sh restore filename hostname root_password database
# backup.sh backup  filename hostname root_password database 

webdir=/web
datadir=/data

# Parameters
operate=$1
filename=$2
hostname=$3
root_password=$4
database=$5

if [ 'restore' = ${operate} ]; then
# Restore Process -------------------------------------------------------------

cd ${datadir}

# remove file in data directory except uploaded backup file
ls|grep -v ${filename}|xargs rm -fr

# uncompress backup file & restore file
tar xvf ${filename}

# restore database
db_res=`mysqlshow --host=${hostname} -u root -p${root_password} | grep ${database}`
if [ -z "${db_res}" ]; then
    mysqladmin --host=${hostname} -u root -p${root_password} -s create ${database}
fi
mysql  --host=${hostname} -u root -p${root_password} ${database} < backup/${database}.sql

else
# Backup Process --------------------------------------------------------------

# clear previous backup
rm -fr ${datadir}/backup*

# collection file data
mkdir -pv ${datadir}/backup
cp -f  ${webdir}/.env ${datadir}/backup/env
cp -fr ${webdir}/cert ${datadir}/backup

# collection mysql data
mysqldump --host=${hostname} -u root -p${root_password} ${database} > ${datadir}/backup/${database}.sql 

# Pack backup files
tar zcvf ${datadir}/${filename}.tgz -C ${datadir} upload backup

fi
