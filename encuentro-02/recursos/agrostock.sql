-- AgroStock – Encuentro 2: base de datos SQLite
-- Ejecutar en DB Browser for SQLite (pestaña "Ejecutar SQL") o con: sqlite3 agrostock.db < agrostock.sql

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS movimientos;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS categorias;

-- DDL: definición de datos
CREATE TABLE categorias (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre  TEXT    NOT NULL UNIQUE
);

CREATE TABLE productos (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo        TEXT    NOT NULL UNIQUE,
    nombre        TEXT    NOT NULL,
    categoria_id  INTEGER NOT NULL REFERENCES categorias(id),
    precio        REAL    NOT NULL CHECK (precio > 0),
    existencia    INTEGER NOT NULL DEFAULT 0 CHECK (existencia >= 0),
    vencimiento   TEXT    NULL          -- formato ISO: AAAA-MM-DD
);

CREATE TABLE movimientos (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id  INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    tipo         TEXT    NOT NULL CHECK (tipo IN ('ENTRADA','SALIDA')),
    cantidad     INTEGER NOT NULL CHECK (cantidad > 0),
    fecha        TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE INDEX ix_productos_nombre ON productos(nombre);

-- DML: datos de ejemplo
INSERT INTO categorias (nombre) VALUES
 ('Fertilizantes'), ('Semillas'), ('Plaguicidas'), ('Herramientas'), ('Veterinaria');

INSERT INTO productos (codigo, nombre, categoria_id, precio, existencia, vencimiento) VALUES
 ('FER-001', 'Urea 46 % (quintal)',              1, 1450.00, 35, NULL),
 ('FER-002', 'Fórmula 18-46-0 (quintal)',        1, 1680.00,  8, NULL),
 ('FER-003', 'Fórmula 15-15-15 (quintal)',       1, 1590.00, 22, NULL),
 ('SEM-010', 'Semilla de frijol INTA Rojo (lb)', 2,   45.00,120, '2027-03-31'),
 ('SEM-011', 'Semilla de maíz NB-6 (lb)',        2,   38.00, 90, '2027-01-15'),
 ('PLA-020', 'Fungicida cúprico (kg)',           3,  310.00,  6, '2026-12-31'),
 ('HER-004', 'Machete 22 pulgadas',              4,  260.00, 14, NULL),
 ('HER-005', 'Bomba de mochila 20 L',            4, 2350.00,  3, NULL),
 ('VET-030', 'Desparasitante bovino (frasco)',   5,  420.00, 11, '2026-11-30');

INSERT INTO movimientos (producto_id, tipo, cantidad) VALUES
 (1, 'ENTRADA', 40), (1, 'SALIDA', 5), (2, 'ENTRADA', 10), (2, 'SALIDA', 2), (7, 'SALIDA', 1);

-- Consultas de práctica (descomentar una a una)
-- SELECT * FROM productos;
-- SELECT codigo, nombre, precio FROM productos WHERE existencia < 10 ORDER BY existencia;
-- SELECT c.nombre AS categoria, COUNT(*) AS cantidad, SUM(p.precio * p.existencia) AS valor
--   FROM productos p JOIN categorias c ON c.id = p.categoria_id GROUP BY c.nombre;
-- UPDATE productos SET precio = precio * 1.05 WHERE categoria_id = 1;
-- DELETE FROM productos WHERE codigo = 'HER-005';
