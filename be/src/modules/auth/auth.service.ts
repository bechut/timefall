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
import { LinkGoogleType, User } from 'src/orm/entity/user.entity';
import { Otp } from 'src/orm/entity/otp.entity';
import {
  XLogIn,
  XLogInWidthGoogle,
  XResend,
  XSignUp,
  XVerify,
} from './auth.controller';
import { InjectRepository } from '@nestjs/typeorm';
import { v4 } from 'uuid';
import { compare } from 'bcrypt';
import { EXPIRED_IN_MINUTES, otpContext } from 'src/constants/auth';
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

    const loginCondition =
      otpContext.login === decode.otpContext ||
      otpContext.sign_up_google === decode.otpContext;

    if (loginCondition) {
      await this.dataSource.transaction(async (manager: EntityManager) => {
        await manager.update(
          Otp,
          { id: decode.id },
          {
            is_verify: true,
            context: otpContext.login,
            expired: moment().add(EXPIRED_IN_MINUTES.login, 'minutes').toDate(),
          },
        );
        await manager.update(
          User,
          { email: decode.email },
          otpContext.sign_up_google === decode.otpContext
            ? {
                is_active: true,
                is_linked_google: true,
              }
            : {
                is_active: true,
              },
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

    if (loginCondition) {
      const expired = EXPIRED_IN_MINUTES.login;
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
    if (body.otpContext === otpContext.login) {
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
      } else if (!(await compare(body.password, user.password))) {
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
    } else {
      return {
        message: 'Please enter the otp to link your account',
        token: body.otpJwt,
      };
    }
  }

  async loginWithGoogle(body: XLogInWidthGoogle) {
    const user = await this.userRepository.findOne({
      where: {
        email: body.email,
      },
    });

    if (!user) {
      body.type = LinkGoogleType.NO_LINK_NO_CREATED;
    } else {
      if (!user.is_linked_google) {
        body.type = LinkGoogleType.NO_LINK;
      } else {
        body.type = LinkGoogleType.LINKED;
      }
    }

    if (body.type === LinkGoogleType.NO_LINK_NO_CREATED) {
      const profile = new Profile();
      profile.avatar = body.picture;
      profile.first_name = body.family_name;
      profile.last_name = body.given_name;

      const user = new User();
      user.email = body.email;
      user.profile = profile;
      user.is_linked_google = true;
      user.otp = [];

      const otp = new Otp();
      otp.context = otpContext.sign_up_google;
      otp.id = body.otpId;
      otp.value = body.otp;
      otp.user = user;
      otp.expired = body.expiredDate;

      user.otp.push(otp);

      return this.dataSource
        .transaction(async (manager: EntityManager) => {
          await manager.save(profile);
          await manager.save(user);
          await manager.save(otp);
        })
        .then(() => {
          return {
            type: body.type,
            message: 'Account successfully linked. Please check you email.',
            token: body.otpJwt,
          };
        })
        .catch((e: any) => {
          throw new HttpException(
            { message: e.message },
            HttpStatus.BAD_REQUEST,
          );
        });
    } else if (body.type === LinkGoogleType.NO_LINK) {
      const otp = new Otp();
      otp.context = otpContext.sign_up_google;
      otp.id = body.otpId;
      otp.value = body.otp;
      otp.user = user;
      otp.expired = body.expiredDate;

      return this.dataSource
        .transaction(async (manager: EntityManager) => {
          await manager.save(otp);
        })
        .then(() => {
          return {
            type: body.type,
            message:
              'Your account does not link yet. Please login to link your account.',
            token: this.jwtService.sign(
              {
                otpContext: otpContext.sign_up_google,
                id: body.otpId,
                email: body.email,
                otp: body.otp,
              },
              { expiresIn: 60 * EXPIRED_IN_MINUTES.verify },
            ),
          };
        })
        .catch((e: any) => {
          throw new HttpException(
            { message: e.message },
            HttpStatus.BAD_REQUEST,
          );
        });
    } else {
      const sessions = await this.otpRepository.find({
        relations: ['user'],
        where: {
          is_verify: true,
          expired: MoreThan(new Date()),
          context: otpContext.login,
          user: {
            email: body.email,
            is_linked_google: true,
          },
        },
      });

      if (sessions.length > 1) {
        throw new HttpException(
          { message: 'One account can only logged in 1 sessions at time' },
          HttpStatus.NOT_FOUND,
        );
      }

      const otp = new Otp();
      otp.context = otpContext.login;
      otp.id = body.otpId;
      otp.value = body.otp;
      otp.user = user;
      otp.expired = moment().add(EXPIRED_IN_MINUTES.login, 'minutes').toDate();
      await this.otpRepository.save(otp);
      const jwt = this.jwtService.sign(
        {
          id: body.otpId,
          otpContext: otpContext.login,
          email: body.email,
        },
        { expiresIn: 60 * EXPIRED_IN_MINUTES.login },
      );
      return {
        message: 'Log in successfully',
        token: jwt,
        type: body.type,
        expired: EXPIRED_IN_MINUTES.login,
      };
    }
  }
}
