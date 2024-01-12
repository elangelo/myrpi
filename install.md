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
