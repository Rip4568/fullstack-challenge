import { IsInt, Min, Max, IsString, IsOptional } from "class-validator";

export class PlaceBetDto {
  @IsInt()
  @Min(100, { message: "Bet amount must be at least 1.00 (100 cents)" })
  @Max(100000, { message: "Bet amount cannot exceed 1,000.00 (100,000 cents)" })
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;
}
