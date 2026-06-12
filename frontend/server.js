import { serve } from "bun";

serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname === "/" ? "/_shell.html" : url.pathname;
    
    if (!path.includes(".")) {
      path += "/index.html";
    }
    
    const file = Bun.file(`dist/client${path}`);
    return file.size ? new Response(file) : new Response("Not Found", { status: 404 });
  },
});
