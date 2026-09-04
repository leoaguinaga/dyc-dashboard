# Catálogo de la Biblioteca de Ayuda

La Biblioteca se organiza por **funcionalidad**, no por rol. Cada guía describe
una tarea una sola vez y `rolesAplicables` determina qué usuarios pueden verla.

## Agregar una funcionalidad

1. Crea un archivo dentro de `catalogo/modulos/<modulo>.ts`.
2. Declara cada guía con `definirGuia` desde `catalogo/schema.ts`.
3. Completa título orientado a una acción, objetivo, requisitos previos, pasos,
   resultado esperado, términos de búsqueda, roles, ruta, versión y fecha de
   revisión.
4. Exporta las guías del módulo desde `catalogo/index.ts`.
5. Verifica los textos y rutas contra la interfaz real antes de actualizar
   `ultimaRevision`.
6. Ejecuta `pnpm lint` y `pnpm build`.

Las capturas y los videos son opcionales. La explicación escrita siempre debe
ser suficiente para completar la tarea sin depender de ellos.
