export type ConversionFunnelEvent = {
  id: string;
  event_type: string;
  visitor_key: string | null;
};

export type ConversionFunnelAnalytics = {
  messageScoreStarts: number;
  messageScoreCompleted: number;
  validationBookingClicks: number;
  founderCheckoutStarts: number;
  messageScoreCompletionRate: number;
  validationBookingRate: number;
};

function uniqueVisitors(events: ConversionFunnelEvent[]) {
  return new Set(events.map((event) => event.visitor_key ?? event.id)).size;
}

function count(events: ConversionFunnelEvent[], eventType: string) {
  return uniqueVisitors(events.filter((event) => event.event_type === eventType));
}

export function summariseConversionFunnel(events: ConversionFunnelEvent[]): ConversionFunnelAnalytics {
  const messageScoreStarts = count(events, "message_score_started");
  const messageScoreCompleted = count(events, "message_score_completed");
  const validationBookingClicks = count(events, "validation_booking_clicked");
  const founderCheckoutStarts = count(events, "founder_checkout_started");

  return {
    messageScoreStarts,
    messageScoreCompleted,
    validationBookingClicks,
    founderCheckoutStarts,
    messageScoreCompletionRate: messageScoreStarts ? Math.round((messageScoreCompleted / messageScoreStarts) * 100) : 0,
    validationBookingRate: messageScoreCompleted ? Math.round((validationBookingClicks / messageScoreCompleted) * 100) : 0,
  };
}
