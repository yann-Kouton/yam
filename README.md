# Yâmarché — React App

## Stack
- **Vite** + **React 18**
- **Firebase** (Firestore + Auth)
- **Cloudinary** (images)
- **Framer Motion** (animations)
- **Tailwind CSS**
- **lucide-react** (icônes — remplace les emojis de la V1)

## Installation

```bash
npm install
npm run dev
```

## Configuration Firebase & Cloudinary

Toutes les clés sont centralisées dans `src/lib/firebase.js` — remplace les
valeurs `VOTRE_...` :

```js
const firebaseConfig = {
  apiKey:            "ta_vraie_clé",
  authDomain:        "ton-projet.firebaseapp.com",
  projectId:         "ton-projet-id",
  storageBucket:     "ton-projet.appspot.com",
  messagingSenderId: "ton_sender_id",
  appId:             "ton_app_id",
}
export const CLOUDINARY_CLOUD = 'ton_cloud_name'
```

## Déployer les règles de sécurité Firestore

Le fichier `firestore.rules` (à la racine) définit qui peut lire/écrire quoi.
À faire une fois le projet Firebase créé :

```bash
firebase deploy --only firestore:rules
```

## Rôles & espaces

L'app a **3 espaces**, choisis automatiquement selon le champ `role` du
document `users/{uid}` :

| Rôle      | Espace rendu   | Accès |
|-----------|----------------|-------|
| `client`  | `ClientApp`    | Accueil, Marché, Planning, Bons Plans, Panier, Profil |
| `vendeur` | `VendorApp`    | Dashboard, Produits, Surplus, Commandes, Profil |
| `admin`   | `AdminApp`     | Dashboard, Modération produits, Signalements, Utilisateurs, Diffusion, Profil |

Tout nouvel utilisateur reçoit automatiquement `role: "client"` et
`status: "active"` à la première connexion (voir `src/context/AppContext.jsx`).
Un compte `status: "suspended"` voit un écran de blocage quel que soit son
rôle.

### Devenir vendeur

Un client peut faire une demande depuis son Profil (« Devenir vendeur »),
ce qui pose `vendorRequestStatus: "pending"` sur son document `users/{uid}`.
Un admin approuve ou refuse la demande depuis **Utilisateurs → Demandes
vendeur** ; l'approbation bascule `role` sur `"vendeur"`.

### Modération des produits

Toute création ou modification de produit par un vendeur repasse le champ
`status` du produit à `"pending"`. Le catalogue client (`useApp().products`)
ne montre que les produits `"approved"` (ou sans champ `status`, pour
compatibilité avec des données de démo existantes). Un admin approuve ou
refuse (avec motif) depuis **Produits** dans l'espace admin.

### Signalements

Chaque produit affiche un petit bouton drapeau (icône `Flag`) permettant à
un client connecté de signaler un contenu. Le signalement est écrit dans la
collection `reports` et traité depuis **Signalements** dans l'espace admin.

## Structure Firestore

### Collection `users`
```json
{
  "displayName": "Awa Koné",
  "email": "awa@example.com",
  "role": "client",
  "status": "active",
  "vendorRequestStatus": "none",
  "createdAt": "timestamp"
}
```
`role`: `client` | `vendeur` | `admin` — `status`: `active` | `suspended` —
`vendorRequestStatus`: `none` | `pending` | `approved` | `rejected`.

Pour créer ton premier compte admin : inscris-toi normalement dans l'app
(tu deviens `client`), puis modifie manuellement `role` en `"admin"` sur ce
document depuis la console Firebase.

### Collection `products`
```json
{
  "name": "Tomates fraîches",
  "category": "Légumes",
  "price": 1500,
  "unit": "kg",
  "cloudinaryId": "yamarche/tomates",
  "featured": true,
  "isOrganic": false,
  "badge": "NOUVEAU",
  "vendorId": "uid_du_vendeur",
  "vendorName": "Ferme Koné",
  "status": "pending",
  "rejectionReason": "",
  "createdAt": "timestamp"
}
```

### Collection `surplusDeals`
```json
{
  "vendorId": "uid_du_vendeur",
  "vendorName": "Restaurant Chez Tanti",
  "vendorType": "Restaurant",
  "description": "Panier surprise du soir...",
  "originalPrice": 5000,
  "surplusPrice": 2000,
  "discount": 60,
  "pickupStart": "18:00",
  "pickupEnd": "20:00",
  "remainingCount": 3,
  "zone": "Cocody, Abidjan",
  "rating": 4.8,
  "tags": ["Plat chaud", "Riz", "Poulet"],
  "active": true
}
```

### Collection `orders`
Auto-générée au checkout. Contient désormais `vendorIds` (tableau des
`vendorId` présents dans le panier) pour permettre à chaque vendeur de
retrouver ses commandes via une requête `array-contains`.

### Collection `reports`
```json
{
  "type": "product",
  "targetId": "id_du_produit",
  "targetLabel": "Tomates fraîches",
  "reason": "Prix trompeur",
  "details": "...",
  "reporterId": "uid_du_client",
  "status": "open",
  "createdAt": "timestamp"
}
```

### Collection `notifications`
```json
{
  "audience": "users",
  "recipientIds": ["uid_1", "uid_2"],
  "type": "order",
  "title": "Nouvelle commande reçue 🛒",
  "desc": "Commande #A1B2C3D4 · ...",
  "readBy": ["uid_1"],
  "createdBy": "uid_ou_admin",
  "createdAt": "timestamp"
}
```
`audience` : `'all'` (tous les utilisateurs, réservé aux admins) · `'admins'`
(tous les comptes admin) · `'users'` (ciblage précis via `recipientIds`).
Créées automatiquement par `src/lib/notifications.js` à chaque action clé :
nouvelle commande (client → vendeurs + admins), modération produit (admin →
vendeur), demande/traitement vendeur, suspension de compte, signalement
(client → admins) et sa résolution (admin → rapporteur). Un admin peut aussi
diffuser librement une notification (à tous, par rôle, ou à des utilisateurs
choisis) depuis **Diffusion** dans l'espace admin.

Le front écoute deux requêtes Firestore simples (une par `recipientIds`
`array-contains`, une par `audience` `in`) fusionnées côté client, afin
d'éviter tout index composite Firestore à créer manuellement.

## Structure du code

```
src/
├── main.jsx
├── App.jsx                # Auth + routage par rôle (Client/Vendor/Admin)
├── lib/
│   ├── firebase.js        # Config Firebase + Cloudinary
│   └── notifications.js   # Création de notifications Firestore (ciblées / diffusées)
├── constants/index.js     # Zones, promos, rôles, statuts, animations, catIcon
├── context/AppContext.jsx # Auth, doc users/{uid}, panier, produits, toasts
├── hooks/
│   ├── useToast.js
│   └── useFirestoreCollection.js
├── ui/                     # Composants partagés (Header, BottomNav, Toast,
│                            # StatusPill, BottomSheet, RoleProfile, PwaBanner...)
├── client/                 # Espace client (Accueil, Marché, Planning,
│                            # Bons Plans, Panier, Checkout, Profil, Assistant Yâ)
├── vendeur/                 # Espace vendeur (Dashboard, Produits, Surplus, Commandes)
└── admin/                   # Espace admin (Dashboard, Produits, Signalements, Utilisateurs,
                              # Diffusion de notifications)
```

## Déploiement Firebase Hosting

```bash
npm run build
firebase deploy
```
