import { ConfigModule, ConfigService } from '@nestjs/config';

export const jwtRegister = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    secret: configService.get<string>('JWT_SECRET'),
  }),
};

export const envPath = { envFilePath: ['env.env'] };
