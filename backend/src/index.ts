import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from './config/db';
import Employee from './models/Employee';
import User from './models/User';
import Competence from './models/Competence';
import ShiftAssignment from './models/ShiftAssignment';
import Absence, { AbsenceStatus } from './models/Absence';
import Workstation from './models/Workstation';
import { generateSchedule } from './services/scheduler';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Middleware for authentication
const protect = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token failed' });
  }
};

// Middleware for roles
const authorize = (...roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// --- AUTH ROUTES ---

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username }).populate('employee');
    
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { id: user._id, role: user.role, employeeId: user.employee?.employeeId },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      res.json({
        _id: user._id,
        username: user.username,
        role: user.role,
        firstName: user.employee?.firstName || user.username,
        lastName: user.employee?.lastName || '',
        employeeId: user.employee?.employeeId,
        token
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// --- PROTECTED ROUTES ---

// Employees
app.get('/api/employees', protect, async (req, res) => {
  try {
    const employees = await Employee.find({});
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Competences
app.get('/api/competences', protect, async (req, res) => {
  try {
    const competences = await Competence.find({}).populate('employee');
    res.json(competences);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Workstations
app.get('/api/workstations', protect, async (req, res) => {
  try {
    const workstations = await Workstation.find({});
    res.json(workstations);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Schedule
app.get('/api/schedule', protect, async (req, res) => {
  try {
    const shifts = await ShiftAssignment.find({}).populate('employee');
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Generate Schedule (Planner only)
app.post('/api/schedule/generate', protect, authorize('PLANNER', 'ADMIN'), async (req, res) => {
  try {
    const { startDate } = req.body;
    const date = startDate ? new Date(startDate) : new Date();
    const shifts = await generateSchedule(date, 7);
    await ShiftAssignment.deleteMany({ date: { $gte: date } });
    const savedShifts = await ShiftAssignment.insertMany(shifts);
    res.json({ message: 'Schedule generated successfully', count: savedShifts.length });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Absences
app.get('/api/absences', protect, async (req, res) => {
  try {
    const absences = await Absence.find({}).populate('employee');
    res.json(absences);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

app.post('/api/absences', protect, async (req, res) => {
  try {
    const { employeeId, type, startDate, endDate, reason } = req.body;
    const emp = await Employee.findOne({ employeeId });
    if (!emp) return res.status(404).json({ message: 'Employee not found' });

    const absence = new Absence({
      employee: emp._id,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason
    });
    await absence.save();
    res.json(absence);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/absences/:id', protect, authorize('PLANNER', 'ADMIN'), async (req, res) => {
  try {
    const { status } = req.body;
    const absence = await Absence.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('employee');
    
    if (status === 'APPROVED' && absence) {
      const startDate = new Date();
      const shifts = await generateSchedule(startDate, 7);
      await ShiftAssignment.deleteMany({ date: { $gte: startDate } });
      await ShiftAssignment.insertMany(shifts);
    }
    
    res.json(absence);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
