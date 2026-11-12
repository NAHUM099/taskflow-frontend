import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "@/lib/api";
import { getToken, setToken } from "@/lib/auth/token";
import { makeJwt } from "@/test/factories";

let lastConfig: InternalAxiosRequestConfig | undefined;

// Un adapter propio no aplica validateStatus: replicamos el rechazo de Axios.
function stubAdapter(status: number): void {
  api.defaults.adapter = async (config) => {
    lastConfig = config;
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
      status >= 500 ? "ERR_BAD_RESPONSE" : "ERR_BAD_REQUEST",
      config,
      {},
      response,
    );
  };
}


describe("api", () => {
  beforeEach(() => {
    lastConfig = undefined;
    stubAdapter(200);
  });

  it("usa NEXT_PUBLIC_API_URL como baseURL", () => {
    expect(api.defaults.baseURL).toBe("http://localhost:8080");
  });

  it("añade el header Authorization cuando hay token", async () => {
    setToken("token-abc");

    await api.get("/tasks");

    expect(lastConfig?.headers.Authorization).toBe("Bearer token-abc");
  });

  it("no añade Authorization cuando no hay token", async () => {
    await api.get("/tasks");

    expect(lastConfig?.headers.Authorization).toBeUndefined();
  });

  it("elimina el token cuando la API responde 401", async () => {
    setToken(makeJwt());
    stubAdapter(401);

    await expect(api.get("/users")).rejects.toBeTruthy();
    expect(getToken()).toBeNull();
  });

  it("conserva el token ante otros errores", async () => {
    setToken("token-abc");
    stubAdapter(400);

    await expect(api.get("/tasks")).rejects.toBeTruthy();
    expect(getToken()).toBe("token-abc");
  });
});
