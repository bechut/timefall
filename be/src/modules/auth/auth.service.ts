import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import {
  DataSource,
  EntityManager,
  Repository,
  // LessThan,
  MoreThan,
  // Repository,
} from 'typeorm';
import { Profile } from 'src/orm/entity/profile.entity';
import { User } from 'src/orm/entity/user.entity';
import { Otp } from 'src/orm/entity/otp.entity';
import { XLogIn, XResend, XSignUp, XVerify } from './auth.controller';
import { InjectRepository } from '@nestjs/typeorm';
import { v4 } from 'uuid';
import { compare } from 'bcrypt';
import { otpContext } from 'src/constants/auth';
import * as moment from 'moment';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private dataSource: DataSource,
    private jwtService: JwtService,
    @InjectRepository(Otp) private otpRepository: Repository<Otp>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async sign_up(body: XSignUp) {
    const profile: Profile = new Profile();
    profile.first_name = body.first_name;
    profile.last_name = body.last_name;

    const user: User = new User();
    user.email = body.email;
    user.password = body.password;
    user.profile = profile;
    user.otp = [];

    const otp: Otp = new Otp();
    otp.id = body.otpId;
    otp.expired = body.otpExpiredDate;
    otp.user = user;
    otp.value = body.newOtp;
    otp.context = body.otpContext;
    otp.is_verify = false;

    return this.dataSource
      .transaction(async (manager: EntityManager) => {
        await manager.save(profile);
        await manager.save(user);
        await manager.save(otp);
      })
      .then(() => {
        return {
          message: 'Account successfully created. Please check you email.',
          token: body.otpJwt,
        };
      })
      .catch((e: any) => {
        throw new HttpException({ message: e.message }, HttpStatus.BAD_REQUEST);
      });
  }

  async verify(body: XVerify) {
    const { decode } = body;
    const otp = await this.otpRepository.findOne({
      where: {
        id: decode.id || v4(),
        value: body.otp,
        context: decode.otpContext,
        expired: MoreThan(new Date()),
      },
    });

    if (!otp) {
      throw new HttpException(
        { message: 'Otp has been expired' },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (decode.otpContext === otpContext.login) {
      await this.dataSource.transaction(async (manager: EntityManager) => {
        await manager.update(
          Otp,
          { id: decode.id },
          { is_verify: true, expired: moment().add(60, 'minutes').toDate() },
        );
        await manager.update(
          User,
          { email: decode.email },
          { is_active: true },
        );
      });
    } else {
      await this.dataSource.transaction(async (manager: EntityManager) => {
        await manager.delete(Otp, { id: decode.id });
        await manager.update(
          User,
          { email: decode.email },
          { is_active: true },
        );
      });
    }

    let response:
      | { message: string }
      | { message: string; token: string; expired: number } = {
      message: 'Your account has been verified.',
    };

    if (decode.otpContext === otpContext.login) {
      const expired = 60;
      response = {
        expired,
        ...response,
        token: this.jwtService.sign(
          {
            otpContext: decode.otpContext,
            otp: decode.otp,
            id: decode.id,
            email: decode.email,
          },
          { expiresIn: 60 * expired },
        ),
      };
    }

    return response;
  }

  async resend(body: XResend) {
    const otp = await this.otpRepository.findOne({
      where: {
        id: body.decode.id || v4(),
        value: body.decode.otp,
        context: body.decode.otpContext,
      },
    });

    if (!otp) {
      throw new HttpException(
        { message: 'Otp does not exists' },
        HttpStatus.NOT_FOUND,
      );
    }

    await this.dataSource.transaction(async (manager: EntityManager) => {
      await manager.update(
        Otp,
        { id: body.decode.id },
        {
          value: body.newOtp,
          expired: body.expired,
        },
      );
    });

    return { message: 'OTP has been resend to your email', token: body.otpJwt };
  }

  async login(body: XLogIn) {
    const sessions = await this.otpRepository.find({
      relations: ['user'],
      where: {
        is_verify: true,
        expired: MoreThan(new Date()),
        context: body.otpContext,
        user: {
          email: body.email,
        },
      },
    });

    if (sessions.length > 1) {
      throw new HttpException(
        { message: 'One account can only logged in 1 sessions at time' },
        HttpStatus.NOT_FOUND,
      );
    }

    const user = await this.userRepository.findOne({
      where: {
        email: body.email,
        is_active: true,
      },
    });

    if (!user) {
      throw new HttpException(
        { message: 'Account does not exists or inactivated' },
        HttpStatus.NOT_FOUND,
      );
    } else if (await compare(body.password, user.password)) {
      throw new HttpException(
        { message: 'Password does not match' },
        HttpStatus.NOT_FOUND,
      );
    }

    const otp = new Otp();
    otp.context = body.otpContext;
    otp.id = body.otpId;
    otp.expired = body.otpExpiredDate;
    otp.user = user;
    otp.value = body.newOtp;
    otp.context = body.otpContext;
    otp.is_verify = false;

    await this.otpRepository.save(otp);

    return { message: 'Login successfully', token: body.otpJwt };
  }
}
