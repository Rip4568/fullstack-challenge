import * as crypto from "crypto";

export class ProvablyFairService {
  /**
   * Calculates the crash point multiplier based on server seed and client seed.
   * Matches the Pareto distribution with 3% house edge.
   */
  public calculateCrashPoint(serverSeed: string, clientSeed: string): number {
    const hash = crypto
      .createHmac("sha256", clientSeed)
      .update(serverSeed)
      .digest("hex");

    // Extract first 52 bits (13 hex characters)
    const hex52 = hash.substring(0, 13);
    const X = parseInt(hex52, 16);
    const E = 4503599627370496; // 2^52

    const p = X / E;

    // 3% house edge instant crash at 1.00x
    if (p < 0.03) {
      return 1.00;
    }

    // Pareto distribution
    const multiplier = Math.floor(97 / (1 - p)) / 100;
    
    // Cap at 1,000,000.00x for safety
    return Math.min(1000000.00, Math.max(1.00, multiplier));
  }

  /**
   * Generates a random seed of 32 bytes (64 hex characters).
   */
  public generateRandomSeed(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Hashes a seed (used to walk backwards along the hash chain).
   * SHA-256(S_n) = S_n-1
   */
  public hashSeed(seed: string): string {
    return crypto.createHash("sha256").update(seed).digest("hex");
  }

  /**
   * Verifies if a seed matches its hash.
   */
  public verifySeedChain(revealedSeed: string, previousHash: string): boolean {
    return this.hashSeed(revealedSeed) === previousHash;
  }
}
