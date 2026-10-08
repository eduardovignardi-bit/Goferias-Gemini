alter table public.properties
  add column if not exists preco_inteligente_ativo boolean not null default false;
