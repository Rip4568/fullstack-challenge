import { Bet, BetStatus } from "../entities/bet.entity";

export enum RoundStatus {
  BETTING = "BETTING",
  GAMEPLAY = "GAMEPLAY",
  CRASHED = "CRASHED",
}

export class GameRound {
  constructor(
    public readonly id: string,
    public readonly gameId: string,
    private _status: RoundStatus,
    public readonly serverSeed: string,
    public readonly serverSeedHash: string,
    public readonly clientSeed: string,
    public readonly crashPoint: number,
    private _bets: Bet[],
    public readonly createdAt: Date,
    private _endedAt: Date | null
  ) {}

  public get status(): RoundStatus {
    return this._status;
  }

  public get bets(): Bet[] {
    return [...this._bets];
  }

  public get endedAt(): Date | null {
    return this._endedAt;
  }

  public addBet(bet: Bet): void {
    if (this._status !== RoundStatus.BETTING) {
      throw new Error("Bets are only allowed during the BETTING phase");
    }
    const alreadyBetted = this._bets.some((b) => b.playerId === bet.playerId);
    if (alreadyBetted) {
      throw new Error("Player has already placed a bet in this round");
    }
    this._bets.push(bet);
  }

  public getBetByPlayer(playerId: string): Bet | undefined {
    return this._bets.find((b) => b.playerId === playerId);
  }

  public confirmBet(playerId: string): void {
    const bet = this.getBetByPlayer(playerId);
    if (!bet) {
      throw new Error(`No bet found for player ${playerId}`);
    }
    bet.confirm();
  }

  public rejectBet(playerId: string): void {
    const bet = this.getBetByPlayer(playerId);
    if (!bet) {
      throw new Error(`No bet found for player ${playerId}`);
    }
    bet.reject();
  }

  public startGameplay(): void {
    if (this._status !== RoundStatus.BETTING) {
      throw new Error("Can only start gameplay from BETTING status");
    }
    this._status = RoundStatus.GAMEPLAY;
  }

  public cashoutBet(playerId: string, multiplier: number): Bet {
    if (this._status !== RoundStatus.GAMEPLAY) {
      throw new Error("Cash out is only allowed during the GAMEPLAY phase");
    }
    
    // Safety check: Cannot cashout at or above crash point
    if (multiplier >= this.crashPoint) {
      throw new Error(`Cannot cash out at ${multiplier}x as the game crashed at ${this.crashPoint}x`);
    }

    const bet = this.getBetByPlayer(playerId);
    if (!bet) {
      throw new Error(`No bet placed by player ${playerId} in this round`);
    }

    bet.cashout(multiplier);
    return bet;
  }

  public crash(): void {
    if (this._status !== RoundStatus.GAMEPLAY) {
      throw new Error("Can only crash from GAMEPLAY status");
    }
    this._status = RoundStatus.CRASHED;
    this._endedAt = new Date();

    // Mark remaining active bets as LOST
    for (const bet of this._bets) {
      bet.markAsLost();
    }
  }
}
