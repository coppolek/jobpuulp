import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Careerjet
  app.post("/api/jobs", async (req, res) => {
    try {
      const { keywords, location, radius, sort, page, contract_type, work_hours } = req.body;
      const apiKey = process.env.CAREERJET_API_KEY;
      
      if (!apiKey) {
        return res.status(401).json({
          error: "API key is missing. Please configure CAREERJET_API_KEY in your environment variables.",
          type: "ERROR"
        });
      }
      
      const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "Mozilla/5.0";
      
      const userIp = typeof ip === 'string' ? ip.split(',')[0].trim() : ip[0];

      // Build query string
      const params = new URLSearchParams({
        locale_code: 'it_IT',
        user_ip: userIp,
        user_agent: userAgent,
      });

      if (keywords) params.append('keywords', keywords);
      if (location) params.append('location', location);
      if (radius) params.append('radius', radius.toString());
      if (sort) params.append('sort', sort);
      if (page) params.append('page', page.toString());
      if (contract_type) params.append('contract_type', contract_type);
      if (work_hours) params.append('work_hours', work_hours);

      const url = `https://search.api.careerjet.net/v4/query?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
          'X-Forwarded-For': userIp,
          'Referer': req.headers.referer || req.headers.origin || 'https://jobsearch.com'
        }
      });

      const data = await response.json();
      
      if (!response.ok || data.type === 'ERROR') {
        console.error("CareerJet API Error Response:", data);
        
        let errorMessage = data.error || "Failed to fetch jobs from Careerjet API";
        
        // Handle specific CareerJet IP whitelist error
        if (errorMessage.includes("Unauthorized access from IP")) {
          errorMessage = `CareerJet API Error: ${errorMessage}. You need to whitelist this server IP in your CareerJet account dashboard or contact their support to allow dynamic IPs.`;
        }

        return res.status(response.status !== 200 ? response.status : 400).json({ 
          error: errorMessage,
          details: data
        });
      }
      
      res.json(data);
    } catch (error) {
      console.error("CareerJet API Error:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
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
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
