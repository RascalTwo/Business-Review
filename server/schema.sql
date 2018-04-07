CREATE TABLE IF NOT EXISTS 'business' (
	'id'            INTEGER  NOT NULL  PRIMARY KEY AUTOINCREMENT,
	'name'          TEXT     NOT NULL,
	'type'          TEXT,
	'address'       TEXT     NOT NULL,
	'city'          TEXT     NOT NULL,
	'state'         TEXT     NOT NULL,
	'postalCode'    TEXT     NOT NULL,
	'purchased'     INTEGER
);

CREATE TABLE IF NOT EXISTS 'review' (
	'id'            INTEGER  NOT NULL  PRIMARY KEY AUTOINCREMENT,
	'businessId'    INTEGER  NOT NULL  REFERENCES 'business'  ('id'),
	'userId'        INTEGER  NOT NULL  REFERENCES 'user'      ('id'),
	'score'         INTEGER  NOT NULL,
	'date'          INTEGER  NOT NULL,
	'text'          TEXT     NOT NULL 
);

CREATE TABLE IF NOT EXISTS 'user' (
	'id'            INTEGER  NOT NULL  PRIMARY KEY AUTOINCREMENT,
	'username'      TEXT     NOT NULL,
	'passwordHash'  TEXT     NOT NULL,
	UNIQUE (username)
);

CREATE TABLE IF NOT EXISTS 'photo' (
	'id'            INTEGER   NOT NULL  PRIMARY KEY AUTOINCREMENT,
	'businessId'    INTEGER   NOT NULL  REFERENCES 'business'  ('id'),
	'position'      INTEGER   NOT NULL,
	'caption'       TEXT
);

PRAGMA user_version = 5;
