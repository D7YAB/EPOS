# Hungry Haddock setup

Apply migrations 001 through 006 in filename order to a fresh Supabase project,
then run `seed_hungry_haddock_leaflet_details.sql`, followed by
`seed_hungry_haddock_dinners_special.sql`.
The Hungry Haddock seed uses stable `hh-` IDs and upserts its own rows; it does
not delete existing menus, orders, customers, delivery charges or cached addresses.
Do not run `seed_from_current_db.sql`: that is the old restaurant menu and deletes menu data.

## Photo transcription

Source: IMG_9223.heic, supplied by the owner. Currency: GBP.
41 menu items and 10 categories after the owner-confirmed Dinners Special update. The initial seed includes 5 pie choices;
the supplemental leaflet script expands this to 24 zero-cost variations:
15 pie/sauce combinations, 3 sausage-meal sauces, 3 fish-meal sauces and 3 sachet flavours.
The owner confirmed nugget quantities of 7, 10 and 14. Prices remain
GBP 5.50, 6.50 and 7.90: when the leaflet prices differed, the owner explicitly
chose to keep the shop-board prices.
Fish Cake and Chips is printed twice at GBP 5.00 and is imported once.
Hash Brown is GBP 0.70; Hash Browns (5) is a separate GBP 3.00 item.
Cans are a generic item: the photo does not specify flavours.
The handwritten "Meal" alongside Beef Burger is included in its name.
Cheese Burger is transcribed without assuming unprinted meal contents.
Delivery rates, extra toppings and drink flavours are not invented.

Supplemental sources: IMG_7917.PNG, IMG_7918.PNG and IMG_7919.PNG.
These confirm Gravy, Curry or Peas are included with any pie/chips, large
sausage/chips and large fish/chips meals. Pie and sauce are a single combined
variation because the current app only supports one variation group.
Burgers are labelled Mild. Sauce sachet flavours are Tomato Sauce, Mayonnaise
and Tartare Sauce. The sachet item is named Sauce Sachet and remains GBP 0.30
each; the printed 3x describes the three flavour choices, not a bundle. Potato
Scallop remains GBP 0.40, following the instruction to keep shop-board prices.
Leaflet prices of GBP 5.00/5.99/8.90 for nugget meals, GBP 0.50 per sachet and
GBP 0.30 per scallop are deliberately not applied.
The existing board-only chicken-quarter dishes and large sausage are retained.
The supplemental script changes names and variations only; it does not delete
items, change base prices, touch orders or change access permissions.

## Confirmed Dinners Special

On 25 October 2026, the owner supplied this complete category:

| Item | Price (GBP) |
| --- | ---: |
| Sausage Dinner | 6.00 |
| Fish Cake and Chips | 5.00 |
| Any Pie and Chips | 5.00 |
| Large Sausage and Chips | 5.00 |
| Dice Chicken and Chips and Cheese | 6.00 |
| Chicken Quarter with Chips | 6.50 |
| Chicken Quarter with Rice | 6.50 |

This confirmation supersedes the previous GBP 5.00 Sausage Dinner price.
The typo "Chcken" is normalised to "Chicken". Existing included sauce choices
for the pie and large sausage meals are retained.

## Awaiting confirmation

The cropped GBP 6.00 item under Burgers, which looks like "Donner and Chips",
remains omitted pending confirmation.

## Access and local configuration

The owner explicitly approved restoring main's public-key access model on
25 October 2026. The publishable key can read, create, update and delete rows in
the eight EPOS tables, including orders, customer details and cached addresses.
RLS remains enabled, with unrestricted row policies matching main. The service-role
key is optional; staff roles and login are deferred.

Set these in the ignored `.env.local` file, then restart the app:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
# Optional; leave empty when using the public key. Never use a NEXT_PUBLIC prefix.
SUPABASE_SERVICE_ROLE_KEY=
```

The Next.js app currently has no login. It is running locally on 127.0.0.1.
Staff roles and login are separate features to be added later.

## Public-key access on main versus the current setup

The main branch's SQL policies allow the anon and authenticated database roles
unrestricted reads and writes. With those policies, a publishable key is sufficient;
a server-side service-role key is optional. Staff roles and login are separate features.

The connected project now uses this model, applied as the remote migration
`restore_main_public_key_access`. `access-plans/main-public-key-access.sql` records
the applied change. The initial setup files also match these permissions, scoped
to the eight EPOS tables and the order-number sequence. Anyone holding the public
key can read and change these records, as explicitly approved by the owner.
