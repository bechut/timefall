import { IsNotEmpty, Length, MinLength } from 'class-validator';

export class SignUpDto {
  @IsNotEmpty()
  email: string;
  @IsNotEmpty()
  password: string;
  @MinLength(3)
  first_name: string;
  @MinLength(3)
  last_name: string;
}

export class LogInDto {
  @IsNotEmpty()
  email: string;
  @IsNotEmpty()
  password: string;
}

export class VerifyDto {
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;
}
