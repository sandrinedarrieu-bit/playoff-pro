export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const AIRTABLE_TOKEN = process.env.AIRTABLE_WEPLAY_TOKEN;
  const BASE_ID = 'appxMJADTuUDIs91H';
  const TABLE_ID = 'tblZZZOdXFA0Y3DUU'; // Reservation_WePlay

  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'session_id manquant' });

  try {
    const sr = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session_id}`, {
      headers: { Authorization: `Basic ${Buffer.from(SECRET_KEY + ':').toString('base64')}` }
    });
    const session = await sr.json();
    if (!sr.ok) throw new Error(session?.error?.message || 'Session Stripe introuvable');

    if (session.payment_status !== 'paid') {
      return res.status(200).json({ paid: false });
    }

    const meta = session.metadata || {};

    // Évite de créer un doublon si la page de confirmation est rechargée
    const checkFormula = encodeURIComponent(`{Reference_stripe}="${session_id}"`);
    const checkUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?filterByFormula=${checkFormula}`;
    const checkResp = await fetch(checkUrl, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
    const checkData = await checkResp.json();

    if (checkData.records && checkData.records.length) {
      return res.status(200).json({
        paid: true,
        reservation: checkData.records[0].fields,
        terrainNom: meta.terrainNom,
        sport: meta.sport
      });
    }

    const createBody = {
      fields: {
        'Nom_client': meta.nom || session.customer_details?.name || '',
        'Terrain': meta.terrainId ? [meta.terrainId] : [],
        'Email_client': session.customer_details?.email || '',
        'Date_creneau': meta.date || '',
        'Heure_creneau': meta.heure || '',
        'Nombre_joueurs': meta.joueurs ? Number(meta.joueurs) : null,
        'Prix': meta.prix ? Number(meta.prix) : null,
        'Statut_paiement': 'Validé',
        'Reference_stripe': session_id
      }
    };

    const cr = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(createBody)
    });
    const created = await cr.json();
    if (!cr.ok) throw new Error(created?.error?.message || 'Erreur d\'écriture Airtable');

    res.status(200).json({ paid: true, reservation: created.fields, terrainNom: meta.terrainNom, sport: meta.sport });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
