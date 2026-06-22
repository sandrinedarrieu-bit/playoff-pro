export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE_ID = 'tblIFbvixtcOMHnYY';

  const { competitionId } = req.query;

  try {
    let url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;
    if (competitionId) {
      const filter = encodeURIComponent(`FIND("${competitionId}", ARRAYJOIN({Compétition_Lien}))`);
      url += `?filterByFormula=${filter}`;
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    const data = await response.json();

    const equipes = (data.records || []).map(r => ({
      id: r.id,
      nom: r.fields['Equipe'] || '',
      nbJoueurs: r.fields['Nombre_joueurs_par_equipe'] || 0,
      statut: r.fields['Statut'] || '',
      inscriptionValidee: r.fields['Inscription validée'] || '',
      competition: r.fields['NomCompetition (from Compétition_Lien)'] || []
    }));

    res.status(200).json({ equipes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
