const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Route for chatting with Ollama
app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body;
  const model = 'llama2'; // Update with your model name

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: true
      })
    });

    if (!response.ok) throw new Error('API request failed');

    // Stream response from Ollama to client
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });

      // Parse each chunk as JSON and extract response text
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.response) {
            res.write(`data: ${json.response}\n\n`);
          }
        } catch (e) {
          console.error('Error parsing JSON:', e);
        }
      }
    }

    res.end();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
