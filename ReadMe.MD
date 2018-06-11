docker run -p 6379:6379 --name some-redis -d redis

docker run -it --link some-redis:redis --rm redis redis-cli -h redis -p 6379







API to notify all Drivers, (Frist to best driver, then after 10 sec to others)

If accepted by someone stop notification, and anyone else accepting

UI to show the request and drivers to accept the notification.

