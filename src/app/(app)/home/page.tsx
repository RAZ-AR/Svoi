// Svoi — Home screen: search + promo + categories + feed
import { Suspense } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { SearchBar } from "@/components/home/search-bar";
import { PromoBanner, PromoStrip } from "@/components/home/promo-banner";
import {
  CategoriesCarousel,
  CategoriesCarouselSkeleton,
} from "@/components/home/categories-carousel";
import { ListingsFeed } from "@/components/home/listings-feed";
import { FeedHeader } from "@/components/home/feed-header";
import { getCategories } from "@/actions/listings";


interface HomePageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { category } = await searchParams;

  const categories = await getCategories();

  return (
    <div className="flex flex-col">
      <AppHeader />

      <div className="flex flex-col gap-4 px-4 pb-6 pt-1">
        {/* ── Search bar ───────────────────────────────────────────────── */}
        <SearchBar />

        {/* ── Promo strip ──────────────────────────────────────────────── */}
        {!category && <PromoStrip />}

        {/* ── Hero promo card ──────────────────────────────────────────── */}
        {!category && <PromoBanner />}

        {/* ── Category carousel ────────────────────────────────────────── */}
        <section>
          <Suspense fallback={<CategoriesCarouselSkeleton />}>
            <CategoriesCarousel categories={categories} />
          </Suspense>
        </section>

        {/* ── Feed header ──────────────────────────────────────────────── */}
        <section>
          <FeedHeader hasCategory={!!category} />
          <ListingsFeed
            filters={category ? { categorySlug: category } : {}}
          />
        </section>
      </div>
    </div>
  );
}
