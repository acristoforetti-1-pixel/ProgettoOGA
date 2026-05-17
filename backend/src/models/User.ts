import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export enum UserRole {
  OPERATOR = 'OPERATOR',
  PLANNER = 'PLANNER',
  ADMIN = 'ADMIN'
}

export interface IUser extends Document {
  username: string;
  password: string;
  role: UserRole;
  employee?: mongoose.Types.ObjectId;
  comparePassword: (password: string) => Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: Object.values(UserRole), default: UserRole.OPERATOR },
  employee: { type: Schema.Types.ObjectId, ref: 'Employee' },
}, { timestamps: true });

// Hash password before saving
UserSchema.pre<IUser>('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function(password: string) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
