export type AnalyticsEventName =
  | "upload_completed"
  | "template_selected"
  | "export_succeeded"
  | "export_failed"
  | "local_feedback_changed";

export type AnalyticsPayload = Record<
  string,
  boolean | number | string | null | undefined
>;

export function trackEvent(
  name: AnalyticsEventName,
  payload: AnalyticsPayload = {}
) {
  void name;
  void payload;
}
