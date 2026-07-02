/**
 * 任务队列服务
 * 用于 AI 会诊等耗时任务的多用户并发控制
 */

import { config } from '../config/env';

export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface QueueTask {
  id: string;
  reportId: string;
  patientId: string;
  status: QueueStatus;
  addedAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

export class TaskQueueService {
  private queue: QueueTask[] = [];
  private processingCount = 0;
  private readonly maxConcurrent: number;
  private readonly processingCallbacks: Map<string, (reportId: string, patientId: string) => Promise<void>> = new Map();

  constructor(maxConcurrent: number = 2) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * 注册任务处理器
   */
  public registerHandler(taskType: string, handler: (reportId: string, patientId: string) => Promise<void>): void {
    this.processingCallbacks.set(taskType, handler);
  }

  /**
   * 添加任务到队列
   */
  public enqueue(reportId: string, patientId: string, taskType: string = 'ai-consultation'): string {
    // 检查是否已存在相同报告的任务
    const existingTask = this.queue.find(t => t.reportId === reportId);
    if (existingTask) {
      // 如果任务已在队列中，返回现有任务ID
      return existingTask.id;
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const task: QueueTask = {
      id: taskId,
      reportId,
      patientId,
      status: 'pending',
      addedAt: Date.now(),
    };

    this.queue.push(task);
    console.log(`[TaskQueue] 任务 ${taskId} (报告: ${reportId}) 已加入队列，当前队列位置: ${this.getQueuePosition(taskId)}`);

    // 尝试处理队列
    this.processNext();

    return taskId;
  }

  /**
   * 获取任务状态
   */
  public getTaskStatus(reportId: string): { status: QueueStatus; position: number } | null {
    const task = this.queue.find(t => t.reportId === reportId);
    if (!task) {
      // 如果任务不在队列中，检查是否已完成或失败（已移除队列）
      return null;
    }
    const position = this.getQueuePosition(task.id);
    return {
      status: task.status,
      position,
    };
  }

  /**
   * 获取队列位置
   */
  public getQueuePosition(taskId: string): number {
    const pendingTasks = this.queue.filter(t => t.status === 'pending');
    const taskIndex = pendingTasks.findIndex(t => t.id === taskId);
    return taskIndex + 1; // 1-based
  }

  /**
   * 获取当前等待队列长度
   */
  public getPendingCount(): number {
    return this.queue.filter(t => t.status === 'pending').length;
  }

  /**
   * 获取正在处理的任务数
   */
  public getProcessingCount(): number {
    return this.processingCount;
  }

  /**
   * 处理下一个任务
   */
  private processNext(): void {
    if (this.processingCount >= this.maxConcurrent) {
      console.log(`[TaskQueue] 达到最大并发数 ${this.maxConcurrent}，等待中...`);
      return;
    }

    const pendingTask = this.queue.find(t => t.status === 'pending');
    if (!pendingTask) {
      return;
    }

    // 更新任务状态
    pendingTask.status = 'processing';
    pendingTask.startedAt = Date.now();
    this.processingCount++;

    console.log(`[TaskQueue] 开始处理任务 ${pendingTask.id} (报告: ${pendingTask.reportId})，当前并发: ${this.processingCount}`);

    // 执行任务
    this.executeTask(pendingTask);
  }

  /**
   * 执行具体任务
   */
  private async executeTask(task: QueueTask): Promise<void> {
    const handler = this.processingCallbacks.get('ai-consultation');
    
    if (!handler) {
      console.error(`[TaskQueue] 未找到任务处理器: ai-consultation`);
      task.status = 'failed';
      task.error = '未找到任务处理器';
      this.finishTask(task);
      return;
    }

    try {
      await handler(task.reportId, task.patientId);
      task.status = 'completed';
      task.completedAt = Date.now();
      console.log(`[TaskQueue] 任务 ${task.id} 完成，耗时: ${task.completedAt - task.startedAt}ms`);
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
      console.error(`[TaskQueue] 任务 ${task.id} 失败:`, task.error);
    }

    this.finishTask(task);
  }

  /**
   * 完成任务处理
   */
  private finishTask(task: QueueTask): void {
    this.processingCount--;
    
    // 从队列中移除已完成的任务
    const index = this.queue.findIndex(t => t.id === task.id);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }

    // 尝试处理下一个任务
    this.processNext();
  }

  /**
   * 获取所有队列状态（用于调试）
   */
  public getQueueStatus(): { pending: number; processing: number; maxConcurrent: number } {
    return {
      pending: this.queue.filter(t => t.status === 'pending').length,
      processing: this.processingCount,
      maxConcurrent: this.maxConcurrent,
    };
  }
}

// 单例实例
export const taskQueueService = new TaskQueueService(
  parseInt(process.env.AI_CONSULTATION_MAX_CONCURRENT || '2', 10)
);