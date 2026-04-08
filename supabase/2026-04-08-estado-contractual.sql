insert into public.ficha_estado_tipos (codigo, etiqueta, tipo_input, opciones_json, is_active, sort_order)
values (
  'estado_contractual',
  'Estado contractual',
  'select',
  '["Inscrito","Pendiente de enviar a notaría","Pendiente de firma de René en notaría","Listo para retiro del cliente","Contrato entregado"]'::jsonb,
  true,
  25
)
on conflict (codigo) do update
set etiqueta = excluded.etiqueta,
    tipo_input = excluded.tipo_input,
    opciones_json = excluded.opciones_json,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order;
