import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
    imports: [
        ConfigModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('app.jwtSecret'),
                signOptions: {
                    expiresIn: configService.get<string>('app.jwtExpiresIn'),
                },
            }),
            inject: [ConfigService],
        }),
        UsersModule,
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        JwtStrategy,
        LocalStrategy,
        JwtAuthGuard,
        LocalAuthGuard,
    ],
    exports: [AuthService, JwtAuthGuard],
})
export class AuthModule { }