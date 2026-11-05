import { CreateHolidayDto } from '@hrms/shared';
import { HolidayModel } from '../models/Holiday';
import { AppError } from '../utils/appError';

export class HolidayService {
  static async listHolidays(year?: number) {
    const targetYear = year || new Date().getFullYear();
    const regex = new RegExp(`^${targetYear}`);
    const holidays = await HolidayModel.find({ date: { $regex: regex } }).sort({ date: 1 });
    return holidays;
  }

  static async createHoliday(dto: CreateHolidayDto) {
    const existing = await HolidayModel.findOne({ date: dto.date });
    if (existing) {
      throw AppError.conflict(`A holiday on ${dto.date} is already scheduled`);
    }

    const holiday = await HolidayModel.create(dto);
    return holiday;
  }

  static async deleteHoliday(id: string) {
    const holiday = await HolidayModel.findByIdAndDelete(id);
    if (!holiday) {
      throw AppError.notFound('Holiday not found');
    }
    return holiday;
  }
}
