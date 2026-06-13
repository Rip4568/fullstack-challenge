import { IsNumber, Min } from "class-validator";

export class CashoutDto {
  @IsNumber()
  @Min(1.00, { message: "Multiplier must be at least 1.00" })
  multiplier: number;
}
