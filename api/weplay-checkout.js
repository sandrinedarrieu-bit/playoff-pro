export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const SECRET_KEY = process.env.STRIPE_SECRET_KEY;

  try {
    const { terrainId, terrainNom, sport, date, heure, joueurs, prix, email, nom } = req.body;

    if (!terrainId || !prix) {
      return res.status(400).json({ error: 'Informations de réservation incomplètes' });
    }

    // Vérification anti-double-réservation : ce créneau est-il déjà pris pour ce terrain ?
    const AIRTABLE_TOKEN = process.env.AIRTABLE_WEPLAY_TOKEN;
    const BASE_ID = 'appxMJADTuUDIs91H';
    const TABLE_RESA = 'tblZZZOdXFA0Y3DUU';
    const terrainNomEscaped = String(terrainNom || '').replace(/"/g, '\\"');
    const conflictFormula = encodeURIComponent(
      `AND({Statut_paiement}="Validé", {Date_creneau}="${date}", {Heure_creneau}="${heure}", FIND("${terrainNomEscaped}", ARRAYJOIN({Terrain})))`
    );
    const conflictUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_RESA}?filterByFormula=${conflictFormula}`;
    const conflictResp = await fetch(conflictUrl, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
    const conflictData = await conflictResp.json();
    if (conflictResp.ok && conflictData.records && conflictData.records.length > 0) {
      return res.status(409).json({ error: 'Ce créneau vient d\'être réservé par quelqu\'un d\'autre. Merci d\'en choisir un autre.' });
    }

    const origin = `https://${req.headers.host}`;

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('payment_method_types[0]', 'card');
    params.append('line_items[0][price_data][currency]', 'eur');
    params.append('line_items[0][price_data][product_data][name]', `${terrainNom} — ${sport} — ${date} ${heure}`);
    params.append('line_items[0][price_data][unit_amount]', String(Math.round(Number(prix) * 100)));
    params.append('line_items[0][quantity]', '1');
    params.append('success_url', `${origin}/weplay/?session_id={CHECKOUT_SESSION_ID}&screen=confirmation`);
    params.append('cancel_url', `${origin}/weplay/?screen=recap&cancelled=1`);
    if (email) params.append('customer_email', email);
    params.append('metadata[terrainId]', terrainId);
    params.append('metadata[terrainNom]', terrainNom || '');
    params.append('metadata[sport]', sport || '');
    params.append('metadata[date]', date || '');
    params.append('metadata[heure]', heure || '');
    params.append('metadata[joueurs]', String(joueurs || ''));
    params.append('metadata[prix]', String(prix));
    params.append('metadata[nom]', nom || '');

    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    const session = await r.json();
    if (!r.ok) throw new Error(session?.error?.message || 'Erreur Stripe');

    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
