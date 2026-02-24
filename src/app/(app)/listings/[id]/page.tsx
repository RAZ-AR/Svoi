// Svoi — Listing detail page
import { notFound } from "next/navigation";
import { getListing } from "@/actions/listings";
import { ListingDetailClient } from "./listing-detail-client";

interface ListingPageProps {
  params: Promise<{ id: string }>;
}

// Revalidate every 5 minutes — fresh enough for a classifieds board
export const revalidate = 300;

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing) notFound();

  return <ListingDetailClient listing={listing} />;
}
