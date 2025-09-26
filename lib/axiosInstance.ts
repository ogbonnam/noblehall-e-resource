import { cookies } from "next/headers";
import axios, { AxiosRequestConfig, AxiosResponse, Method } from "axios"; // Import Axios types
import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies"; // For sessionCookie type

interface AxiosInstanceParams {
  url: string;
  method: Method; // Use Axios's Method type for HTTP methods (e.g., 'get', 'post', 'put', 'delete')
  data?: any; // Optional: for POST/PUT requests
  params?: any; // Optional: for query parameters
  // Add any other common AxiosRequestConfig properties you might use
}

const axiosInstance = async ({
  url,
  method,
  data,
  params,
}: AxiosInstanceParams): Promise<AxiosResponse> => {
  // 1. Await the cookies() function
  const cookiesStore = await cookies();
  const sessionCookie: RequestCookie | undefined = cookiesStore.get("session");

  const headers: Record<string, string> = {}; // Initialize headers object

  // 2. Safely add the session cookie to headers if it exists
  if (sessionCookie && sessionCookie.value) {
    headers["Cookie"] = `session=${sessionCookie.value}`;
  } else {
    // Optional: Log a warning or throw an error if a session is expected but not found
    console.warn(
      "No session cookie found for axiosInstance. Request might be unauthenticated."
    );
    // Or, depending on your app's logic, you might want to throw:
    // throw new Error("Authentication session required but not found.");
  }

  // 3. Return the axios call with proper config
  const config: AxiosRequestConfig = {
    url,
    method,
    headers,
    data, // Include data for POST/PUT
    params, // Include params for GET
  };

  try {
    return await axios(config);
  } catch (error) {
    // You might want to add more specific error handling here
    console.error(`Axios request to ${url} failed:`, error);
    throw error; // Re-throw the error so the caller can handle it
  }
};

export default axiosInstance;
