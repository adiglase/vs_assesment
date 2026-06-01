import { z } from 'zod'
import { locationTypes } from './jobs.types'

export const createJobSchema = z.object({
  caseName: z.string().trim().min(1, 'Case name is required'),
  durationMinutes: z.number().int().positive('Duration must be greater than zero'),
  locationType: z.enum(locationTypes),
  city: z.string().trim().min(1, 'City is required').optional()
}).strict().superRefine((value, ctx) => {
  if (value.locationType === 'PHYSICAL' && value.city === undefined) {
    ctx.addIssue({
      code: 'custom',
      path: ['city'],
      message: 'Physical jobs require a city'
    })
  }

  if (value.locationType === 'REMOTE' && value.city !== undefined) {
    ctx.addIssue({
      code: 'custom',
      path: ['city'],
      message: 'Remote jobs must not include a city'
    })
  }
})

export const jobIdParamsSchema = z.object({
  id: z.coerce.number().int().positive('Job id must be a positive integer')
}).strict()

export const assignReporterSchema = z.object({
  reporterId: z.number().int().positive('Reporter id must be a positive integer').optional()
}).strict()
