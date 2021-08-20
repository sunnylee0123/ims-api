# ims-api for Ying

DB used is Postgres. If you'd like to test this code for yourself, install Postgres, and create a .env file at the root of your directory with the following values (PGDATABASE name and IMSTABLE name can be changed too):

PGHOST = localhost  
PGUSER = postgres  
PGDATABASE = postgres  
PGPASSWORD = YOUR_PASSWORD  
PGPORT = 5432  
IMSTABLE = ims  
PORT = 8080  

The IMS table's schema is as follows:

|Name|Data Type|Primary key?|
|---|---|---|
|phone_number | text | Yes|
|username   |text|
|password    |text|
|domain    |text|
|status      |boolean|
|features      |jsonb|
