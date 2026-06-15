import { IsInt, Min, IsString, IsOptional, IsNumber } from "class-validator";

export class PlaceBetDto {
  @IsInt()
  @Min(1, { message: "Bet amount must be positive" })
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @IsOptional()
  @Min(1.01, { message: "Auto cashout multiplier must be greater than 1.00" })
  autoCashoutMultiplier?: number;
}

