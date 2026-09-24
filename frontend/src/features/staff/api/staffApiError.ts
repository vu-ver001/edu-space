import axios from 'axios';

export interface StaffApiErrorPayload {
  code: string;
  message: string;
  details: unknown[];
}

export const readStaffApiError = (
  error: unknown,
  fallbackMessage: string,
): StaffApiErrorPayload => {
  if (axios.isAxiosError<StaffApiErrorPayload>(error)) {
    const body = error.response?.data;

    return {
      code: body?.code ?? 'NETWORK_ERROR',
      message: body?.message ?? fallbackMessage,
      details: body?.details ?? [],
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: fallbackMessage,
    details: [],
  };
};
