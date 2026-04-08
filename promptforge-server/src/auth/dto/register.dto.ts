import { IsEmail, IsString, MinLength } from 'class-validator';
import { Match } from '../../common/dto/match.decorator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @Match<RegisterDto>('password', {
    message: 'confirmPassword must match password',
  })
  confirmPassword!: string;
}
