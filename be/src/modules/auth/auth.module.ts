import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';
import { User } from 'src/orm/entity/user.entity';
import { Otp } from 'src/orm/entity/otp.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { envPath, jwtRegister } from 'src/constants/module.register';

@Module({
  imports: [
    ConfigModule.forRoot(envPath),
    TypeOrmModule.forFeature([User, Otp]),
    JwtModule.registerAsync(jwtRegister),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
