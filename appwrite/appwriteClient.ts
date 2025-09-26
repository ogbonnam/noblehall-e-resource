import {
  Client,
  Account,
  Databases,
  ID,
  Models,
  Permission,
  Role,
  Storage,
} from "node-appwrite";
import { appwriteConfig } from "./config";

// This client is used for operations that require an existing user session.
// It does NOT use an API key.
export const createSessionClient = async (session?: string) => {
  const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId);

  if (session) {
    client.setSession(session);
  }

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
    get storage() {
      // NEW: Add storage client
      return new Storage(client);
    },
    client, // Export the client instance if needed directly
  };
};

// **NEW CLIENT UTILITY FOR MOBILE APPS**
// This client is used for operations authenticated by a JWT token,
// typically from a mobile client's session.
export const createTokenClient = async (token: string) => {
  const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId);

  client.setJWT(token);

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
    get storage() {
      return new Storage(client);
    },
    client,
  };
};

// This client is used for server-side operations that require admin privileges (API Key).
// It does NOT rely on a user session.
export const createAdminClient = async () => {
  const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId)
    .setKey(appwriteConfig.secretKey); // Set the API key for admin access

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
    get storage() {
      // NEW: Add storage client
      return new Storage(client);
    },
    client, // Export the client instance if needed directly
  };
};

export { ID, Permission, Role }; // Export ID and Models for convenience
export type { Models }; // Use 'export type' for the Models namespace
