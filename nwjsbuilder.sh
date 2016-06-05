#!/bin/sh
mv nwjsbuilder.desktop nwjsbuilder.desktop-bak
sed -e 's,Icon=*.*,Icon='$PWD'/builder/nw-icon.png,g' nwjsbuilder.desktop-bak > nwjsbuilder.desktop
rm nwjsbuilder.desktop-bak
exec ./nwjsbuilder "$@"