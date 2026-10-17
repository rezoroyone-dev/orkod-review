#!/bin/bash
#cd /mnt/SSD_D/MyWebRoot/vueApps/clinic
#yarn --prefer-offline serve
#yarn --prefer-offline electron:serve
#yarn --prefer-offline electron:build
# --prefer-offline  --offline
# yarn --prefer-offline --cwd /mnt/SSD_D/MyWebRoot/vueApps/clinic/
#x-terminal-emulator -e "/bin/sh %c"
#xfce4-terminal --geometry 80x40 -e "/bin/sh xclock cd /mnt/SSD_D/MyWebRoot/vueApps/clinic && ping -c4 localhost"  --tab -e "/bin/bash  && ls"
export go_server_dir=/mnt/SSD_C/Dev-Tools/goPath/src/myGoApps/ginGo
export clinic_dir=/mnt/SSD_D/MyWebRoot/vueApps/clinic
export cmd1="cd $clinic_dir && yarn --offline --prefer-offline electron:serve"
#export cmd2="cd $go_server_dir && go run main.go"
export cmd2="cd $go_server_dir && air"
export shell_CMD=/bin/bash
#xfce4-terminal --geometry 150x30 --title="Clinic" -e "$shell_CMD -c '$cmd1'" --tab --title="Go_Server" -e "$shell_CMD -c '$cmd2'"
xterm -geometry 150x30 -title "GinGo" -e "$cmd2" &
xterm -geometry 150x30 -title "Clinic" -e "$cmd1"
