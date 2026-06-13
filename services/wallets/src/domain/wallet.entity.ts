export class InsufficientBalanceException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientBalanceException";
  }
}

export class Balance {
  constructor(
    public readonly id: string,
    public readonly walletId: string,
    public readonly currency: string,
    private _amount: bigint
  ) {}

  public get amount(): bigint {
    return this._amount;
  }

  public debit(amountToDebit: bigint): void {
    if (amountToDebit <= 0n) {
      throw new Error("Debit amount must be greater than zero");
    }
    if (this._amount < amountToDebit) {
      throw new InsufficientBalanceException(
        `Insufficient balance for ${this.currency}. Required: ${amountToDebit}, Available: ${this._amount}`
      );
    }
    this._amount -= amountToDebit;
  }

  public credit(amountToCredit: bigint): void {
    if (amountToCredit <= 0n) {
      throw new Error("Credit amount must be greater than zero");
    }
    this._amount += amountToCredit;
  }
}

export class Wallet {
  constructor(
    public readonly id: string,
    public readonly playerId: string,
    private _balances: Balance[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  public get balances(): Balance[] {
    return [...this._balances];
  }

  public getBalance(currency: string): Balance | undefined {
    return this._balances.find((b) => b.currency === currency);
  }

  public debit(amount: bigint, currency: string): void {
    const balance = this.getBalance(currency);
    if (!balance) {
      throw new InsufficientBalanceException(
        `Insufficient balance. No balance found for currency ${currency}`
      );
    }
    balance.debit(amount);
  }

  public credit(amount: bigint, currency: string): void {
    let balance = this.getBalance(currency);
    if (!balance) {
      balance = new Balance(crypto.randomUUID(), this.id, currency, 0n);
      this._balances.push(balance);
    }
    balance.credit(amount);
  }
}
