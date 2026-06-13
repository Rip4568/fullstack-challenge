import { describe, expect, test, spyOn } from "bun:test";
import { ProvablyFairService } from "../../src/domain/services/provably-fair.service";
import * as crypto from "crypto";

describe("ProvablyFairService", () => {
  const service = new ProvablyFairService();

  test("should generate a random seed of 32 bytes (64 hex characters)", () => {
    const seed = service.generateRandomSeed();
    expect(seed).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(seed)).toBe(true);
  });

  test("should hash seed correctly using SHA-256", () => {
    const seed = "test-seed-value";
    const expectedHash = crypto.createHash("sha256").update(seed).digest("hex");
    expect(service.hashSeed(seed)).toBe(expectedHash);
  });

  test("should verify seed chain successfully", () => {
    const seed = "secret-seed";
    const hash = service.hashSeed(seed);
    expect(service.verifySeedChain(seed, hash)).toBe(true);
    expect(service.verifySeedChain("wrong-seed", hash)).toBe(false);
  });

  test("should calculate crash point deterministically", () => {
    const serverSeed = "server-seed-123";
    const clientSeed = "client-seed-abc";

    const crashPoint1 = service.calculateCrashPoint(serverSeed, clientSeed);
    const crashPoint2 = service.calculateCrashPoint(serverSeed, clientSeed);

    expect(crashPoint1).toBe(crashPoint2);
    expect(crashPoint1).toBeGreaterThanOrEqual(1.00);
    expect(crashPoint1).toBeLessThanOrEqual(1000000.00);
  });

  test("should return 1.00 when probability p is less than 0.03 (house edge)", () => {
    // We want to find a serverSeed and clientSeed combination where the first 52 bits of the HMAC-SHA256 hash is small.
    // Let's search for a combination of seeds that yields a hash starting with "0000" to ensure p < 0.03.
    let serverSeed = "test";
    let clientSeed = "test";
    let found = false;

    for (let i = 0; i < 1000; i++) {
      const currentServer = `server-${i}`;
      const currentClient = `client-${i}`;
      const hash = crypto
        .createHmac("sha256", currentClient)
        .update(currentServer)
        .digest("hex");
      
      const hex52 = hash.substring(0, 13);
      const X = parseInt(hex52, 16);
      const E = 4503599627370496; // 2^52
      const p = X / E;

      if (p < 0.03) {
        serverSeed = currentServer;
        clientSeed = currentClient;
        found = true;
        break;
      }
    }

    expect(found).toBe(true);
    const crashPoint = service.calculateCrashPoint(serverSeed, clientSeed);
    expect(crashPoint).toBe(1.00);
  });

  test("should calculate crash point based on Pareto distribution when p >= 0.03", () => {
    // We want to find a pair of seeds that results in p >= 0.03.
    // Since 97% of combinations have p >= 0.03, any random seeds will likely work.
    let serverSeed = "test-server";
    let clientSeed = "test-client";
    let found = false;
    let expectedMultiplier = 0;

    for (let i = 0; i < 100; i++) {
      const currentServer = `server-p-${i}`;
      const currentClient = `client-p-${i}`;
      const hash = crypto
        .createHmac("sha256", currentClient)
        .update(currentServer)
        .digest("hex");
      
      const hex52 = hash.substring(0, 13);
      const X = parseInt(hex52, 16);
      const E = 4503599627370496;
      const p = X / E;

      if (p >= 0.03 && p < 0.95) {
        serverSeed = currentServer;
        clientSeed = currentClient;
        expectedMultiplier = Math.floor(97 / (1 - p)) / 100;
        found = true;
        break;
      }
    }

    expect(found).toBe(true);
    const crashPoint = service.calculateCrashPoint(serverSeed, clientSeed);
    expect(crashPoint).toBe(expectedMultiplier);
  });

  test("should cap crash point at 1,000,000.00x for very high p", () => {
    // Mock crypto.createHmac to return a hash that has an extremely high p value (near 1.0)
    // Starts with fffffffffffff (52 bits all set to 1)
    const mockHmac = {
      update: () => mockHmac,
      digest: () => "fffffffffffffabcdef1234567890"
    } as any;

    const createHmacSpy = spyOn(crypto, "createHmac").mockReturnValue(mockHmac);

    try {
      const crashPoint = service.calculateCrashPoint("any-server-seed", "any-client-seed");
      expect(crashPoint).toBe(1000000.00);
    } finally {
      createHmacSpy.mockRestore();
    }
  });
});
