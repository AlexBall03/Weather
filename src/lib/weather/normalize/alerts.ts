import type { NwsAlertsResponse } from '@/lib/nws/types';
import { alertCategory, alertLevel, compareAlertLevel } from '@/lib/weather/severity';
import type { AlertsSection, NormalizedAlert, SectionStatus } from '@/types/weather';

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function normalizeAlerts(
  response: NwsAlertsResponse | null,
  status: SectionStatus,
): AlertsSection {
  const alerts: NormalizedAlert[] = (response?.features ?? [])
    .map((feature, index) => {
      const properties = feature.properties ?? {};
      const event = clean(properties.event) ?? 'Weather Alert';
      const category = alertCategory(event);

      return {
        id: properties.id ?? feature.id ?? `alert-${index}`,
        event,
        headline: clean(properties.headline),
        description: clean(properties.description),
        instruction: clean(properties.instruction),
        areaDescription: clean(properties.areaDesc),
        severity: clean(properties.severity),
        urgency: clean(properties.urgency),
        certainty: clean(properties.certainty),
        messageType: clean(properties.messageType),
        senderName: clean(properties.senderName),
        effective: clean(properties.effective),
        onset: clean(properties.onset),
        expires: clean(properties.expires),
        ends: clean(properties.ends),
        category,
        level: alertLevel(properties.severity, category),
      } satisfies NormalizedAlert;
    })
    // Cancellations are not active products worth showing on a dashboard.
    .filter((alert) => alert.messageType !== 'Cancel')
    .sort((a, b) => compareAlertLevel(a.level, b.level));

  return { status, alerts };
}
