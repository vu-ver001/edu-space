import axios from 'axios';

export interface SpaceApiErrorPayload {
  code: string;
  message: string;
  details: unknown[];
}

/** Lấy lỗi JSON do backend trả về qua Axios. */
export const readSpaceApiError = (
  error: unknown,
  fallbackMessage: string,
): SpaceApiErrorPayload => {
  if (axios.isAxiosError<SpaceApiErrorPayload>(error)) {
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
