export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE_ID = 'tblCndP7xpOW1VpOm';

  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?sort[0][field]=DateD%C3%A9but&sort[0][direction]=desc`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    const data = await response.json();

    const competitions = data.records.map(r => ({
      id: r.id,
      nom: r.fields['NomCompetition'] || '',
      statut: r.fields['Statut_competition'] || 'Brouillon',
      discipline: r.fields['Disciplines'] || '',
      ville: r.fields['Villes/zone geographique'] || '',
      dateDebut: r.fields['DateDébut'] || '',
      dateFin: r.fields['DateFin'] || '',
      preparationEnvoyee: r.fields['Preparation_envoyee'] || false,
      lienFiche: r.fields['Lien_fiche_doc'] || null,
      equipes: r.fields['Equipe'] || []
    }));

    res.status(200).json({ competitions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
