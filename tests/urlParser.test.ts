import { describe, it, expect } from 'vitest';
import { parseGitHubUrl } from '../src/server/utils/urlParser';

describe('GitHub URL Parser', () => {
  it('parses standard https repository URL', () => {
    const result = parseGitHubUrl('https://github.com/facebook/react');
    expect(result.owner).toBe('facebook');
    expect(result.repo).toBe('react');
  });

  it('parses http URL with trailing slash', () => {
    const result = parseGitHubUrl('http://github.com/vercel/next.js/');
    expect(result.owner).toBe('vercel');
    expect(result.repo).toBe('next.js');
  });

  it('parses URL with .git extension', () => {
    const result = parseGitHubUrl('https://github.com/torvalds/linux.git');
    expect(result.owner).toBe('torvalds');
    expect(result.repo).toBe('linux');
  });

  it('parses deep subpage URLs (tree, issues, pulls)', () => {
    const result = parseGitHubUrl('https://github.com/expressjs/express/tree/master/lib');
    expect(result.owner).toBe('expressjs');
    expect(result.repo).toBe('express');

    const result2 = parseGitHubUrl('https://github.com/vuejs/core/pull/1234');
    expect(result2.owner).toBe('vuejs');
    expect(result2.repo).toBe('core');
  });

  it('parses short owner/repo slug format', () => {
    const result = parseGitHubUrl('facebook/react');
    expect(result.owner).toBe('facebook');
    expect(result.repo).toBe('react');
  });

  it('parses github.com/owner/repo without protocol', () => {
    const result = parseGitHubUrl('github.com/tailwindlabs/tailwindcss');
    expect(result.owner).toBe('tailwindlabs');
    expect(result.repo).toBe('tailwindcss');
  });

  it('parses SSH git clone format', () => {
    const result = parseGitHubUrl('git@github.com:microsoft/vscode.git');
    expect(result.owner).toBe('microsoft');
    expect(result.repo).toBe('vscode');
  });

  it('handles query parameters and hash fragments', () => {
    const result = parseGitHubUrl('https://github.com/denoland/deno?tab=readme#install');
    expect(result.owner).toBe('denoland');
    expect(result.repo).toBe('deno');
  });

  it('throws error for empty or whitespace-only inputs', () => {
    expect(() => parseGitHubUrl('')).toThrow('Please enter a GitHub repository URL');
    expect(() => parseGitHubUrl('   ')).toThrow('Repository input cannot be blank.');
  });

  it('throws error for single word or invalid format without slash', () => {
    expect(() => parseGitHubUrl('facebook')).toThrow('Invalid format');
    expect(() => parseGitHubUrl('react')).toThrow('Invalid format');
  });

  it('throws error for non-GitHub URLs', () => {
    expect(() => parseGitHubUrl('https://gitlab.com/owner/repo')).toThrow(
      'Only GitHub repositories (github.com) are supported.'
    );
  });

  it('throws error for invalid characters in username or repo', () => {
    expect(() => parseGitHubUrl('invalid user/repo')).toThrow('Invalid GitHub username');
  });
});
