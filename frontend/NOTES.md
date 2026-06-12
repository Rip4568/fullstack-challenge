Esse arquivo serve para ditar e anotar todas as tomadas de decisão que eu fiz durante o processo de desnvolvimento.
Durante a fase de setup passei por um problema como:

----

PS C:\Users\jonathas\Desktop\things\codes\fullstack-challenge\frontend> bun run dev                     
$ vite dev --port 3000
failed to load config from C:\Users\jonathas\Desktop\things\codes\fullstack-challenge\frontend\vite.config.ts
error when starting dev server:
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'nitro' imported from C:\Users\jonathas\Desktop\things\codes\fullstack-challenge\node_modules\.bun\nitro-nightly@3.0.1-20260611-123640-7765bcb7+d0489808e633805b\node_modules\nitro-nightly\dist\_build\common.mjs
    at Object.getPackageJSONURL (node:internal/modules/package_json_reader:301:9)
    at packageResolve (node:internal/modules/esm/resolve:768:81)
    at moduleResolve (node:internal/modules/esm/resolve:859:18)
    at defaultResolve (node:internal/modules/esm/resolve:992:11)
    at #cachedDefaultResolve (node:internal/modules/esm/loader:691:20)
    at #resolveAndMaybeBlockOnLoaderThread (node:internal/modules/esm/loader:708:38)
    at ModuleLoader.resolveSync (node:internal/modules/esm/loader:740:52)
    at #resolve (node:internal/modules/esm/loader:673:17)
    at ModuleLoader.getOrCreateModuleJob (node:internal/modules/esm/loader:593:35)
    at ModuleJob.syncLink (node:internal/modules/esm/module_job:163:33) {
  code: 'ERR_MODULE_NOT_FOUND'
}
error: script "dev" exited with code 1
PS C:\Users\jonathas\Desktop\things\codes\fullstack-challenge\frontend> bun install
bun install v1.3.14 (0d9b296a)

Checked 378 installs across 460 packages (no changes) [128.00ms]

----

Aparenemente eses problema era por causa da versão do nitro em especifico configurado no packge.json no frontend:
nitro": "npm:nitro-nightly@latest"
Puxando uma versão problematica (3.0.1-20260611) que não foi depurada corretamente. por tanto deeixei setado na versão:
"nitro": "^3.0.0"

NOTA IMPORTANTE: com isso fica lição, JAMAIS setar em @latest as versões do Nitro.
