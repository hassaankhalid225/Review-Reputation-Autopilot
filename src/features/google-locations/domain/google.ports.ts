/** PORTS for connecting and reading a business's Google Business Profile. */
import type { Result } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";

export interface ConnectedLocation {
  accountName: string;
  locationId: string;
  displayName: string | null;
  reviewLink: string | null;
  refreshToken: string; // plaintext from OAuth; the repo encrypts at rest
}

/** A stored connection with the decrypted token, for API calls. */
export interface GoogleConnection {
  locationId: string; // DB id
  googleAccountId: string;
  googleLocationId: string;
  refreshToken: string; // decrypted
}

/** PORT: performs the OAuth exchange + GBP discovery. */
export interface GoogleAccountPort {
  isConfigured(): boolean;
  connect(code: string): Promise<Result<ConnectedLocation, AppError>>;
}

/** PORT: persistence for connected locations. */
export interface GoogleLocationRepository {
  saveConnection(businessId: string, conn: ConnectedLocation): Promise<Result<void, AppError>>;
  hasConnection(businessId: string): Promise<Result<boolean, AppError>>;
  /** Returns the primary connected location with its decrypted refresh token. */
  getConnection(businessId: string): Promise<Result<GoogleConnection | null, AppError>>;
}
