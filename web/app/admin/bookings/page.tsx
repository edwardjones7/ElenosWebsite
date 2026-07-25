import { Shell } from "@/components/admin/Shell";
import { BookingsTable } from "@/components/admin/BookingsTable";
import { BookingTabs } from "@/components/admin/BookingTabs";
import { listBookings, type BookingFilter } from "@/lib/bookings";

export const dynamic = "force-dynamic";

const FILTERS: BookingFilter[] = ["upcoming", "past", "canceled", "all"];

export default async function AdminBookings({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const raw = searchParams?.filter as BookingFilter | undefined;
  const filter = raw && FILTERS.includes(raw) ? raw : "upcoming";

  let items: Awaited<ReturnType<typeof listBookings>> = [];
  let error: string | null = null;
  try {
    items = await listBookings(filter);
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <Shell>
      <header className="admin-header">
        <div>
          <span className="eyebrow">Bookings</span>
          <h1>Discovery calls</h1>
        </div>
        <BookingTabs active={filter} />
      </header>

      {error ? (
        <div className="widget">
          <div className="widget-empty">
            Couldn’t load bookings: {error}. Set <code>SUPABASE_URL</code> and{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> in <code>.env.local</code> and run the migrations in{" "}
            <code>web/migrations/</code>.
          </div>
        </div>
      ) : (
        <BookingsTable items={items} />
      )}
    </Shell>
  );
}
