'use client';

import { AlertTriangle, ChevronDown, ShieldAlert, Info, Eye } from 'lucide-react';
import type { ReactNode } from 'react';

import { Panel, PanelHeader } from '@/components/ui/Panel';
import { MetaTable, Notice, StatusDot } from '@/components/ui/Readouts';
import { useMode } from '@/context/ModeContext';
import { formatStamp } from '@/lib/weather/format';
import { CATEGORY_LABEL } from '@/lib/weather/severity';
import type { AlertCategory, NormalizedAlert, WeatherSnapshot } from '@/types/weather';

/**
 * Severity is carried by an icon, an uppercase word, a border weight and a colour — never
 * by colour alone. A routine advisory does not get a warning's treatment.
 */
const CATEGORY_ICON: Record<AlertCategory, ReactNode> = {
  warning: <ShieldAlert size={18} />,
  watch: <AlertTriangle size={18} />,
  advisory: <Eye size={18} />,
  statement: <Info size={18} />,
};

const SEVERITY_WORD: Record<string, string> = {
  extreme: 'EXTREME',
  severe: 'SEVERE',
  moderate: 'MODERATE',
  minor: 'MINOR',
  unknown: 'UNCLASSIFIED',
};

function AlertCard({
  alert,
  timeZone,
  isAdvanced,
}: {
  alert: NormalizedAlert;
  timeZone: string;
  isAdvanced: boolean;
}) {
  return (
    <details className={`alert alert--${alert.level}`}>
      <summary className="alert__summary">
        <span className="alert__icon">{CATEGORY_ICON[alert.category]}</span>

        <span className="alert__head">
          <span className="alert__badges">
            <span className="alert__badge">{CATEGORY_LABEL[alert.category]}</span>
            <span className="alert__badge alert__badge--plain">
              {SEVERITY_WORD[alert.level] ?? alert.level.toUpperCase()}
            </span>
            {alert.urgency ? (
              <span className="alert__badge alert__badge--plain">{alert.urgency.toUpperCase()}</span>
            ) : null}
          </span>

          <span className="alert__event">{alert.event}</span>

          {alert.headline ? <span className="alert__headline">{alert.headline}</span> : null}

          <span className="alert__timing">
            {alert.effective ? <span>From {formatStamp(alert.effective, timeZone)}</span> : null}
            {alert.expires ? <span>Until {formatStamp(alert.expires, timeZone)}</span> : null}
          </span>
        </span>

        <ChevronDown className="alert__chevron" size={16} aria-hidden="true" />
        <span className="visually-hidden">Show full text for {alert.event}</span>
      </summary>

      <div className="alert__detail">
        {alert.areaDescription ? (
          <p className="alert__timing">
            <span>{alert.areaDescription}</span>
          </p>
        ) : null}

        {alert.description ? <p className="alert__text">{alert.description}</p> : null}

        {alert.instruction ? (
          <p className="alert__instruction">
            <strong>Instructions: </strong>
            {alert.instruction}
          </p>
        ) : null}

        {isAdvanced ? (
          <MetaTable
            rows={[
              { label: 'Severity', value: alert.severity },
              { label: 'Certainty', value: alert.certainty },
              { label: 'Urgency', value: alert.urgency },
              { label: 'Type', value: alert.messageType },
              { label: 'Onset', value: alert.onset ? formatStamp(alert.onset, timeZone) : null },
              { label: 'Ends', value: alert.ends ? formatStamp(alert.ends, timeZone) : null },
              { label: 'Sender', value: alert.senderName },
            ]}
          />
        ) : null}
      </div>
    </details>
  );
}

export function AlertsPanel({ snapshot }: { snapshot: WeatherSnapshot }) {
  const { isAdvanced } = useMode();
  const { alerts, location } = snapshot;

  if (alerts.status === 'unavailable') {
    return (
      <Panel labelledBy="alerts-heading">
        <PanelHeader title="Active Alerts" id="alerts-heading" />
        <div className="panel__body">
          <Notice
            tone="error"
            icon={<AlertTriangle size={16} />}
            title="Alert feed unavailable"
            message="Active alerts could not be retrieved from NWS. Do not treat this as an all-clear — check weather.gov directly."
          />
        </div>
      </Panel>
    );
  }

  if (alerts.alerts.length === 0) {
    return (
      <Panel labelledBy="alerts-heading">
        <h2 className="visually-hidden" id="alerts-heading">
          Active alerts
        </h2>
        <p className="alerts__clear">
          <StatusDot state="live" />
          No active weather alerts
        </p>
      </Panel>
    );
  }

  return (
    <Panel className="panel--flush" labelledBy="alerts-heading">
      <PanelHeader
        title="Active Alerts"
        id="alerts-heading"
        aside={`${alerts.alerts.length} ACTIVE`}
      />
      <div className="alerts__list">
        {alerts.alerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            timeZone={location.timeZone}
            isAdvanced={isAdvanced}
          />
        ))}
      </div>
    </Panel>
  );
}
