const express = require('express');
const fs = require('fs');
const path = require('path');
const commentJson = require('comment-json');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/app.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(path.join(__dirname, 'app.js'));
});

let config;
try {
  const configData = fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8');
  config = commentJson.parse(configData);
} catch (error) {
  console.error('Error loading config.json:', error);
  process.exit(1);
}

const PORT = config.port || 4000;

function generateButtonId(index) {
  return `btn_${index}`;
}

app.get('/api/config', (req, res) => {
  try {
    const buttons = Array.isArray(config.buttons) ? config.buttons : [];
    console.log('Sending config with', buttons.length, 'buttons');
    const response = {
      branding: config.branding || 'Shitbox Chooser',
      buttons: buttons.map((btn, index) => ({
        id: btn.id || generateButtonId(index),
        name: btn.name || 'Unnamed Button',
        url: btn.url || '#',
        passwordProtected: btn.passwordProtected || false,
        showDisclaimer: btn.showDisclaimer || false,
        disclaimer: btn.disclaimer || '',
        useBootstrap: btn.useBootstrap !== undefined ? btn.useBootstrap : true
      }))
    };
    console.log('Response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('Error in /api/config:', error);
    res.status(500).json({ error: error.message });
  }
});
app.post('/api/verify-password', (req, res) => {
  const { buttonId, password } = req.body;
  
  const buttonIndex = parseInt(buttonId.replace('btn_', ''));
  const button = config.buttons[buttonIndex] || config.buttons.find(btn => btn.id === buttonId);
  
  if (!button) {
    return res.status(404).json({ error: 'Button not found' });
  }
  
  if (button.passwordProtected && password === button.password) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

app.get('/', (req, res) => {
  try {
    let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    res.send(html);
  } catch (error) {
    console.error('Error loading index.html:', error);
    res.status(500).send('Error loading page');
  }
});

app.listen(PORT, () => {
  console.log(`Shitbox Chooser running at http://localhost:${PORT}`);
});

