import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsIn,
} from 'class-validator';

export class CreateChallengeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsIn(['daily', 'weekly'])
  @IsNotEmpty()
  type: string; // obligatoire

  @IsIn(['daily', 'weekly'])
  @IsNotEmpty()
  frequency: string; // obligatoire

  @IsNumber()
  @IsOptional()
  points?: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsBoolean()
  @IsOptional()
  isDaily?: boolean;

  @IsDateString()
  @IsOptional()
  date?: string;
}