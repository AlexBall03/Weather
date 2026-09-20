import { Panel, PanelHeader } from '@/components/ui/Panel';
import { Skeleton } from '@/components/ui/Readouts';

/**
 * Loading state built from the same panels as the dashboard, so the layout does not jump
 * when real data arrives.
 */
export function DashboardSkeleton({ label }: { label?: string }) {
  return (
    <div className="dashboard" aria-busy="true" aria-live="polite">
      <span className="visually-hidden">{label ?? 'Loading weather data'}</span>

      <Panel className="hero">
        <div className="hero__body">
          <div style={{ width: '100%' }}>
            <Skeleton width={220} height={26} />
            <div style={{ marginTop: 10 }}>
              <Skeleton width={160} height={12} />
            </div>
            <div style={{ marginTop: 30, display: 'flex', gap: 28, alignItems: 'flex-start' }}>
              <Skeleton width={180} height={92} radius="var(--radius-sm)" />
              <div style={{ flex: 1, maxWidth: 260 }}>
                <Skeleton width="70%" height={22} />
                <div style={{ marginTop: 10 }}>
                  <Skeleton width="50%" height={14} />
                </div>
                <div style={{ marginTop: 10 }}>
                  <Skeleton width="60%" height={14} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero__metrics">
          {[0, 1, 2, 3].map((index) => (
            <div className="metric" key={index}>
              <Skeleton width={58} height={10} />
              <div style={{ marginTop: 8 }}>
                <Skeleton width={76} height={20} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="dashboard__hourly panel--flush">
        <PanelHeader title="Hourly Forecast" />
        <div style={{ display: 'flex', padding: 'var(--s-4)' }}>
          {Array.from({ length: 10 }, (_, index) => (
            <div
              key={index}
              style={{
                width: 74,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Skeleton width={32} height={10} />
              <Skeleton width={22} height={22} radius="50%" />
              <Skeleton width={30} height={16} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="dashboard__conditions">
        <PanelHeader title="Conditions" />
        <div className="panel__body" style={{ display: 'grid', gap: 14 }}>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} height={14} />
          ))}
        </div>
      </Panel>

      <Panel className="panel--flush">
        <PanelHeader title="7-Day Forecast" />
        <div className="panel__body" style={{ display: 'grid', gap: 18 }}>
          {Array.from({ length: 7 }, (_, index) => (
            <Skeleton key={index} height={18} />
          ))}
        </div>
      </Panel>
    </div>
  );
}
