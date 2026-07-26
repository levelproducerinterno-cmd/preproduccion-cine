insert into departamentos (nombre, orden) values
  ('Dirección/AD', 1),
  ('Producción', 2),
  ('Fotografía', 3),
  ('Gaffer', 4),
  ('Arte', 5),
  ('Sonido', 6),
  ('Vestuario', 7),
  ('Maquillaje', 8);

insert into desglose_categorias (proyecto_id, nombre, es_estandar, orden) values
  (null, 'Elenco', true, 1),
  (null, 'Extras/Ambiente', true, 2),
  (null, 'Vehículos', true, 3),
  (null, 'Utilería', true, 4),
  (null, 'Vestuario', true, 5),
  (null, 'Maquillaje/Peinado', true, 6),
  (null, 'Efectos especiales', true, 7),
  (null, 'Equipo especial', true, 8),
  (null, 'Sonido', true, 9),
  (null, 'Animales', true, 10),
  (null, 'Seguridad', true, 11),
  (null, 'Notas', true, 12);
