PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS movimientos;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS categorias;

CREATE TABLE categorias (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE productos (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo       TEXT NOT NULL UNIQUE,
    nombre       TEXT NOT NULL,
    categoria_id INTEGER NOT NULL REFERENCES categorias(id),
    precio       REAL NOT NULL CHECK (precio > 0),
    existencia   INTEGER NOT NULL DEFAULT 0 CHECK (existencia >= 0),
    vencimiento  TEXT NULL
);

CREATE TABLE movimientos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    tipo        TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA')),
    cantidad    INTEGER NOT NULL CHECK (cantidad > 0),
    fecha       TEXT NOT NULL DEFAULT (date('now', 'localtime'))
);

INSERT INTO categorias (nombre) VALUES ('Fertilizantes'), ('Semillas'), ('Herbicidas'), ('Herramientas');

INSERT INTO productos (codigo, nombre, categoria_id, precio, existencia, vencimiento) VALUES
    ('FER-001', 'Fórmula 18-46-0 (quintal)',   1, 1250.00,  24, NULL),
    ('FER-002', 'Urea 46% (quintal)',           1, 1100.00,  18, NULL),
    ('FER-003', 'Fórmula 12-30-10 (quintal)',   1, 1180.00,   6, NULL),
    ('SEM-001', 'Semilla de frijol rojo (libra)', 2,   32.50, 150, '2027-03-31'),
    ('SEM-002', 'Semilla de maíz (libra)',      2,   28.00, 200, '2026-11-30'),
    ('SEM-003', 'Semilla de sorgo (libra)',     2,   22.00,   8, '2026-12-15'),
    ('HER-001', 'Glifosato (litro)',            3,  180.00,   8, '2027-08-15'),
    ('HER-002', 'Paraquat (litro)',             3,  210.00,  15, '2027-05-20'),
    ('HER-003', '2,4-D amina (litro)',          3,  165.00,  30, '2026-12-01'),
    ('HER-004', 'Atrazina (kilo)',              3,  140.00,  12, '2027-02-10'),
    ('HER-005', 'Metsulfurón (sobre)',          3,   95.00,   4, '2027-06-30'),
    ('HTA-001', 'Machete de 22 pulgadas',       4,  250.00,   0, NULL),
    ('HTA-002', 'Bomba de mochila (20 L)',      4, 1450.00,   5, NULL),
    ('HTA-003', 'Piocha con cabo',              4,  320.00,   0, NULL);

INSERT INTO movimientos (producto_id, tipo, cantidad, fecha) VALUES
    (1, 'ENTRADA', 30, '2026-10-01'),
    (1, 'SALIDA',   6, '2026-10-05'),
    (4, 'ENTRADA', 200, '2026-10-02'),
    (5, 'SALIDA',  20, '2026-10-06'),
    (7, 'SALIDA',   2, '2026-10-07'),
    (10, 'ENTRADA', 15, '2026-10-03');
