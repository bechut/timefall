import axios, { AxiosInstance } from "axios";
import cookie from "react-cookies";

export const TOKEN_NAME = {
  timeFallAccessToken: "timefall",
};

export const axiosCallee = (method: string) => {
  return async function (uri: string, context: any, instance: AxiosInstance) {
    const headers = context.headers || {};
    delete context.headers;
    const config = ["GET", "DELETE"].includes(method.toUpperCase())
      ? {
          url: uri,
          method,
          params: context,
          headers,
        }
      : { url: uri, method, data: context, headers };
    try {
      let json = await instance(config);
      return json.data;
    } catch (e: any) {
      throw JSON.stringify(e.response || "Something went wrong. Please try again.");
    }
  };
};

export function getInstance(baseURL: string, timeout: number) {
  const instance = axios.create({
    baseURL,
    timeout: 10000 * timeout,
    headers: {
      "Content-Type": "application/json",
    },
  });

  instance.interceptors.request.use((config: any) => {
    const accessToken = cookie.load(TOKEN_NAME.timeFallAccessToken);

    config.headers = accessToken
      ? {
          ...config.headers,
          Authorization: `Bearer ${accessToken}`,
        }
      : { ...config.headers };
    console.log(config.headers);
    return config;
  });

  instance.interceptors.response.use(
    (res) => res,
    async (error) => {
      const originalRequest = error.config;
      const statusCode = error.response.status;
      console.log(error);

      if ([403, 401].includes(statusCode) && !originalRequest._retry) {
        originalRequest._retry = true;
        // axios.defaults.headers.common["Authorization"] = "Bearer " + access;
        return instance(originalRequest);
      }
      throw error;
    }
  );

  return instance;
}

export const timefallInstance = getInstance(
  process.env.REACT_APP_TIMEFALL_API_URL || "",
  10
);
