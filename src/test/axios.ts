import {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

export function requestConfig(): InternalAxiosRequestConfig {
  return { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
}

export function responseError(status: number, data: unknown = {}): AxiosError {
  const config = requestConfig();
  const response: AxiosResponse = {
    data,
    status,
    statusText: String(status),
    headers: new AxiosHeaders(),
    config,
  };

  return new AxiosError("Request failed", "ERR_BAD_RESPONSE", config, {}, response);
}

export function networkError(): AxiosError {
  return new AxiosError("Network Error", "ERR_NETWORK", requestConfig());
}

// Guarda el adapter original de cada instancia para poder restaurarlo.
const originalAdapters = new WeakMap<
  AxiosInstance,
  AxiosInstance["defaults"]["adapter"]
>();

// Sustituye el adapter de una instancia real de axios para simular una respuesta HTTP
// sin red. Un adapter propio no aplica validateStatus, así que replicamos el rechazo.
export function stubApiStatus(client: AxiosInstance, status: number): void {
  originalAdapters.set(client, client.defaults.adapter);

  client.defaults.adapter = async (config) => {
    const response: AxiosResponse = {
      data: {},
      status,
      statusText: String(status),
      headers: new AxiosHeaders(),
      config,
    };

    if (status >= 200 && status < 300) {
      return response;
    }

    throw new AxiosError(
      `Request failed with status code ${status}`,
      "ERR_BAD_RESPONSE",
      config,
      {},
      response,
    );
  };
}

export function restoreApiAdapter(client: AxiosInstance): void {
  client.defaults.adapter = originalAdapters.get(client);
  originalAdapters.delete(client);
}
