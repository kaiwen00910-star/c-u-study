alter table public.school_logos
  add column display_name text,
  alter column logo_url drop not null,
  add constraint school_logos_display_name_length
    check (display_name is null or char_length(btrim(display_name)) between 1 and 40);
