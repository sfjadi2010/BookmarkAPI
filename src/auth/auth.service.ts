import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { AuthDto } from './dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}
  async singup(dto: AuthDto) {
    // generate the password hash
    const password = await argon.hash(dto.password);
    // save the new user to the database
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password,
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      });

      delete user.password;
      // return the new user
      console.log({ user });
      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        console.log(error);
        return { message: 'An error occurred' };
      }
    }
  }

  async signin(dto: AuthDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new ForbiddenException('Invalid credentials');
    }

    const valid = await argon.verify(user.password, dto.password);
    if (!valid) {
      throw new ForbiddenException('Invalid credentials');
    }
    delete user.password;
    return user;
  }
}
