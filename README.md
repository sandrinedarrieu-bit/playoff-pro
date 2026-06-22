# PlayOff Pro — Projet Professionnel RNCP 39108

Portfolio de soutenance — Bootcamp Product Builder No-Code — École Cube — Sandrine Darrieu / CHIC OUF

## Structure

```
playoff-pro/
├── index.html              ← Page d'accueil hub (présentation des 2 projets)
├── manager/
│   ├── index.html          ← Dashboard PlayOff (connecté Airtable)
│   └── api/
│       ├── competitions.js ← GET /manager/api/competitions
│       └── equipes.js      ← GET /manager/api/equipes
├── suivi/
│   └── index.html          ← Suivi des 12 sprints (2 projets, statuts)
├── dossier/
│   └── index.html          ← Dossier écrit de soutenance Q1.1 → Q4.4
└── vercel.json
```

## Déploiement

### 1. GitHub
```bash
git init
git add .
git commit -m "init playoff-pro"
git remote add origin https://github.com/TON-USER/playoff-pro.git
git push -u origin main
```

### 2. Vercel
- vercel.com → New Project → importer le repo
- Settings → Environment Variables :

| Nom | Valeur |
|-----|--------|
| `AIRTABLE_TOKEN` | ton Personal Access Token (pat...) |
| `AIRTABLE_BASE_ID` | `appk3ibcTEHYCJXtz` |

- Redeploy après avoir ajouté les variables

## URLs
- `/` → accueil hub
- `/manager` → dashboard Airtable (Projet 1)
- `/suivi` → tableau de suivi 12 semaines
- `/dossier` → dossier de soutenance écrit
