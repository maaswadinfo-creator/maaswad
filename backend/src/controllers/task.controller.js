import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created } from '../utils/apiResponse.js';
import AdminTask from '../models/AdminTask.js';
import { notify } from '../services/notification.service.js';

// GET /admin/tasks
export const listTasks = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
  // Ops managers see only their own tasks; owners see all
  if (req.user.activeRole === 'operations_manager') filter.assignedTo = req.user._id;
  const tasks = await AdminTask.find(filter)
    .populate('assignedTo', 'name phone email')
    .populate('createdBy', 'name phone')
    .sort({ priority: -1, createdAt: -1 })
    .limit(200);
  ok(res, tasks);
});

// POST /admin/tasks
export const createTask = asyncHandler(async (req, res) => {
  const { title, description, priority, category, assignedTo, dueDate, refModel, refId } = req.body;
  if (!title) throw ApiError.badRequest('Title is required');
  const task = await AdminTask.create({
    title, description, priority, category, assignedTo, dueDate, refModel, refId,
    createdBy: req.user._id,
  });
  // Notify assigned user
  if (assignedTo) {
    await notify({ user: assignedTo, title: `New task assigned: ${title}`, body: description || '', type: 'system', channels: ['in_app', 'email'] });
  }
  const populated = await task.populate('assignedTo', 'name phone email');
  created(res, populated, 'Task created');
});

// PATCH /admin/tasks/:id
export const updateTask = asyncHandler(async (req, res) => {
  const task = await AdminTask.findById(req.params.id);
  if (!task) throw ApiError.notFound('Task not found');
  // Ops managers can only update status/notes on their own tasks
  if (req.user.activeRole === 'operations_manager') {
    if (String(task.assignedTo) !== String(req.user._id)) throw ApiError.forbidden('Not your task');
    const { status, note } = req.body;
    if (status) task.status = status;
    if (note) task.notes.push({ body: note, by: req.user._id });
    if (status === 'done') task.completedAt = new Date();
  } else {
    // Owner can update anything
    const { title, description, priority, status, category, assignedTo, dueDate, note } = req.body;
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (status) { task.status = status; if (status === 'done') task.completedAt = new Date(); }
    if (category) task.category = category;
    if (assignedTo !== undefined) {
      task.assignedTo = assignedTo;
      if (assignedTo) {
        await notify({ user: assignedTo, title: `Task assigned: ${task.title}`, body: task.description || '', type: 'system', channels: ['in_app', 'email'] });
      }
    }
    if (dueDate) task.dueDate = dueDate;
    if (note) task.notes.push({ body: note, by: req.user._id });
  }
  await task.save();
  const populated = await task.populate([
    { path: 'assignedTo', select: 'name phone email' },
    { path: 'notes.by', select: 'name' },
  ]);
  ok(res, populated, 'Task updated');
});

// DELETE /admin/tasks/:id  (owner only)
export const deleteTask = asyncHandler(async (req, res) => {
  await AdminTask.findByIdAndDelete(req.params.id);
  ok(res, null, 'Task deleted');
});

// GET /admin/tasks/stats  — counts for the dashboard widget
export const taskStats = asyncHandler(async (req, res) => {
  const base = req.user.activeRole === 'operations_manager' ? { assignedTo: req.user._id } : {};
  const [open, inProgress, done, overdue] = await Promise.all([
    AdminTask.countDocuments({ ...base, status: 'open' }),
    AdminTask.countDocuments({ ...base, status: 'in_progress' }),
    AdminTask.countDocuments({ ...base, status: 'done' }),
    AdminTask.countDocuments({ ...base, status: { $in: ['open', 'in_progress'] }, dueDate: { $lt: new Date() } }),
  ]);
  ok(res, { open, inProgress, done, overdue });
});
