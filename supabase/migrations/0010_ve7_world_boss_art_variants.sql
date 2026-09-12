-- VE-7-BOSS-ART-VARIANT-MANIFEST
-- Decision canonica sobre los artes de jefe mundial no inscritos del bucket
-- `vexforge-assets`: los 15 archivos `bosses/boss_*.jpg` corresponden 1:1 con
-- los 15 jefes vivos de `public.world_bosses` (variante de arte con nombre en
-- espanol). No son basura ni duplicados byte a byte: se inscriben en el
-- manifiesto oficial con rol semantico `world_boss_art_variant` y quedan
-- deshabilitados (`enabled=false`) porque el arte consumido por el juego sigue
-- siendo el declarado en `world_bosses.image_url`. Esta migracion NO cambia
-- ninguna URL consumida, ningun dato de juego ni ninguna politica.

begin;

with variant(file_name, boss_name) as (
  values
    ('boss_aetherion_dios_roto.jpg',        'Aetherion Dios Roto'),
    ('boss_devastador_de_sombras.jpg',      'Devastador de Sombras'),
    ('boss_drake_de_cenizas.jpg',           'Drake de Cenizas'),
    ('boss_el_maestro_forjador.jpg',        'El Maestro Forjador'),
    ('boss_el_origen.jpg',                  'El Origen'),
    ('boss_el_tejedor_de_realidades.jpg',   'El Tejedor de Realidades'),
    ('boss_karrath_el_devorador.jpg',       'Karrath el Devorador'),
    ('boss_la_reina_vacia.jpg',             'La Reina Vacía'),
    ('boss_la_sombra_del_olvido.jpg',       'La Sombra del Olvido'),
    ('boss_nexus7_el_calculador.jpg',       'Nexus-7 El Calculador'),
    ('boss_pyrethis_senor_del_caos.jpg',    'Pyrethis Señor del Caos'),
    ('boss_senor_del_hierro.jpg',           'Señor del Hierro'),
    ('boss_titan_de_la_zona_de_guerra.jpg', 'Titán de la Zona de Guerra'),
    ('boss_valdris_el_inmortal.jpg',        'Valdris el Inmortal'),
    ('boss_vexus_prime.jpg',                'VEXUS Prime')
)
insert into public.vexforge_official_asset_manifest
  (asset_pack, asset_code, internal_path, file_name, semantic_role, display_name, source_zip_url, official, enabled)
select
  'bosses',
  'bosses_' || replace(v.file_name, '.jpg', '') || '_variant',
  'bosses/' || v.file_name,
  v.file_name,
  'world_boss_art_variant',
  w.name,
  'https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/bosses/' || v.file_name,
  true,
  false
from variant v
join public.world_bosses w on w.name = v.boss_name
join storage.objects o
  on o.bucket_id = 'vexforge-assets' and o.name = 'bosses/' || v.file_name
where not exists (
  select 1 from public.vexforge_official_asset_manifest m
  where m.internal_path = 'bosses/' || v.file_name
);

commit;
