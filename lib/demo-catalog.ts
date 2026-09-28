import { createSkuBase } from "@/lib/sku";

export const canonicalCategories = [
  ["Style", "style", "Wearable stories from Kathmandu streets and farther afield.", "photo-1529139574466-a303027c1d8b"],
  ["Home", "home", "Useful objects that make a room feel considered.", "photo-1618221195710-dd6b41faaea6"],
  ["Tech", "tech", "Quiet technology for work, sound, and everyday movement.", "photo-1498049794561-7780e7231661"],
  ["Outdoors", "outdoors", "Field-tested essentials for hills, trails, and open air.", "photo-1464822759023-fed622ff2c3b"],
] as const;

export const canonicalProducts = [
  ["Kathmandu Carry-All", "kathmandu-carry-all", "Style", "Himali Studio", "Lalitpur, Nepal", 4200, 12, true, "A hard-wearing cotton canvas tote shaped for market mornings and long city days.", "photo-1553062407-98eeb64c6a62"],
  ["Dhaka Field Cap", "dhaka-field-cap", "Style", "Palpali Works", "Palpa, Nepal", 1850, 20, true, "A low-profile cap finished with a handwoven Dhaka textile panel.", "photo-1521369909029-2afed882baee"],
  ["Monsoon Overshirt", "monsoon-overshirt", "Style", "Karkhana Cloth", "Bhaktapur, Nepal", 6800, 7, false, "A breathable layer cut generously for warm rain and cool evenings.", "photo-1596755094514-f87e34085b2c"],
  ["Tempo Everyday Tee", "tempo-everyday-tee", "Style", "Common Goods", "Kathmandu, Nepal", 2200, 0, false, "Heavyweight organic cotton with a relaxed, gender-neutral fit.", "photo-1521572163474-6864f9cf17ab"],
  ["City Loom Scarf", "city-loom-scarf", "Style", "Sana Hastakala", "Kathmandu, Nepal", 2950, 14, false, "A soft loom-woven scarf with a graphic border inspired by city grids.", "photo-1601924994987-69e26d50dc26"],
  ["Ridge Runner", "ridge-runner", "Style", "Veja", "Brazil", 14800, 6, false, "A light everyday trainer made with considered natural and recycled materials.", "photo-1542291026-7eec264c27ff"],
  ["Thimi Clay Lamp", "thimi-clay-lamp", "Home", "Thimi Ceramics", "Bhaktapur, Nepal", 3600, 8, true, "A wheel-thrown table lamp with a warm mineral finish and linen shade.", "photo-1507473885765-e6ed057f782c"],
  ["Lokta Desk Set", "lokta-desk-set", "Home", "Paper Nepal", "Bhaktapur, Nepal", 1650, 22, false, "Three tactile desk pieces wrapped in durable handmade lokta paper.", "photo-1455390582262-044cdead277a"],
  ["Courtyard Throw", "courtyard-throw", "Home", "Ekadesma Home", "Kathmandu, Nepal", 5400, 9, true, "A textured cotton throw in vermilion, ink, and undyed natural yarn.", "photo-1584100936595-c0654b55a2e2"],
  ["Hammered Kansa Bowl", "hammered-kansa-bowl", "Home", "Patan Metalworks", "Lalitpur, Nepal", 2800, 16, false, "A hand-hammered bronze bowl for fruit, snacks, or daily ritual.", "photo-1578749556568-bc2c40e68b61"],
  ["Paper Moon Shade", "paper-moon-shade", "Home", "Hay", "Denmark", 7200, 5, false, "A light paper shade that gives rooms a broad, diffused glow.", "photo-1513506003901-1e6a229e2d15"],
  ["Quiet Hour Incense", "quiet-hour-incense", "Home", "Juniper House", "Dolakha, Nepal", 950, 30, false, "Juniper and cedar incense blended for a clean, grounding burn.", "photo-1603006905003-be475563bc59"],
  ["KTM Mechanical Keyboard", "ktm-mechanical-keyboard", "Tech", "Keychron", "China", 16800, 4, true, "A compact wireless mechanical keyboard tuned for focused desk work.", "photo-1587829741301-dc798b83add3"],
  ["Pocket Power 10K", "pocket-power-10k", "Tech", "Anker", "China", 6400, 18, false, "A slim 10,000 mAh battery for commutes, flights, and trail days.", "photo-1609091839311-d5365f9ff1c5"],
  ["Studio Buds", "studio-buds", "Tech", "Nothing", "United Kingdom", 13200, 11, false, "Clear wireless audio in a transparent, pocketable design.", "photo-1606220588913-b3aacb4d2f46"],
  ["Fold Laptop Stand", "fold-laptop-stand", "Tech", "MOFT", "United States", 4900, 24, false, "An ultra-thin folding stand that travels attached to your laptop.", "photo-1527443224154-c4a3942d3acf"],
  ["Desk Radio Mini", "desk-radio-mini", "Tech", "Muzen", "China", 9800, 3, false, "A palm-sized Bluetooth radio with an analog dial and rich sound.", "photo-1598387993281-cecf8b71a8f8"],
  ["Cable Field Kit", "cable-field-kit", "Tech", "Native Union", "France", 3800, 0, false, "A compact organizer with the essential cables for a mobile setup.", "photo-1555617981-dac3880eac6e"],
  ["Annapurna Daypack", "annapurna-daypack", "Outdoors", "Sherpa Adventure Gear", "Kathmandu, Nepal", 8900, 10, true, "A balanced 24-litre pack for ridge walks and crowded city routes.", "photo-1551632811-561732d1e306"],
  ["Trail Flask", "trail-flask", "Outdoors", "Klean Kanteen", "United States", 3200, 26, false, "An insulated steel flask that keeps tea hot through an early start.", "photo-1602143407151-7111542de6e8"],
  ["Cloudline Shell", "cloudline-shell", "Outdoors", "Patagonia", "Vietnam", 22400, 5, false, "A packable waterproof shell for abrupt shifts in mountain weather.", "photo-1551488831-00ddcb6c6bd3"],
  ["Camp Stool No. 2", "camp-stool-no-2", "Outdoors", "Karnali Canvas", "Nepalgunj, Nepal", 4400, 8, false, "A folding hardwood and canvas perch for camp, balcony, or workshop.", "photo-1475483768296-6163e08872a1"],
  ["Solar Camp Light", "solar-camp-light", "Outdoors", "BioLite", "United States", 7600, 13, false, "A rechargeable solar lantern with a calm, adjustable warm light.", "photo-1504851149312-7a075b496cc7"],
  ["Tamang Trek Blanket", "tamang-trek-blanket", "Outdoors", "Himalayan Weavers", "Rasuwa, Nepal", 6100, 6, false, "A dense wool blanket inspired by highland weaving traditions.", "photo-1528459801416-a9e53bbf4e17"],
] as const;

export function unsplashImage(id: string) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;
}

export function canonicalSku(slug: string) {
  return createSkuBase(slug);
}
