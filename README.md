# Свой базар 🇷🇸

Telegram Mini App + PWA — доска объявлений для русских и экспатов в Белграде.

**Tech:** Next.js 15.1 · TypeScript · Supabase · Meilisearch · Leaflet · Telegram SDK

---

## Быстрый старт (локально)

```bash
# 1. Clone & install
git clone https://github.com/your-org/svoi.git && cd svoi
npm install

# 2. Copy env
cp .env.example .env.local
# → заполни переменные (см. раздел «Переменные окружения»)

# 3. Start local Supabase
npx supabase start
# → скопируй URL, anon key, service role key → вставь в .env.local

# 4. Apply migrations
npx supabase db push

# 5. Configure Meilisearch (нужен запущенный контейнер)
npm run meili:setup

# 6. Seed dev data
npm run seed

# 7. Dev server
npm run dev
# → http://localhost:3000
```

---

## Переменные окружения

Создай `.env.local` на основе `.env.example`:

```env
# ── Supabase ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret          # Settings → API → JWT Secret

# ── Telegram ──────────────────────────────────────────────────────────────────
TELEGRAM_BOT_TOKEN=123456789:AAF...          # @BotFather → /newbot

# ── Meilisearch ───────────────────────────────────────────────────────────────
NEXT_PUBLIC_MEILISEARCH_URL=https://search.yourdomain.com
MEILISEARCH_MASTER_KEY=your-master-key
NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY=your-search-only-key   # auto-создаётся

# ── Google OAuth (опционально, для PWA-входа) ─────────────────────────────────
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
NEXT_PUBLIC_APP_URL=https://yourdomain.vercel.app
```

---

## 1. Supabase — первоначальная настройка

### 1.1 Создать проект

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Выбери регион **Frankfurt (eu-central-1)** — ближайший к Белграду
3. Запиши `Project URL`, `anon key`, `service role key`, `JWT secret`

### 1.2 Применить миграции

```bash
# Локально (через supabase CLI):
npx supabase link --project-ref <your-project-ref>
npx supabase db push

# Или вручную в SQL Editor — выполни файлы по порядку:
# supabase/migrations/20240001_initial_schema.sql
# supabase/migrations/20240002_rls_policies.sql
# supabase/migrations/20240003_telegram_auth.sql
# supabase/migrations/20240004_storage.sql
# supabase/migrations/20240005_search_index.sql
# supabase/migrations/20240006_realtime.sql
```

### 1.3 Включить PostGIS

В **Database → Extensions** найди `postgis` → **Enable**.
(Если миграция 20240001 уже запустилась — она включает его сама через `create extension if not exists postgis`.)

### 1.4 Realtime

**Database → Replication** → убедись, что таблицы `messages` и `listings` добавлены в `supabase_realtime` publication (миграция 20240006 делает это автоматически).

### 1.5 Storage

**Storage** → убедись, что bucket `images` существует и **Public**. Создаётся миграцией 20240004.

### 1.6 Google OAuth (опционально)

**Authentication → Providers → Google** → вставь `Client ID` и `Client Secret`.
Добавь в **Redirect URLs**: `https://yourdomain.vercel.app/auth/callback`

### 1.7 JWT custom claims

Функция `upsert_telegram_user` выдаёт JWT с `svoi_user_id` claim.
RLS-хелпер `auth.svoi_uid()` читает его так:

```sql
-- уже в миграции 20240002, но для справки:
create or replace function auth.svoi_uid()
returns uuid language sql stable as $$
  select (current_setting('request.jwt.claims', true)::json->>'svoi_user_id')::uuid
$$;
```

---

## 2. Telegram Bot — настройка через @BotFather

```
1. Открой @BotFather → /newbot
   → Name: Свой базар
   → Username: svoibazar_bot  (придумай уникальный)

2. Скопируй TOKEN → TELEGRAM_BOT_TOKEN в .env

3. /mybots → svoibazar_bot → Bot Settings → Menu Button
   → Configure Menu Button
   → URL: https://yourdomain.vercel.app
   → Button Text: Открыть базар

4. /mybots → Bot Settings → Mini App (Web App)
   → Web App URL: https://yourdomain.vercel.app

5. Включить Inline Mode (опционально, для шаринга объявлений):
   /setinline → svoibazar_bot → включить
```

**Для локальной разработки** (без ngrok / туннеля) Telegram InitData не будет приходить — приложение откроется в режиме PWA без `window.Telegram.WebApp`. Это нормально: AuthProvider сразу показывает `/login`.

---

## 3. Meilisearch

### Вариант A — Railway (рекомендуется, бесплатный Starter)

```
1. railway.app → New Project → Deploy from template → Meilisearch
2. После деплоя: Settings → Variables → MEILI_MASTER_KEY=ваш-ключ
3. Networking → Generate Domain → скопируй URL
4. Вставь в .env: NEXT_PUBLIC_MEILISEARCH_URL=https://....railway.app
                  MEILISEARCH_MASTER_KEY=ваш-ключ
```

### Вариант B — Render (бесплатный Free tier)

```
1. render.com → New → Web Service
2. Docker image: getmeili/meilisearch:latest
3. Env vars: MEILI_MASTER_KEY, MEILI_ENV=production
4. Free plan ок для MVP
```

### Вариант C — локально (dev)

```bash
docker run -d -p 7700:7700 \
  -e MEILI_MASTER_KEY=masterkey \
  getmeili/meilisearch:latest
# → NEXT_PUBLIC_MEILISEARCH_URL=http://localhost:7700
# → MEILISEARCH_MASTER_KEY=masterkey
```

### Настройка индекса

После запуска Meilisearch:

