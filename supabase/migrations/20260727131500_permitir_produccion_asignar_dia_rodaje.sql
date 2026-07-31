-- Asignar escenas a días de rodaje es tarea de Producción, no solo de Dirección/AD.
-- Se agrega una política adicional (permisiva, se combina con la existente) en vez de
-- reemplazar la de guion para no aflojar quién puede escribir el contenido del guion.
create policy "escenas_update_produccion" on escenas for update to authenticated
  using (es_ad_o_produccion(proyecto_id))
  with check (es_ad_o_produccion(proyecto_id));
