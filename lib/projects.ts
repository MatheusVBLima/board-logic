'use client';

// Saved projects live in the Supabase "projects" table; row level security keeps
// each user to their own rows and a trigger caps them at PROJECT_LIMIT.

import { isCircuit, type Circuit } from './circuit';
import { supabase } from './supabase/client';

export const PROJECT_LIMIT = 10;

export interface Project { id: string; name: string; circuit: Circuit; created_at: string; updated_at: string }
export type ProjectSummary = Omit<Project, 'circuit'> & { parts: number };

export class LimitError extends Error {}

function sb() {
  const c = supabase();
  if (!c) throw new Error('auth disabled');
  return c;
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const { data, error } = await sb().from('projects').select('id, name, circuit, created_at, updated_at').order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(({ circuit, ...p }) => ({ ...p, parts: Array.isArray(circuit?.comps) ? circuit.comps.length : 0 }));
}

export async function countProjects(): Promise<number> {
  const { count, error } = await sb().from('projects').select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await sb().from('projects').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data || !isCircuit(data.circuit)) return null;
  return data as Project;
}

export async function createProject(name: string, circuit: Circuit): Promise<Project> {
  const { data, error } = await sb().from('projects').insert({ name, circuit }).select().single();
  if (error) {
    if (error.message.includes('project_limit_reached')) throw new LimitError();
    throw error;
  }
  return data as Project;
}

export async function updateProject(id: string, patch: { name?: string; circuit?: Circuit }) {
  const { error } = await sb().from('projects').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteProject(id: string) {
  const { error } = await sb().from('projects').delete().eq('id', id);
  if (error) throw error;
}
