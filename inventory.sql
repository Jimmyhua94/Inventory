CREATE TABLE IF NOT EXISTS inventory (
  id serial primary key,
  sku integer NOT NULL,
  brand varchar(25),
  name varchar(50) NOT NULL,
  description varchar(500) NOT NULL,
  price money NOT NULL,
  stock integer NOT NULL,
  category varchar(20)
);
