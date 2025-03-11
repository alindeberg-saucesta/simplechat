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
  const model = 'your-model-name'; // e.g., 'llama2'

  try {
    const response = await fetch(`http://localhost:11434/run/${model}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) throw new Error('API request failed');

    // Stream response from Ollama to client
    const reader = response.body.getReader();
    res.setHeader('Content-Type', 'text/event-stream');
    
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      res.write(`data: ${new TextDecoder().decode(value)}\n\n`);
    }
    res.end();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ error: 'An error occurred' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
