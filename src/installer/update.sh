#!/bin/sh
#IS_HIT_UPDATE_SCRIPT=1

SOURCE_PATH="/mnt/usb"

aplay -c 1 -r 16000 -f S16_LE $SOURCE_PATH/herewego.snd

# create htdocs
test -d /usr/data/htdocs || mkdir /usr/data/htdocs

# create backup
test -d $SOURCE_PATH/backup || mkdir $SOURCE_PATH/backup
rm -rf $SOURCE_PATH/backup/*
mv /usr/data/htdocs/* $SOURCE_PATH/backup/

# install
cp -rf $SOURCE_PATH/www/* /usr/data/htdocs

# restore files
test -f $SOURCE_PATH/backup/mail.cfg || cp $SOURCE_PATH/backup/mail.cfg /usr/data/htdocs/
test -f $SOURCE_PATH/backup/timer.txt || cp $SOURCE_PATH/backup/timer.txt /usr/data/htdocs/
test -f $SOURCE_PATH/backup/cleandata.html || cp $SOURCE_PATH/backup/cleandata.html /usr/data/htdocs/

sleep 5

aplay -c 1 -r 16000 -f S16_LE $SOURCE_PATH/SND_COMPLETE.snd

exit 0
