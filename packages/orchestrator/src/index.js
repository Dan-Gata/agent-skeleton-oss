const express = require('express');
const axios   = require('axios');
const app     = express();
const port    = 3000;

// Appelle le webhook n8n en production
app.get('/workflow', async (req, res) => {
  try {
    // Remplace cette URL par celle de ton workflow n8n en mode production
    const webhookUrl = 'https://n8n.kaussan-air.org/webhook/monWebhook';
    await axios.post(webhookUrl, { message: 'Coucou depuis l’orchestrateur' });
    res.send('Webhook n8n déclenché !');
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de l'appel du webhook");
  }
});

app.listen(port, () => {
  console.log(`Orchestrateur à l’écoute sur http://localhost:${port}`);
});
