/**
 * Validation utilities for project-department operations
 */

import { Project } from '@/lib/types';
import { Department } from '@/lib/department-service';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Validate project assignment to department
 */
export function validateProjectAssignment(
  project: Project | null,
  departmentId: string,
  userId: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic input validation
  if (!project) {
    errors.push('Project not found or invalid');
  }

  if (!departmentId || typeof departmentId !== 'string' || departmentId.trim() === '') {
    errors.push('Department ID is required');
  }

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    errors.push('User ID is required for assignment');
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  // Project-specific validations
  if (project) {
    // Check if project is already assigned to this department
    if (project.departmentId === departmentId.trim()) {
      errors.push('Project is already assigned to this department');
    }

    // Check project status
    if (project.status === 'archived') {
      errors.push('Cannot assign archived projects to departments');
    }

    if (project.status === 'completed') {
      warnings.push('Assigning completed projects to departments may not be necessary');
    }

    // Check if project has active tasks
    if (project.status === 'active' && project.progress > 50) {
      warnings.push('This project is already in progress. Department assignment may affect ongoing work.');
    }

    // Check if project is already assigned to another department
    if (project.departmentId && project.departmentId !== departmentId.trim()) {
      warnings.push(`Project is currently assigned to another department. This will reassign it.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Validate project removal from department
 */
export function validateProjectRemoval(
  project: Project | null,
  userId: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic input validation
  if (!project) {
    errors.push('Project not found or invalid');
  }

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    errors.push('User ID is required for removal');
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  // Project-specific validations
  if (project) {
    // Check if project is assigned to any department
    if (!project.departmentId) {
      errors.push('Project is not assigned to any department');
    }

    // Check project status
    if (project.status === 'archived') {
      errors.push('Cannot modify department assignment for archived projects');
    }

    // Warn about active projects
    if (project.status === 'active' && project.progress > 0) {
      warnings.push('Removing an active project from its department may affect ongoing work and team coordination.');
    }

    // Warn about projects with high progress
    if (project.progress > 75) {
      warnings.push('This project is nearly complete. Consider keeping it assigned until completion.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Validate department data for project operations
 */
export function validateDepartmentForProjects(
  department: Department | null
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!department) {
    errors.push('Department not found or invalid');
    return { isValid: false, errors };
  }

  // Check department status
  if (department.status === 'inactive') {
    errors.push('Cannot assign projects to inactive departments');
  }

  // Check if department has members
  if (department.memberCount === 0) {
    warnings.push('This department has no members. Consider assigning team members before adding projects.');
  }

  // Check if department has a head
  if (!department.headId) {
    warnings.push('This department has no assigned head. Consider assigning a department head for better project oversight.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Validate bulk project operations
 */
export function validateBulkProjectAssignment(
  projects: Project[],
  departmentId: string,
  userId: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!projects || projects.length === 0) {
    errors.push('No projects selected for assignment');
  }

  if (!departmentId || typeof departmentId !== 'string' || departmentId.trim() === '') {
    errors.push('Department ID is required');
  }

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    errors.push('User ID is required for assignment');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Validate each project
  const archivedProjects = projects.filter(p => p.status === 'archived');
  const alreadyAssigned = projects.filter(p => p.departmentId === departmentId.trim());
  const activeProjects = projects.filter(p => p.status === 'active' && p.progress > 50);

  if (archivedProjects.length > 0) {
    errors.push(`Cannot assign ${archivedProjects.length} archived project(s)`);
  }

  if (alreadyAssigned.length > 0) {
    warnings.push(`${alreadyAssigned.length} project(s) are already assigned to this department`);
  }

  if (activeProjects.length > 0) {
    warnings.push(`${activeProjects.length} active project(s) with significant progress will be reassigned`);
  }

  if (projects.length > 10) {
    warnings.push('Assigning a large number of projects at once may impact performance');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Sanitize and normalize input data
 */
export function sanitizeProjectDepartmentInput(input: {
  projectId?: string;
  departmentId?: string;
  userId?: string;
}) {
  return {
    projectId: input.projectId?.trim() || '',
    departmentId: input.departmentId?.trim() || '',
    userId: input.userId?.trim() || ''
  };
}

/**
 * Check if user has permission to modify project-department assignments
 */
export function validateUserPermissions(
  userRole: string,
  project: Project | null,
  userId: string
): ValidationResult {
  const errors: string[] = [];

  // Admin and owner can always modify
  if (userRole === 'owner' || userRole === 'admin') {
    return { isValid: true, errors: [] };
  }

  if (!project) {
    errors.push('Cannot validate permissions: project not found');
    return { isValid: false, errors };
  }

  // Project owner can modify
  if (project.ownerId === userId) {
    return { isValid: true, errors: [] };
  }

  // Project admin can modify
  if (project.projectAdmins?.includes(userId)) {
    return { isValid: true, errors: [] };
  }

  errors.push('You do not have permission to modify this project\'s department assignment');
  return { isValid: false, errors };
}