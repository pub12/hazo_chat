/**
 * file_description: API route to get test files
 * 
 * This API route reads the contents of the `public/test_files` directory
 * and returns a list of filenames.
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const test_files_dir = path.join(process.cwd(), 'public', 'test_files');

  try {
    const files = fs.readdirSync(test_files_dir);
    const file_references = files.map((file, index) => ({
      id: String(index + 1),
      name: file,
      type: 'document' as const,
      url: `/test_files/${file}`
    }));

    return NextResponse.json({ success: true, files: file_references });
  } catch (error) {
    console.error('Error reading test_files directory:', error);
    return NextResponse.json({ success: false, error: 'Failed to read test files directory' }, { status: 500 });
  }
}
