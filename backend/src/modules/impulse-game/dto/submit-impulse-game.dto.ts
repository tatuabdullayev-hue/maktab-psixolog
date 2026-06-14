import { IsInt, Min } from 'class-validator';

export class SubmitImpulseGameDto {
  @IsInt()
  @Min(0)
  goTotal: number;

  @IsInt()
  @Min(0)
  omissionErrors: number;

  @IsInt()
  @Min(0)
  noGoTotal: number;

  @IsInt()
  @Min(0)
  commissionErrors: number;

  @IsInt()
  @Min(0)
  avgReactionTimeMs: number;

  @IsInt()
  @Min(0)
  reactionTimeSdMs: number;
}
