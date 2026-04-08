import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private cookieOptions(maxAge: number) {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ('none' as const) : ('lax' as const),
      maxAge,
    };
  }

  private setCookie(response: Response, name: string, value: string, maxAge: number) {
    response.cookie(name, value, {
      ...this.cookieOptions(maxAge),
    });
  }

  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(dto);
    this.setCookie(response, 'accessToken', result.accessToken, 15 * 60 * 1000);
    this.setCookie(
      response,
      'refreshToken',
      result.refreshToken,
      7 * 24 * 60 * 60 * 1000,
    );
    return result;
  }

  @Public()
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setCookie(response, 'accessToken', result.accessToken, 15 * 60 * 1000);
    this.setCookie(
      response,
      'refreshToken',
      result.refreshToken,
      7 * 24 * 60 * 60 * 1000,
    );
    return result;
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Body() dto: RefreshDto,
    @Req() request: Request & { cookies?: Record<string, string> },
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = dto.refreshToken ?? request.cookies?.refreshToken;
    const result = await this.authService.refresh(token);
    this.setCookie(response, 'accessToken', result.accessToken, 15 * 60 * 1000);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(
    @CurrentUser() user: { sub?: string } | null,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication required');
    }

    response.clearCookie('accessToken', this.cookieOptions(0));
    response.clearCookie('refreshToken', this.cookieOptions(0));
    response.clearCookie('guestToken', this.cookieOptions(0));
    return this.authService.logout(user.sub);
  }

  @Public()
  @Post('guest')
  async guest(@Res({ passthrough: true }) response: Response) {
    const result = await this.authService.initGuestSession();
    this.setCookie(response, 'guestToken', result.guestToken, 24 * 60 * 60 * 1000);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: { sub?: string } | null) {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication required');
    }

    return this.authService.getMe(user.sub);
  }
}
