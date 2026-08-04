alter table hitos_preproduccion add column porcentaje int not null default 0 check (porcentaje >= 0 and porcentaje <= 100);
