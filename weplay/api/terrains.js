export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const TOKEN = process.env.AIRTABLE_WEPLAY_TOKEN;
  const BASE_ID = 'appxMJADTuUDIs91H';
  const TABLE_TERRAINS = 'tblLaiZeQZvAAdlBL';
  const TABLE_RESA = 'tblZZZOdXFA0Y3DUU';

  try {
    // 1. Terrains (nom, ville, sport, capacité)
    const terrainsUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_TERRAINS}`;
    const terrainsResp = await fetch(terrainsUrl, { headers: { Authorization: `Bearer ${TOKEN}` } });
    const terrainsData = await terrainsResp.json();
    if (!terrainsResp.ok) throw new Error(terrainsData?.error?.message || 'Erreur Airtable (Terrains)');

    // 2. Lignes tarifaires de référence dans Reservation_WePlay (une par terrain, avec Prix rempli)
    const resaUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_RESA}`;
    const resaResp = await fetch(resaUrl, { headers: { Authorization: `Bearer ${TOKEN}` } });
    const resaData = await resaResp.json();
    if (!resaResp.ok) throw new Error(resaData?.error?.message || 'Erreur Airtable (Reservation_WePlay)');

    // Associe chaque terrain à son prix via le lien "Terrain" des lignes tarifaires
    const prixParTerrain = {};
    (resaData.records || []).forEach(r => {
      const liens = r.fields['Terrain'] || [];
      const prix = r.fields['Prix'];
      if (liens.length && typeof prix === 'number') {
        // En cas de plusieurs lignes pour un même terrain, on garde la plus récente
        prixParTerrain[liens[0]] = prix;
      }
    });

    const terrains = (terrainsData.records || [])
      .map(r => ({
        id: r.id,
        nom: r.fields['Nom terrain'] || '(sans nom)',
        ville: r.fields['Ville 2'] || '',
        capacite: r.fields['Capacité'] || null,
        sport: r.fields['Sport pratiqué'] || '',
        prix: prixParTerrain[r.id] ?? null
      }))
      .filter(t => t.prix !== null); // on n'affiche que les terrains ayant un tarif défini

    res.status(200).json({ terrains });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
