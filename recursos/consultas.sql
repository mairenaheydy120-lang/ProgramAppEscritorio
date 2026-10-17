-- 1. Productos ordenados por precio, del mayor al menor.
SELECT * FROM productos ORDER BY precio DESC;

-- 2. Código, nombre y existencia de los productos con existencia menor que 10.
SELECT codigo, nombre, existencia FROM productos WHERE existencia < 10;

-- 3. Productos que vencen antes del 31/12/2026.
SELECT codigo, nombre, vencimiento FROM productos WHERE vencimiento < '2026-12-31';

-- 4. Cada producto con el nombre de su categoría (JOIN).
SELECT p.codigo, p.nombre, c.nombre AS categoria
FROM productos p JOIN categorias c ON c.id = p.categoria_id;

-- 5. Cuántos productos hay por categoría (GROUP BY).
SELECT c.nombre AS categoria, COUNT(*) AS productos
FROM productos p JOIN categorias c ON c.id = p.categoria_id
GROUP BY c.nombre;

-- 6. Valor total del inventario (precio x existencia).
SELECT SUM(precio * existencia) AS valor_total FROM productos;

-- 7. Nueva categoría «Riego» y un producto de esa categoría.
INSERT INTO categorias (nombre) VALUES ('Riego');
INSERT INTO productos (codigo, nombre, categoria_id, precio, existencia)
VALUES ('RIE-001', 'Manguera de 1/2 pulgada (rollo)', (SELECT id FROM categorias WHERE nombre = 'Riego'), 850.00, 10);

-- 8. Aumento de 5 % al precio de los fertilizantes.
UPDATE productos SET precio = ROUND(precio * 1.05, 2)
WHERE categoria_id = (SELECT id FROM categorias WHERE nombre = 'Fertilizantes');

-- 9. SALIDA de 3 unidades de HER-004.
INSERT INTO movimientos (producto_id, tipo, cantidad)
VALUES ((SELECT id FROM productos WHERE codigo = 'HER-004'), 'SALIDA', 3);

-- 10. Eliminar los productos de Herramientas con existencia 0.
SELECT * FROM productos
WHERE existencia = 0 AND categoria_id = (SELECT id FROM categorias WHERE nombre = 'Herramientas');
DELETE FROM productos
WHERE existencia = 0 AND categoria_id = (SELECT id FROM categorias WHERE nombre = 'Herramientas');
