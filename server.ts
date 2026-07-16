import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proxy endpoint for PNCP to avoid CORS issues
  app.get("/api/pncp-proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: "Missing target URL" });
    }

    if (!targetUrl.startsWith("https://pncp.gov.br/api/")) {
      return res.status(403).json({ error: "Invalid target URL" });
    }

    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(targetUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "Connection": "close"
          }
        });

        if (!response.ok) {
          if (response.status === 429 || response.status >= 500) {
            console.warn(`Proxy fetch warning (attempt ${attempt}/${maxRetries}): PNCP returned ${response.status} ${response.statusText}`);
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
              continue;
            }
          }
          return res.status(response.status).json({ error: `PNCP API error: ${response.statusText}` });
        }

        const data = await response.json();
        return res.json(data);
      } catch (error: any) {
        lastError = error;
        console.error(`Proxy error (attempt ${attempt}/${maxRetries}) fetching ${targetUrl}:`, error.message || error);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1500 * attempt));
        }
      }
    }

    res.status(500).json({ 
      error: "Failed to fetch from PNCP after multiple retries", 
      details: lastError?.message || String(lastError) 
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
