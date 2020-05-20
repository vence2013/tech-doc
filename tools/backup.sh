#!/bin/bash
# backup.sh hostname root_password database filename

webdir=/web
datadir=/data

# clear previous backup
rm -fr ${datadir}/backup*

# collection file data
mkdir -pv ${datadir}/backup
cp -f  ${webdir}/.env ${datadir}/backup/env
cp -fr ${webdir}/cert ${datadir}/backup

# collection mysql data
mysqldump --host=$1 -u root -p$2 $3 > ${datadir}/backup/tech-doc.sql 

# Pack backup files
tar zcvf ${datadir}/$4.tgz -C ${datadir} upload backup