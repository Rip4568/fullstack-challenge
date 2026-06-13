export enum BetStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CASHOUT = "CASHOUT",
  LOST = "LOST",
  REJECTED = "REJECTED",
}

export class Bet {
  constructor(
    public readonly id: string,
    public readonly roundId: string,
    public readonly playerId: string,
    public readonly username: string,
    public readonly amount: bigint,
    public readonly currency: string,
    private _status: BetStatus,
    private _cashOutMultiplier: number | null,
    private _payoutAmount: bigint | null,
    public readonly createdAt: Date
  ) {}

  public get status(): BetStatus {
    return this._status;
  }

  public get cashOutMultiplier(): number | null {
    return this._cashOutMultiplier;
  }

  public get payoutAmount(): bigint | null {
    return this._payoutAmount;
  }

  public confirm(): void {
    if (this._status !== BetStatus.PENDING) {
      throw new Error(`Cannot confirm bet in status ${this._status}`);
    }
    this._status = BetStatus.CONFIRMED;
  }

  public reject(): void {
    if (this._status !== BetStatus.PENDING) {
      throw new Error(`Cannot reject bet in status ${this._status}`);
    }
    this._status = BetStatus.REJECTED;
  }

  public cashout(multiplier: number): void {
    if (this._status !== BetStatus.CONFIRMED) {
      throw new Error(`Cannot cashout bet in status ${this._status}`);
    }
    this._status = BetStatus.CASHOUT;
    this._cashOutMultiplier = multiplier;
    
    // Calculate payout amount in cents: amount * multiplier.
    // To maintain bigint precision, multiply multiplier by 100, multiply by amount, then divide by 100.
    const multiplierCents = BigInt(Math.floor(multiplier * 100));
    this._payoutAmount = (this.amount * multiplierCents) / 100n;
  }

  public markAsLost(): void {
    if (this._status === BetStatus.CONFIRMED || this._status === BetStatus.PENDING) {
      this._status = BetStatus.LOST;
    }
  }
}
