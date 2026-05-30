export type TriggeredCronLogStatus = 'success' | 'partial' | 'error';

interface TriggerCronBody {
  ok?: boolean;
  success?: boolean;
  partial?: boolean;
  error?: string;
  message?: string;
}

function parseTriggerCronBody(bodyText: string): TriggerCronBody | null {
  if (!bodyText) return null;

  try {
    return JSON.parse(bodyText) as TriggerCronBody;
  } catch {
    return null;
  }
}

export function inferTriggeredCronLogOutcome(params: {
  httpStatus: number;
  bodyText: string;
}): { status: TriggeredCronLogStatus; error: string | null } {
  const parsed = parseTriggerCronBody(params.bodyText);
  const bodyExcerpt = params.bodyText.slice(0, 200);
  const message = parsed?.message || parsed?.error || bodyExcerpt || null;

  if (params.httpStatus >= 400) {
    return {
      status: 'error',
      error: `HTTP ${params.httpStatus}${message ? `: ${message}` : ''}`,
    };
  }

  if (params.httpStatus === 207 || parsed?.partial === true || parsed?.success === false || parsed?.ok === false) {
    return {
      status: 'partial',
      error: message || 'Cron returned a partial result',
    };
  }

  return { status: 'success', error: null };
}