```bash
npm run meili:setup
# Создаёт индекс 'listings' с настроенными:
# - filterableAttributes: category_id, status, currency, address
# - sortableAttributes: created_at, price, views_count
# - searchableAttributes: title, description, address
# - rankingRules
```

### Search API key (read-only)

```bash
# Получи search-only ключ для фронтенда:
curl https://your-meili-url/keys \
  -H "Authorization: Bearer YOUR_MASTER_KEY"
# Найди ключ с actions: ["search"] → NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY
```

---

## 4. Деплой на Vercel

```bash
# Через CLI:
npm i -g vercel
vercel --prod

# Через GitHub:
# 1. Push в main
# 2. vercel.com → New Project → Import from GitHub
# 3. Framework: Next.js (автодетект)
# 4. Root Directory: . (корень)
```

### Переменные окружения на Vercel

`Settings → Environment Variables` → добавь **все** переменные из `.env.local`:

| Key | Environment |
|-----|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview |
| `SUPABASE_JWT_SECRET` | Production, Preview |
| `TELEGRAM_BOT_TOKEN` | Production, Preview |
| `NEXT_PUBLIC_MEILISEARCH_URL` | Production, Preview, Development |
| `MEILISEARCH_MASTER_KEY` | Production, Preview |
| `NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | Production (`https://yourdomain.vercel.app`) |
| `GOOGLE_CLIENT_ID` | Production, Preview |
| `GOOGLE_CLIENT_SECRET` | Production, Preview |

### Регион

`vercel.json` уже настроен на `fra1` (Frankfurt). При первом деплое Vercel может спросить регион — выбери **Frankfurt**.

### Домен

`Settings → Domains` → добавь свой домен или используй `*.vercel.app`.
Обнови `NEXT_PUBLIC_APP_URL` и URL в BotFather/Supabase на финальный домен.

---

## 5. После деплоя — финальный чеклист

```
[ ] Открыть https://yourdomain.vercel.app в браузере → должна открыться страница /login
[ ] Открыть бота в Telegram → нажать Menu Button → откроется Mini App
[ ] Пройти онбординг (имя, район)
[ ] Создать тестовое объявление (все 4 шага wizard)
[ ] Проверить поиск — должен работать через Meilisearch
[ ] Открыть карту — должны отображаться пины объявлений
[ ] Написать сообщение другому пользователю — realtime работает
[ ] Проверить PWA: в мобильном браузере → «Добавить на экран»
[ ] npm run seed — засеять тестовые объявления (если нужно)
```

---

## 6. Структура проекта

```
svoi/
├── src/
│   ├── actions/          # Server Actions (auth, listings, search, messages, map)
│   ├── app/
│   │   ├── (app)/        # Основные страницы (auth guard)
│   │   │   ├── home/     # Лента объявлений
│   │   │   ├── search/   # Поиск + фильтры
│   │   │   ├── map/      # Fullscreen карта
│   │   │   ├── chats/    # Список чатов + переписка
│   │   │   ├── listings/ # Создание, редактирование, мои объявления
│   │   │   └── profile/  # Профиль + редактирование
│   │   ├── onboarding/   # Первоначальная настройка профиля
│   │   ├── login/        # PWA вход через Google
│   │   └── auth/         # OAuth callback
│   ├── components/
│   │   ├── chat/         # ChatHeader, MessageBubble, MessageInput, MessagesList
│   │   ├── home/         # SearchBar, CategoriesCarousel, ListingsFeed, MapButton
│   │   ├── layout/       # AppHeader, BottomNav
│   │   ├── listings/     # ListingCard, Gallery, Map, SellerCard, Actions, ...
│   │   ├── map/          # ListingsMap, MapControls, MapListingPreview
│   │   ├── search/       # FiltersSheet, SearchInput, ActiveFilters, RecentSearches
│   │   ├── telegram/     # TelegramProvider
│   │   ├── auth/         # AuthProvider
│   │   └── ui/           # Button, Skeleton, Badge, BottomSheet, ...
│   ├── hooks/            # useTelegramBack, useTelegramMainButton, useListings, useChat, ...
│   ├── lib/
│   │   ├── supabase/     # server.ts, client.ts, database.types.ts
│   │   ├── telegram/     # verify-init-data.ts
│   │   └── utils.ts
│   └── store/            # user.store.ts, new-listing.store.ts, search.store.ts
├── supabase/
│   ├── config.toml
│   └── migrations/       # 6 SQL migrations
├── scripts/
│   ├── setup-meilisearch.ts
│   └── seed-listings.ts
├── public/
│   ├── manifest.json
│   └── icons/            # icon-192.png, icon-512.png — нужно добавить!
└── vercel.json
```

---

## 7. Разработка

```bash
npm run dev          # Dev server на :3000
npm run build        # Production build
npm run typecheck    # TypeScript проверка
npm run lint         # ESLint

npm run db:push      # Применить миграции к linked Supabase проекту
npm run db:types     # Перегенерировать database.types.ts из локальной БД

npm run meili:setup  # Настроить индексы Meilisearch (один раз)
npm run seed         # Создать 20 тестовых объявлений
```

### Обновление типов БД

После изменения схемы:
```bash
npx supabase start   # убедись что local Supabase запущен
npm run db:types     # → обновит src/lib/supabase/database.types.ts
```

---

## 8. Известные ограничения MVP

| Ограничение | Статус |
|-------------|--------|
| Push-уведомления | Не реализованы (Telegram BOT API или Web Push) |
| `/favorites` страница | Stub (данные в БД есть) |
| `/users/[id]` профиль | Stub |
| Модерация объявлений | Нет (только RLS) |
| Платные буст-объявления | Таблица `boosts` в схеме, UI не готов |
| Верификация телефона | Нет |

---

## Лицензия

MIT — используй, форкай, развивай.
