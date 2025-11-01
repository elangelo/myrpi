# Install raspbian
# Install vim, git, npm
# Install docker
https://docs.docker.com/engine/install/debian/

# create default docker network
```bash
docker network create app_network
```
# Install influxdb
* create app directory and data directory for persistence
```bash
mkdir -p /apps/influxdb/data
cd /apps/influxdb
cat <<EOL > docker-compose.yml
version: '3'

services:
  influxdb:
    image: influxdb:1.8
    container_name: influxdb
    networks:
      - app_network
    ports:
      - "8086:8086"
    volumes:
      - ./influxdb_data:/var/lib/influxdb
networks:
  app_network:
    external: true
EOL
```
* create systemctl service:
```bash
cat <<EOL > /etc/systemd/system/influxdb.service
[Unit]
Description=Docker Compose Stack
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=true
WorkingDirectory=/apps/influxdb
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down

[Install]
WantedBy=multi-user.target
EOL
```
* make sure to enable at startup
```bash
systemctl enable influxdb
systemctl start influxdb
```

#GRAFANA
```bash
mkdir -p /apps/grafana/data
mkdir -p /apps/grafana/config
useradd --system --uid 999 --gid 999 --no-create-home --shell /usr/sbin/nologin grafana
chown -R 999:999 /apps/grafana/config
chown -R 999:999 /apps/grafana/data

cd /apps/grafana
cat  <<EOL > .env
GF_SECURITY_ADMIN_PASSWORD=mysupersecretpassword
EOL
cat  <<EOL > docker-compose.yml
version: '3'

services:
  grafana:
    image: grafana/grafana:10.2.3
    container_name: grafana
    user: "999:999"
    ports:
      - "3000:3000"
    env_file:
      - .env
    volumes:
      - ./data:/var/lib/grafana
      - ./config:/etc/grafana
EOL
```
* systemd service
```bash
cat <<EOL > /etc/systemd/system/grafana.service
[Unit]
Description=grafana
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=true
WorkingDirectory=/apps/grafana
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down

[Install]
WantedBy=multi-user.target
EOL
```
# PM2
* install pm2 globally
```bash
sudo npm install -g pm2
```
* as samuel (this gives you the right command to start as systemd user)
```bash
pm2 startup
```

# PiTemp
* On your own computer
```bash
sudo apt install dotnet-sdk-6.0
git clone git@github.com:elangelo/PiTherm.git
cd PiTherm
bash build.sh
rsync -a bin/Debug/net6.0/linux-arm64 samuel@192.168.0.200:PiTempCollector
```
* on RPI
```bash
cat "dtoverlay=w1-gpio" >> /boot/config.txt
reboot
```
* start PiTempCollector
```bash
pm2 start /home/samuel/PiTempCollector/linux-arm64/piTempCollector --watch --name PiTempCollector
```

# gate
optocoupler

* enable gpio17
```bash
#!/bin/bash

if [[ ! -d /sys/class/gpio/gpio17 ]]
then
    echo "17" > /sys/class/gpio/export
    echo "out" > /sys/class/gpio/gpio17/direction
else
    echo "gpio17 is already enabled"
fi
```
* `cp gate ~/gate`

* add to pm2
```bash
pm2 start /home/samuel/gate/index.js --watch --name gate
```
