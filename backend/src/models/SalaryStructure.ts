import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISalaryStructureDocument extends Document {
  employeeId: mongoose.Types.ObjectId;
  basic: number;
  hra: number;
  conveyance: number;
  specialAllowance: number;
  medicalAllowance: number;
  grossSalary: number;

  pfApplicable: boolean;
  pfEmployeePercent: number;
  pfEmployerPercent: number;

  esiApplicable: boolean;
  esiEmployeePercent: number;
  esiEmployerPercent: number;

  professionalTax: number;
  monthlyTds: number;
  totalDeductions: number;
  netSalary: number;

  createdAt: Date;
  updatedAt: Date;
}

const SalaryStructureSchema = new Schema<ISalaryStructureDocument>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      unique: true,
      index: true,
    },
    basic: { type: Number, required: true, default: 0 },
    hra: { type: Number, default: 0 },
    conveyance: { type: Number, default: 0 },
    specialAllowance: { type: Number, default: 0 },
    medicalAllowance: { type: Number, default: 0 },
    grossSalary: { type: Number, required: true, default: 0 },

    pfApplicable: { type: Boolean, default: true },
    pfEmployeePercent: { type: Number, default: 12 },
    pfEmployerPercent: { type: Number, default: 12 },

    esiApplicable: { type: Boolean, default: false },
    esiEmployeePercent: { type: Number, default: 0.75 },
    esiEmployerPercent: { type: Number, default: 3.25 },

    professionalTax: { type: Number, default: 200 },
    monthlyTds: { type: Number, default: 0 },
    totalDeductions: { type: Number, required: true, default: 0 },
    netSalary: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
  },
);

SalaryStructureSchema.pre('save', function (next) {
  this.grossSalary =
    this.basic + this.hra + this.conveyance + this.specialAllowance + this.medicalAllowance;

  let employeePf = 0;
  if (this.pfApplicable) {
    employeePf = (this.basic * this.pfEmployeePercent) / 100;
  }

  let employeeEsi = 0;
  if (this.esiApplicable) {
    employeeEsi = (this.grossSalary * this.esiEmployeePercent) / 100;
  }

  this.totalDeductions = Math.round(
    employeePf + employeeEsi + this.professionalTax + this.monthlyTds,
  );
  this.netSalary = Math.round(this.grossSalary - this.totalDeductions);
  next();
});

export const SalaryStructureModel: Model<ISalaryStructureDocument> =
  mongoose.model<ISalaryStructureDocument>('SalaryStructure', SalaryStructureSchema);
