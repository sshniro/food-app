DROP TABLE notified_drivers;

DROP TABLE orders;

DROP TABLE drivers;

DROP TABLE users;

CREATE TABLE users(id serial NOT NULL PRIMARY KEY, username VARCHAR(30) UNIQUE, password VARCHAR(256) NOT NULL, role VARCHAR(20) NOT NULL);

CREATE TABLE drivers(id INT NOT NULL PRIMARY KEY REFERENCES users(id), location_address VARCHAR(255), location_latitude DOUBLE PRECISION, location_longitude DOUBLE PRECISION, availability VARCHAR(20), rating real);

CREATE TABLE orders(id serial NOT NULL PRIMARY KEY, origin VARCHAR(256) NOT NULL, destination VARCHAR(256) NOT NULL, origin_address VARCHAR(255) NOT NULL, destination_address VARCHAR(255) NOT NULL, distance INT NOT NULL, duration INT NOT NULL, order_status VARCHAR(30) NOT NULL, timestamp BIGINT NOT NULL, order_acceptor INT REFERENCES drivers(id));

CREATE TABLE notified_drivers(orderId INT NOT NULL REFERENCES orders(id), driverId INT NOT NULL REFERENCES drivers(id), PRIMARY KEY(orderId, driverId));