import jwt from 'jsonwebtoken';
import { UserRole, CurrentUserSession } from '@hrms/shared';
import { UserModel, IUserDocument } from '../models/User';
import { EmployeeModel } from '../models/Employee';
import { AppError } from '../utils/appError';
import { env } from '../config/env.config';

export class AuthService {
  static generateTokens(user: IUserDocument) {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      employeeId: user.employeeId?.toString(),
    };

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY as any,
    });

    const refreshToken = jwt.sign({ userId: user._id.toString() }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRY as any,
    });

    return { accessToken, refreshToken };
  }

  static async login(email: string, passwordCandidate: string) {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw AppError.unauthorized('Account has been deactivated. Please contact HR.');
    }

    const isMatch = await user.comparePassword(passwordCandidate);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const { accessToken, refreshToken } = this.generateTokens(user);

    // Refresh token rotation: keep at most 5 active sessions
    user.refreshTokens = [...user.refreshTokens.slice(-4), refreshToken];
    await user.save();

    let employeeInfo: CurrentUserSession = {
      userId: user._id.toString(),
      employeeId: user.employeeId?.toString(),
      email: user.email,
      firstName: 'Admin',
      lastName: 'User',
      role: user.role,
      isFirstLogin: user.isFirstLogin,
    };

    if (user.employeeId) {
      const emp = await EmployeeModel.findById(user.employeeId);
      if (emp) {
        employeeInfo = {
          ...employeeInfo,
          firstName: emp.firstName,
          lastName: emp.lastName,
          avatarUrl: emp.avatarUrl,
        };
      }
    }

    return { user: employeeInfo, accessToken, refreshToken };
  }

  static async refresh(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string };
      const user = await UserModel.findById(decoded.userId);

      if (!user || !user.isActive || !user.refreshTokens.includes(refreshToken)) {
        throw AppError.unauthorized('Invalid or expired refresh token');
      }

      // Rotate token: remove old one and issue new one
      user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
      const tokens = this.generateTokens(user);
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();

      return tokens;
    } catch {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }
  }

  static async logout(userId: string, refreshToken?: string) {
    const user = await UserModel.findById(userId);
    if (user && refreshToken) {
      user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
      await user.save();
    }
  }

  static async getMe(userId: string): Promise<CurrentUserSession> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    let session: CurrentUserSession = {
      userId: user._id.toString(),
      employeeId: user.employeeId?.toString(),
      email: user.email,
      firstName: 'User',
      lastName: '',
      role: user.role,
      isFirstLogin: user.isFirstLogin,
    };

    if (user.employeeId) {
      const emp = await EmployeeModel.findById(user.employeeId);
      if (emp) {
        session = {
          ...session,
          firstName: emp.firstName,
          lastName: emp.lastName,
          avatarUrl: emp.avatarUrl,
        };
      }
    }

    return session;
  }
}
