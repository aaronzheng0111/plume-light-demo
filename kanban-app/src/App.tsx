import { useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ControlBar } from "./components/layout/ControlBar";
import { TopHeader } from "./components/layout/TopHeader";
import { addHoursIso } from "./format/display";
import { I18nProvider } from "./i18n/I18nProvider";
import { useI18n } from "./i18n/useI18n";
import { FlightDetailPage } from "./pages/FlightDetailPage";
import { OverviewPage } from "./pages/OverviewPage";
import { JsonDataSource } from "./services/dataSource";
import { useKanbanSnapshot } from "./services/useKanbanSnapshot";
import type { FeedbackEvent, LoadMetric } from "./types/kanban";
import styles from "./App.module.css";

const queryClient = new QueryClient();
const dataSource = new JsonDataSource();
const SEED_AS_OF = "2026-11-15T05:30:00+08:00";

function KanbanShell() {
  const { t } = useI18n();
  const [view, setView] = useState<"overview" | "detail">("overview");
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [asOf, setAsOf] = useState(SEED_AS_OF);
  const [windowDays, setWindowDays] = useState(2);
  const [nearHours, setNearHours] = useState(6);
  const [metric, setMetric] = useState<LoadMetric>("weight");
  const [events, setEvents] = useState<FeedbackEvent[]>([]);
  const query = useMemo(
    () => ({ asOf, windowDays, nearHours, metric, events }),
    [asOf, windowDays, nearHours, metric, events],
  );
  const { viewModel, isPending, error } = useKanbanSnapshot(dataSource, query);
  const cargoFilled = events.some((event) => event.type === "CARGO_UPDATED" && event.flightId === "CX255");

  const selectFlight = (flightId: string) => {
    setSelectedFlightId(flightId);
    setView("detail");
  };

  return (
    <div className={styles.shell}>
      <TopHeader />
      <div className={styles.wrap}>
        <ControlBar
          asOf={asOf}
          sector={viewModel?.sector ?? "HKG-LHR"}
          windowDays={windowDays}
          nearHours={nearHours}
          metric={metric}
          cargoFilled={cargoFilled}
          onWindowDaysChange={setWindowDays}
          onNearHoursChange={setNearHours}
          onMetricChange={setMetric}
          onTimeStep={(hours) => setAsOf((current) => addHoursIso(current, hours))}
          onFillCargo={() =>
            setEvents((current) => [
              ...current,
              { type: "CARGO_UPDATED", flightId: "CX255", cargoKg: 14000, cargoM3: 87.5 },
            ])
          }
        />
        {error ? <p className={styles.error}>{error.message}</p> : null}
        {isPending || !viewModel ? (
          <p className={styles.note}>…</p>
        ) : view === "detail" && selectedFlightId ? (
          <FlightDetailPage
            viewModel={viewModel}
            flightId={selectedFlightId}
            onBack={() => setView("overview")}
          />
        ) : (
          <OverviewPage
            viewModel={viewModel}
            metric={metric}
            selectedFlightId={selectedFlightId}
            onSelectFlight={selectFlight}
          />
        )}
        <p className={styles.disclaimer}>
          {t("kb.staffOnly")} · {t("kb.noAutoSale")} · {t("kb.demo.data")}
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <KanbanShell />
      </I18nProvider>
    </QueryClientProvider>
  );
}
