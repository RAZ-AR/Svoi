// Svoi — Seed script: creates 20 sample listings for dev/testing
// Run: npx tsx scripts/seed-listings.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SAMPLE_LISTINGS = [
  { category_slug: "rent",      title: "Комната в Нови Београде, Блок 45",       price: 350,  currency: "EUR", address: "Нови Београд", lat: 44.8056, lng: 20.4192 },
  { category_slug: "rent",      title: "Студия в Земуне, 10 мин от центра",       price: 450,  currency: "EUR", address: "Земун",        lat: 44.8402, lng: 20.4016 },
  { category_slug: "stuff",     title: "Диван IKEA Söderhamn, отличное состояние", price: 350,  currency: "EUR", address: "Нови Београд", lat: 44.8123, lng: 20.4231 },
  { category_slug: "stuff",     title: "iPhone 14 Pro Max 256GB Space Black",      price: 900,  currency: "EUR", address: "Врачар",       lat: 44.7921, lng: 20.4681 },
  { category_slug: "jobs",      title: "Ищу разработчика React (удалённо)",        price: null, currency: "EUR", address: "Белград",       lat: 44.8176, lng: 20.4569 },
  { category_slug: "jobs",      title: "Требуется официант со знанием русского",   price: null, currency: "RSD", address: "Стари град",   lat: 44.8178, lng: 20.4612 },
  { category_slug: "services",  title: "Переезд по Белграду, грузовик + грузчики", price: 50,   currency: "EUR", address: "Нови Београд", lat: 44.8056, lng: 20.4192 },
  { category_slug: "services",  title: "Репетитор по сербскому языку (онлайн)",    price: 20,   currency: "EUR", address: "Белград",       lat: 44.8176, lng: 20.4569 },
  { category_slug: "transport", title: "Продаю Volkswagen Golf 7 2018, 120к км",   price: 11500, currency: "EUR", address: "Звездара",    lat: 44.8012, lng: 20.4899 },
  { category_slug: "education", title: "Курсы сербского для русскоговорящих",      price: 80,   currency: "EUR", address: "Врачар",       lat: 44.7921, lng: 20.4681 },
  { category_slug: "meetups",   title: "Прогулка по Калемегдану в субботу",        price: 0,    currency: "EUR", address: "Стариград",   lat: 44.8231, lng: 20.4489 },
  { category_slug: "stuff",     title: "Детская кроватка с матрасом IKEA",         price: 80,   currency: "EUR", address: "Земун",        lat: 44.8402, lng: 20.4016 },
  { category_slug: "rent",      title: "Двушка в Вождоваце, до центра 20 мин",     price: 650,  currency: "EUR", address: "Вождовац",     lat: 44.7699, lng: 20.4773 },
  { category_slug: "services",  title: "Бухгалтер для ИП, налоговый резидент",     price: 100,  currency: "EUR", address: "Белград",       lat: 44.8176, lng: 20.4569 },
  { category_slug: "stuff",     title: "Горный велосипед Trek Marlin, 2022",        price: 600,  currency: "EUR", address: "Нови Београд", lat: 44.8101, lng: 20.4300 },
  { category_slug: "jobs",      title: "Ищу дизайнера Figma, часть занятости",     price: null, currency: "EUR", address: "Белград",       lat: 44.8176, lng: 20.4569 },
  { category_slug: "stuff",     title: "PS5 + 3 игры, полный комплект",            price: 500,  currency: "EUR", address: "Палилула",     lat: 44.8301, lng: 20.4712 },
  { category_slug: "services",  title: "Юридическая помощь по ВНЖ Сербии",        price: 150,  currency: "EUR", address: "Стари град",   lat: 44.8178, lng: 20.4612 },
  { category_slug: "meetups",   title: "Русский разговорный клуб каждый вторник",  price: 0,    currency: "EUR", address: "Врачар",       lat: 44.7921, lng: 20.4681 },
  { category_slug: "stuff",     title: "Стиральная машина Bosch Serie 6",           price: 250,  currency: "EUR", address: "Чукарица",    lat: 44.7812, lng: 20.4301 },
];

async function main() {
  console.log("🌱 Seeding listings…");

  const { data: cats } = await supabase.from("categories").select("id, slug");
  const catMap = Object.fromEntries((cats ?? []).map((c: any) => [c.slug, c.id]));

  let seedUserId: string;
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", 999999999)
    .single();

  if (existing) {
    seedUserId = (existing as any).id;
  } else {
    const { data: newUser } = await supabase
      .from("users")
      .insert({
        telegram_id:       999999999,
        first_name:        "Seed",
        last_name:         "User",
        telegram_username: "seed_svoi",
        completed_profile: true,
      })
      .select("id")
      .single();
    seedUserId = (newUser as any).id;
  }

  let created = 0;
  for (const l of SAMPLE_LISTINGS) {
    const catId = catMap[l.category_slug];
    if (!catId) { console.warn(`Unknown category: ${l.category_slug}`); continue; }

    const { error } = await supabase.from("listings").insert({
      user_id:     seedUserId,
      category_id: catId,
      title:       l.title,
      price:       l.price,
      currency:    l.currency,
      address:     l.address,
      lat:         l.lat,
      lng:         l.lng,
      images:      [],
      status:      "active",
    } as any);

    if (!error) created++;
    else console.error(`Failed: ${l.title}`, error.message);
  }

  console.log(`✅ Created ${created}/${SAMPLE_LISTINGS.length} listings`);
}

main().catch((e) => { console.error(e); process.exit(1); });
